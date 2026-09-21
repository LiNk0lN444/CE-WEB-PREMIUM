-- ============================================================
-- MIGRACIÓN: SISTEMA DE RESERVAS CON FECHAS
-- CE-Web
-- Ejecutar UNA sola vez. Es idempotente (se puede re-ejecutar).
-- ============================================================

\echo '🔧 Paso 1: Extendiendo tabla cotizaciones...'

-- ============================================================
-- 1. NUEVOS CAMPOS EN cotizaciones
-- ============================================================
ALTER TABLE cotizaciones
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS approved_by INT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS notificado_vencimiento BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS fecha_notificacion TIMESTAMP;

-- ============================================================
-- 2. FK del admin aprobador (si no existe)
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'cotizaciones_approved_by_fkey'
    ) THEN
        ALTER TABLE cotizaciones
        ADD CONSTRAINT cotizaciones_approved_by_fkey
        FOREIGN KEY (approved_by) REFERENCES Users(user_id);
    END IF;
END $$;

-- ============================================================
-- 3. Extender el CHECK de status
-- ============================================================
ALTER TABLE cotizaciones
DROP CONSTRAINT IF EXISTS cotizaciones_status_check;

ALTER TABLE cotizaciones
ADD CONSTRAINT cotizaciones_status_check
CHECK (status IN (
    'pending', 'approved', 'rejected',
    'active', 'completed', 'cancelled'
));

\echo '🔢 Paso 2: Ampliando tipos numéricos...'

-- ============================================================
-- 4. AMPLIAR TIPOS NUMÉRICOS (fix del bug de desbordamiento)
-- ============================================================
ALTER TABLE cotizaciones ALTER COLUMN iva TYPE NUMERIC(12, 2);
ALTER TABLE cotizaciones ALTER COLUMN total_price TYPE NUMERIC(14, 2);
ALTER TABLE detalle_cotizaciones ALTER COLUMN price TYPE NUMERIC(14, 2);
ALTER TABLE inventory ALTER COLUMN initial_price TYPE NUMERIC(14, 2);
ALTER TABLE inventory_movement ALTER COLUMN price TYPE NUMERIC(14, 2);
ALTER TABLE billing ALTER COLUMN total_amount TYPE NUMERIC(14, 2);

\echo '⚡ Paso 3: Creando índices...'

-- ============================================================
-- 5. ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_cotizaciones_fechas
ON cotizaciones(start_date, end_date)
WHERE status IN ('approved', 'active');

CREATE INDEX IF NOT EXISTS idx_cotizaciones_end_date
ON cotizaciones(end_date)
WHERE status IN ('approved', 'active');

CREATE INDEX IF NOT EXISTS idx_cotizaciones_user
ON cotizaciones(user_id, status);

CREATE INDEX IF NOT EXISTS idx_cotizaciones_approved_by
ON cotizaciones(approved_by)
WHERE approved_by IS NOT NULL;

\echo '👁️  Paso 4: Creando vistas...'

-- ============================================================
-- 6. VISTAS
-- ============================================================
CREATE OR REPLACE VIEW v_stock_bloqueado AS
SELECT
    dc.product_id,
    c.start_date,
    c.end_date,
    SUM(dc.quantity) AS cantidad_bloqueada
FROM detalle_cotizaciones dc
INNER JOIN cotizaciones c ON c.cotizacion_id = dc.cotizacion_id
WHERE c.status IN ('approved', 'active')
GROUP BY dc.product_id, c.start_date, c.end_date;


CREATE OR REPLACE VIEW v_reservas_por_vencer AS
SELECT
    c.cotizacion_id,
    c.user_id,
    u.username,
    u.email AS cliente_email,
    c.start_date,
    c.end_date,
    c.total_price,
    c.status,
    (c.end_date - CURRENT_DATE) AS dias_restantes,
    c.notificado_vencimiento,
    c.fecha_notificacion
FROM cotizaciones c
INNER JOIN Users u ON u.user_id = c.user_id
WHERE c.status IN ('approved', 'active')
  AND c.end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '3 days')
ORDER BY c.end_date ASC;

\echo '🧠 Paso 5: Creando funciones...'

-- ============================================================
-- 7. FUNCIONES ALMACENADAS
-- ============================================================

-- 7.1 Stock disponible en un rango de fechas
CREATE OR REPLACE FUNCTION fn_stock_disponible(
    p_product_id INT,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_stock_total INT;
    v_bloqueado INT;
BEGIN
    SELECT stock_quantity INTO v_stock_total
    FROM Products WHERE product_id = p_product_id;

    IF v_stock_total IS NULL THEN
        RETURN -1;
    END IF;

    SELECT COALESCE(SUM(dc.quantity), 0) INTO v_bloqueado
    FROM detalle_cotizaciones dc
    INNER JOIN cotizaciones c ON c.cotizacion_id = dc.cotizacion_id
    WHERE dc.product_id = p_product_id
      AND c.status IN ('approved', 'active')
      AND c.start_date <= p_end_date
      AND c.end_date >= p_start_date;

    RETURN v_stock_total - v_bloqueado;
END;
$$;


-- 7.2 Crear reserva
CREATE OR REPLACE FUNCTION fn_crear_reserva(
    p_user_id INT,
    p_start_date DATE,
    p_end_date DATE,
    p_observaciones TEXT,
    p_items JSONB
)
RETURNS TABLE (
    cotizacion_id INT,
    total NUMERIC,
    mensaje TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_cotizacion_id INT;
    v_item JSONB;
    v_subtotal NUMERIC := 0;
    v_iva NUMERIC;
    v_total NUMERIC;
    v_precio NUMERIC;
    v_cantidad INT;
    v_product_id INT;
    v_disponible INT;
BEGIN
    IF p_start_date IS NULL OR p_end_date IS NULL THEN
        RETURN QUERY SELECT NULL::INT, NULL::NUMERIC,
            'Debes elegir fechas de inicio y fin'::TEXT;
        RETURN;
    END IF;

    IF p_start_date > p_end_date THEN
        RETURN QUERY SELECT NULL::INT, NULL::NUMERIC,
            'La fecha de inicio no puede ser posterior a la de fin'::TEXT;
        RETURN;
    END IF;

    IF p_start_date < CURRENT_DATE THEN
        RETURN QUERY SELECT NULL::INT, NULL::NUMERIC,
            'No puedes reservar en fechas pasadas'::TEXT;
        RETURN;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM Users WHERE user_id = p_user_id) THEN
        RETURN QUERY SELECT NULL::INT, NULL::NUMERIC,
            'Usuario no encontrado'::TEXT;
        RETURN;
    END IF;

    FOR v_item IN SELECT jsonb_array_elements(p_items) LOOP
        v_product_id := (v_item->>'product_id')::INT;
        v_cantidad := (v_item->>'quantity')::INT;

        v_disponible := fn_stock_disponible(v_product_id, p_start_date, p_end_date);

        IF v_disponible < 0 THEN
            RETURN QUERY SELECT NULL::INT, NULL::NUMERIC,
                ('Producto ' || v_product_id || ' no encontrado')::TEXT;
            RETURN;
        END IF;

        IF v_disponible < v_cantidad THEN
            RETURN QUERY SELECT NULL::INT, NULL::NUMERIC,
                ('Stock insuficiente para el producto ' || v_product_id ||
                 ' (disponible: ' || v_disponible || ')')::TEXT;
            RETURN;
        END IF;

        v_precio := (v_item->>'price')::NUMERIC;
        v_subtotal := v_subtotal + (v_precio * v_cantidad);
    END LOOP;

    v_iva := v_subtotal * 0.19;
    v_total := v_subtotal + v_iva;

    INSERT INTO cotizaciones (
        user_id, iva, total_price, status,
        observations, start_date, end_date
    )
    VALUES (
        p_user_id, v_iva, v_total, 'pending',
        p_observaciones, p_start_date, p_end_date
    )
    RETURNING cotizaciones.cotizacion_id INTO v_cotizacion_id;

    FOR v_item IN SELECT jsonb_array_elements(p_items) LOOP
        INSERT INTO detalle_cotizaciones (cotizacion_id, product_id, quantity, price)
        VALUES (
            v_cotizacion_id,
            (v_item->>'product_id')::INT,
            (v_item->>'quantity')::INT,
            (v_item->>'price')::NUMERIC
        );
    END LOOP;

    RETURN QUERY SELECT v_cotizacion_id, v_total,
        'Reserva creada. Espera la aprobación de un administrador.'::TEXT;

EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT NULL::INT, NULL::NUMERIC, SQLERRM::TEXT;
END;
$$;


-- 7.3 Aprobar reserva
CREATE OR REPLACE FUNCTION fn_aprobar_reserva(
    p_cotizacion_id INT,
    p_admin_id INT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_status VARCHAR;
    v_admin_role VARCHAR;
    v_item RECORD;
    v_disponible INT;
BEGIN
    SELECT role INTO v_admin_role FROM Users WHERE user_id = p_admin_id;
    IF v_admin_role IS NULL OR v_admin_role != 'admin' THEN
        RETURN 'Solo un administrador puede aprobar reservas';
    END IF;

    SELECT status INTO v_status FROM cotizaciones WHERE cotizacion_id = p_cotizacion_id;
    IF v_status IS NULL THEN
        RETURN 'Reserva no encontrada';
    END IF;
    IF v_status != 'pending' THEN
        RETURN 'Solo se pueden aprobar reservas pendientes';
    END IF;

    FOR v_item IN
        SELECT dc.product_id, dc.quantity, c.start_date, c.end_date
        FROM detalle_cotizaciones dc
        INNER JOIN cotizaciones c ON c.cotizacion_id = dc.cotizacion_id
        WHERE dc.cotizacion_id = p_cotizacion_id
    LOOP
        v_disponible := fn_stock_disponible(v_item.product_id, v_item.start_date, v_item.end_date);
        IF v_disponible < v_item.quantity THEN
            RETURN 'No se puede aprobar: stock insuficiente para el producto ' || v_item.product_id;
        END IF;
    END LOOP;

    UPDATE cotizaciones
    SET status = 'approved',
        approved_by = p_admin_id,
        approved_at = CURRENT_TIMESTAMP
    WHERE cotizacion_id = p_cotizacion_id;

    RETURN 'Reserva aprobada. Stock bloqueado.';
END;
$$;


-- 7.4 Rechazar reserva
CREATE OR REPLACE FUNCTION fn_rechazar_reserva(
    p_cotizacion_id INT,
    p_admin_id INT,
    p_motivo TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_admin_role VARCHAR;
BEGIN
    SELECT role INTO v_admin_role FROM Users WHERE user_id = p_admin_id;
    IF v_admin_role IS NULL OR v_admin_role != 'admin' THEN
        RETURN 'Solo un administrador puede rechazar reservas';
    END IF;

    UPDATE cotizaciones
    SET status = 'rejected',
        approved_by = p_admin_id,
        approved_at = CURRENT_TIMESTAMP,
        rejection_reason = p_motivo
    WHERE cotizacion_id = p_cotizacion_id
      AND status = 'pending';

    IF NOT FOUND THEN
        RETURN 'No se pudo rechazar (no existe o no está pendiente)';
    END IF;

    RETURN 'Reserva rechazada';
END;
$$;


-- 7.5 Reservas por vencer
CREATE OR REPLACE FUNCTION fn_reservas_por_vencer()
RETURNS TABLE (
    cotizacion_id INT,
    username VARCHAR,
    cliente_email VARCHAR,
    end_date DATE,
    dias_restantes INT,
    total_price NUMERIC,
    notificado BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.cotizacion_id,
        v.username,
        v.cliente_email,
        v.end_date,
        v.dias_restantes::INT,
        v.total_price,
        v.notificado_vencimiento
    FROM v_reservas_por_vencer v;
END;
$$;


-- 7.6 Marcar notificada
CREATE OR REPLACE FUNCTION fn_marcar_notificada(p_cotizacion_id INT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE cotizaciones
    SET notificado_vencimiento = TRUE,
        fecha_notificacion = CURRENT_TIMESTAMP
    WHERE cotizacion_id = p_cotizacion_id
      AND notificado_vencimiento = FALSE;

    IF NOT FOUND THEN
        RETURN 'La reserva ya fue notificada o no existe';
    END IF;

    RETURN 'Notificación marcada';
END;
$$;


-- 7.7 Actualizar estados automáticamente
CREATE OR REPLACE FUNCTION fn_actualizar_estados_reservas()
RETURNS TABLE (
    actualizadas INT,
    detalle TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INT := 0;
BEGIN
    UPDATE cotizaciones
    SET status = 'active'
    WHERE status = 'approved'
      AND start_date <= CURRENT_DATE
      AND end_date >= CURRENT_DATE;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN
        RETURN QUERY SELECT v_count, ('Activadas: ' || v_count)::TEXT;
    END IF;

    UPDATE cotizaciones
    SET status = 'completed'
    WHERE status = 'active'
      AND end_date < CURRENT_DATE;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN
        RETURN QUERY SELECT v_count, ('Completadas: ' || v_count)::TEXT;
    END IF;

    IF v_count = 0 THEN
        RETURN QUERY SELECT 0, 'Sin cambios'::TEXT;
    END IF;
END;
$$;

\echo '🔐 Paso 6: Aplicando permisos (si ce_app existe)...'

-- ============================================================
-- 8. PERMISOS (solo si creaste los roles ce_app, etc.)
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ce_app') THEN
        GRANT EXECUTE ON FUNCTION fn_stock_disponible(INT, DATE, DATE) TO ce_app;
        GRANT EXECUTE ON FUNCTION fn_crear_reserva(INT, DATE, DATE, TEXT, JSONB) TO ce_app;
        GRANT EXECUTE ON FUNCTION fn_aprobar_reserva(INT, INT) TO ce_app;
        GRANT EXECUTE ON FUNCTION fn_rechazar_reserva(INT, INT, TEXT) TO ce_app;
        GRANT EXECUTE ON FUNCTION fn_reservas_por_vencer() TO ce_app;
        GRANT EXECUTE ON FUNCTION fn_marcar_notificada(INT) TO ce_app;
        GRANT EXECUTE ON FUNCTION fn_actualizar_estados_reservas() TO ce_app;

        GRANT SELECT ON v_stock_bloqueado TO ce_app;
        GRANT SELECT ON v_reservas_por_vencer TO ce_app;

        RAISE NOTICE 'Permisos aplicados a ce_app ✅';
    ELSE
        RAISE NOTICE 'Rol ce_app no existe — saltando permisos';
    END IF;
END $$;

\echo '✅ Migración completada'

--psql -U postgres -d ce_web -f FAST-API/db/migracion_reservas.sql
