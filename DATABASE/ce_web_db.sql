-- TABLA DE USUARIOS
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    date_registered TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TRIGGER trg_audit_users
AFTER INSERT OR UPDATE OR DELETE
ON users
FOR EACH ROW
EXECUTE FUNCTION log_audit_trigger_func();

-- TABLA DE PRODUCTOS
CREATE TABLE Products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,  
    description TEXT,
    stock_quantity INT NOT NULL,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'for loan', 'unavailable')),
    image_url VARCHAR(255),
    model_number VARCHAR(100)
);
CREATE TRIGGER trg_audit_products
AFTER INSERT OR UPDATE OR DELETE
ON products
FOR EACH ROW
EXECUTE FUNCTION log_audit_trigger_func();


-- TABLA DE INVENTARIO
CREATE TABLE inventory (
    inventory_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    initial_price NUMERIC(10, 2) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);
CREATE TRIGGER trg_audit_inventory
AFTER INSERT OR UPDATE OR DELETE
ON inventory
FOR EACH ROW
EXECUTE FUNCTION log_audit_trigger_func();



-- TABLA DE MOVIMIENTOS DE INVENTARIO
CREATE TABLE inventory_movement (
    movement_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('in', 'out')),
    date_moved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    price NUMERIC(10, 2) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);
CREATE TRIGGER trg_audit_inventory_movement
AFTER INSERT OR UPDATE OR DELETE
ON inventory_movement
FOR EACH ROW
EXECUTE FUNCTION log_audit_trigger_func();


-- TABLA DE COTIZACIONES
CREATE TABLE cotizaciones (
    cotizacion_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    iva NUMERIC(5, 2) NOT NULL,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_price NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
CREATE TRIGGER trg_audit_cotizaciones
AFTER INSERT OR UPDATE OR DELETE
ON cotizaciones
FOR EACH ROW
EXECUTE FUNCTION log_audit_trigger_func();


-- TABLA DE DETALLE DE COTIZACIONES
CREATE TABLE detalle_cotizaciones (
    detalle_id SERIAL PRIMARY KEY,
    cotizacion_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(cotizacion_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);
CREATE TRIGGER trg_audit_detalle_cotizaciones
AFTER INSERT OR UPDATE OR DELETE
ON detalle_cotizaciones
FOR EACH ROW
EXECUTE FUNCTION log_audit_trigger_func();


-- TABLA DE FACTURACION
CREATE TABLE billing (
    billing_id SERIAL PRIMARY KEY,
    cotizacion_id INT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    date_billed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(cotizacion_id)
);
CREATE TRIGGER trg_audit_billing
AFTER INSERT OR UPDATE OR DELETE
ON billing
FOR EACH ROW
EXECUTE FUNCTION log_audit_trigger_func();


-- TABLA DE AUDITORIA
CREATE TABLE audit (
    audit_id SERIAL PRIMARY KEY,
    user_id INT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    description VARCHAR(500),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);
CREATE OR REPLACE FUNCTION log_audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id INT;
    v_record_id INT;
    v_action VARCHAR(10);
    v_description VARCHAR(500);
BEGIN

    -- Obtener el usuario de la sesión
    BEGIN
        v_user_id := NULLIF(
            current_setting('app.current_user_id', true),
            ''
        )::INT;
    EXCEPTION
        WHEN OTHERS THEN
            v_user_id := NULL;
    END;

    -- INSERT
    IF TG_OP = 'INSERT' THEN

        v_action := 'INSERT';

        IF TG_TABLE_NAME = 'users' THEN
            v_record_id := NEW.user_id;

        ELSIF TG_TABLE_NAME = 'products' THEN
            v_record_id := NEW.product_id;

        ELSIF TG_TABLE_NAME = 'inventory' THEN
            v_record_id := NEW.inventory_id;

        ELSIF TG_TABLE_NAME = 'inventory_movement' THEN
            v_record_id := NEW.movement_id;

        ELSIF TG_TABLE_NAME = 'cotizaciones' THEN
            v_record_id := NEW.cotizacion_id;

        ELSIF TG_TABLE_NAME = 'detalle_cotizaciones' THEN
            v_record_id := NEW.detalle_id;

        ELSIF TG_TABLE_NAME = 'billing' THEN
            v_record_id := NEW.billing_id;
        END IF;

        v_description :=
            'Se insertó el registro ' ||
            v_record_id ||
            ' en ' ||
            TG_TABLE_NAME;

        INSERT INTO audit (
            user_id,
            table_name,
            record_id,
            action,
            description
        )
        VALUES (
            v_user_id,
            TG_TABLE_NAME,
            v_record_id,
            v_action,
            v_description
        );

        RETURN NEW;

    -- UPDATE
    ELSIF TG_OP = 'UPDATE' THEN

        v_action := 'UPDATE';

        IF TG_TABLE_NAME = 'users' THEN
            v_record_id := NEW.user_id;

        ELSIF TG_TABLE_NAME = 'products' THEN
            v_record_id := NEW.product_id;

        ELSIF TG_TABLE_NAME = 'inventory' THEN
            v_record_id := NEW.inventory_id;

        ELSIF TG_TABLE_NAME = 'inventory_movement' THEN
            v_record_id := NEW.movement_id;

        ELSIF TG_TABLE_NAME = 'cotizaciones' THEN
            v_record_id := NEW.cotizacion_id;

        ELSIF TG_TABLE_NAME = 'detalle_cotizaciones' THEN
            v_record_id := NEW.detalle_id;

        ELSIF TG_TABLE_NAME = 'billing' THEN
            v_record_id := NEW.billing_id;
        END IF;

        v_description :=
            'Se actualizó el registro ' ||
            v_record_id ||
            ' en ' ||
            TG_TABLE_NAME;

        INSERT INTO audit (
            user_id,
            table_name,
            record_id,
            action,
            description
        )
        VALUES (
            v_user_id,
            TG_TABLE_NAME,
            v_record_id,
            v_action,
            v_description
        );

        RETURN NEW;

    -- DELETE
    ELSIF TG_OP = 'DELETE' THEN

        v_action := 'DELETE';

        IF TG_TABLE_NAME = 'users' THEN
            v_record_id := OLD.user_id;

        ELSIF TG_TABLE_NAME = 'products' THEN
            v_record_id := OLD.product_id;

        ELSIF TG_TABLE_NAME = 'inventory' THEN
            v_record_id := OLD.inventory_id;

        ELSIF TG_TABLE_NAME = 'inventory_movement' THEN
            v_record_id := OLD.movement_id;

        ELSIF TG_TABLE_NAME = 'cotizaciones' THEN
            v_record_id := OLD.cotizacion_id;

        ELSIF TG_TABLE_NAME = 'detalle_cotizaciones' THEN
            v_record_id := OLD.detalle_id;

        ELSIF TG_TABLE_NAME = 'billing' THEN
            v_record_id := OLD.billing_id;
        END IF;

        v_description :=
            'Se eliminó el registro ' ||
            v_record_id ||
            ' de ' ||
            TG_TABLE_NAME;

        INSERT INTO audit (
            user_id,
            table_name,
            record_id,
            action,
            description
        )
        VALUES (
            v_user_id,
            TG_TABLE_NAME,
            v_record_id,
            v_action,
            v_description
        );

        RETURN OLD;

    END IF;

    RETURN NULL;

END;
$$;

-- 1. Insertar Usuarios
INSERT INTO Users (username, email, password, phone_number, status) 
VALUES 
('david_perez', 'david.perez@example.com', 'hashed_pass_123', '3001234567', 'active'),
('ana_gomez', 'ana.gomez@example.com', 'hashed_pass_456', '3109876543', 'active');

-- 2. Insertar Productos
INSERT INTO Products (name, description, stock_quantity, type, status, image_url, model_number) 
VALUES 
('Taladro Percutor 12V', 'Taladro inalambrico profesional con maletin', 10, 'Herramienta', 'available', 'https://img.example.com/taladro.jpg', 'TP-2026'),
('Excavadora Oruga 340D2', 'Maquinaria pesada para construccion y mineria', 2, 'Maquinaria', 'available', 'https://img.example.com/excavadora.jpg', 'CAT-340');

-- 3. Insertar Inventario
INSERT INTO inventory (product_id, quantity, initial_price) 
VALUES 
(1, 10, 45000.00),
(2, 2, 850000.00);

-- 4. Insertar Movimientos de Inventario
INSERT INTO inventory_movement (product_id, quantity, movement_type, price) 
VALUES 
(1, 5, 'in', 45000.00),
(2, 1, 'in', 850000.00);

-- 5. Insertar Cotizaciones
INSERT INTO cotizaciones (user_id, iva, total_price, status, observations) 
VALUES 
(1, 19.00, 1071000.00, 'pending', 'Cotizacion inicial para obra civil sur.');

-- 6. Insertar Detalle de Cotizaciones
INSERT INTO detalle_cotizaciones (cotizacion_id, product_id, quantity, price) 
VALUES 
(1, 1, 2, 45000.00),
(1, 2, 1, 850000.00);

-- 7. Insertar Facturación
INSERT INTO billing (cotizacion_id, total_amount) 
VALUES 
(1, 1071000.00);
ALTER TABLE Users
ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'client'
CHECK (role IN ('client', 'admin'));

UPDATE Users
SET role = 'admin'
WHERE email = 'david.perez@example.com';

UPDATE Users
SET role = 'admin'
WHERE email = 'castroesquivellincolneduardo@gmail.com';

--actualizacion para notificar al admin reservas de maquinaria proximas a vencer
-- ==========================================
-- FECHAS DE LA RESERVA
-- ==========================================
ALTER TABLE cotizaciones
ADD COLUMN start_date DATE,
ADD COLUMN end_date DATE;

-- ==========================================
-- APROBACIÓN / RECHAZO
-- ==========================================
ALTER TABLE cotizaciones
ADD COLUMN approved_by INT,
ADD COLUMN approved_at TIMESTAMP,
ADD COLUMN rejection_reason TEXT;

ALTER TABLE cotizaciones
ADD CONSTRAINT cotizaciones_approved_by_fkey
FOREIGN KEY (approved_by) REFERENCES Users(user_id);

-- ==========================================
-- NOTIFICACIONES DE VENCIMIENTO
-- ==========================================
ALTER TABLE cotizaciones
ADD COLUMN notificado_vencimiento BOOLEAN DEFAULT FALSE,
ADD COLUMN fecha_notificacion TIMESTAMP;

-- ==========================================
-- EXTENDER LOS ESTADOS POSIBLES
-- ==========================================
ALTER TABLE cotizaciones
DROP CONSTRAINT IF EXISTS cotizaciones_status_check;

ALTER TABLE cotizaciones
ADD CONSTRAINT cotizaciones_status_check
CHECK (status IN (
    'pending',      -- esperando aprobación del admin
    'approved',     -- aprobada, stock bloqueado
    'rejected',     -- rechazada por el admin
    'active',       -- en curso (fecha actual dentro del rango)
    'completed',    -- finalizada
    'cancelled'     -- cancelada por el cliente
));
-- Búsquedas por rango de fechas (muy usado al verificar solapamientos)
CREATE INDEX idx_cotizaciones_fechas
ON cotizaciones(start_date, end_date)
WHERE status IN ('approved', 'active');

-- Búsquedas de reservas por vencer
CREATE INDEX idx_cotizaciones_end_date
ON cotizaciones(end_date)
WHERE status IN ('approved', 'active');

-- Búsquedas por usuario
CREATE INDEX idx_cotizaciones_user
ON cotizaciones(user_id, status);

-- Búsquedas por admin aprobador
CREATE INDEX idx_cotizaciones_approved_by
ON cotizaciones(approved_by)
WHERE approved_by IS NOT NULL;

--vista de stock bloqueado--
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
--vista de reservas proximas a vencer
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
--funciones--
-- ============================================================
-- FUNCIÓN: fn_stock_disponible
-- PROPÓSITO: Calcular cuántas unidades de un producto están libres
--            en un rango de fechas específico.
-- PARÁMETROS:
--   p_product_id  → ID del producto a consultar
--   p_start_date  → fecha de inicio del rango deseado
--   p_end_date    → fecha de fin del rango deseado
-- RETORNA: INT (unidades disponibles) o -1 si el producto no existe
-- ============================================================
CREATE OR REPLACE FUNCTION fn_stock_disponible(
    p_product_id INT,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS INT                        -- La función devuelve un número entero
LANGUAGE plpgsql                   -- Lenguaje procedural de PostgreSQL
AS $$
-- DECLARE: aquí se declaran las variables locales que usaremos
DECLARE
    v_stock_total INT;             -- Almacenará el stock total del producto
    v_bloqueado INT;               -- Almacenará las unidades ya reservadas en el rango
BEGIN
    -- ─────────────────────────────────────────────
    -- PASO 1: Obtener el stock total del producto
    -- ─────────────────────────────────────────────
    SELECT stock_quantity INTO v_stock_total      -- Guarda el resultado en la variable
    FROM Products                                  -- Tabla de productos
    WHERE product_id = p_product_id;               -- Filtra por el ID recibido

    -- Si no se encontró el producto, v_stock_total será NULL
    IF v_stock_total IS NULL THEN
        RETURN -1;                                 -- -1 indica "producto no encontrado"
    END IF;

    -- ─────────────────────────────────────────────
    -- PASO 2: Sumar cuántas unidades están bloqueadas
    --         en reservas aprobadas/activas que SE SOLAPEN
    --         con el rango solicitado
    -- ─────────────────────────────────────────────
    SELECT COALESCE(SUM(dc.quantity), 0) INTO v_bloqueado   -- COALESCE: si no hay filas, usar 0
    FROM detalle_cotizaciones dc                            -- Tabla de detalle de cada reserva
    INNER JOIN cotizaciones c                               -- Unimos con la cabecera de la reserva
        ON c.cotizacion_id = dc.cotizacion_id               -- Por su ID
    WHERE dc.product_id = p_product_id                      -- Solo del producto pedido
      AND c.status IN ('approved', 'active')                -- Solo reservas vigentes
      -- ↓ CONDICIÓN DE SOLAPAMIENTO DE FECHAS ↓
      -- Dos rangos se solapan si: inicio_reserva <= fin_pedido
      --                     AND  fin_reserva   >= inicio_pedido
      AND c.start_date <= p_end_date
      AND c.end_date >= p_start_date;

    -- ─────────────────────────────────────────────
    -- PASO 3: Devolver el resultado final
    -- ─────────────────────────────────────────────
    RETURN v_stock_total - v_bloqueado;         -- Stock total menos lo bloqueado
END;
$$;

-- ============================================================
-- FUNCIÓN: fn_crear_reserva
-- PROPÓSITO: Crear una reserva (cotización en estado "pending")
--            validando que haya stock en las fechas elegidas.
-- PARÁMETROS:
--   p_user_id        → ID del cliente que reserva
--   p_start_date     → fecha de inicio de la reserva
--   p_end_date       → fecha de fin de la reserva
--   p_observaciones  → notas opcionales del cliente
--   p_items          → JSON con [{product_id, quantity, price}, ...]
-- RETORNA: Tabla con (cotizacion_id, total, mensaje)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_crear_reserva(
    p_user_id INT,
    p_start_date DATE,
    p_end_date DATE,
    p_observaciones TEXT,
    p_items JSONB                  -- JSONB: tipo de dato JSON binario de PostgreSQL
)
RETURNS TABLE (
    cotizacion_id INT,             -- ID de la reserva creada
    total NUMERIC,                 -- Total final con IVA
    mensaje TEXT                   -- Mensaje de éxito o error
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_cotizacion_id INT;           -- Guardará el ID de la nueva cotización
    v_item JSONB;                  -- Variable para iterar cada ítem del JSON
    v_subtotal NUMERIC := 0;       -- Acumulador del subtotal (sin IVA)
    v_iva NUMERIC;                 -- IVA calculado (19%)
    v_total NUMERIC;               -- Total final (subtotal + IVA)
    v_precio NUMERIC;              -- Precio unitario de cada ítem
    v_cantidad INT;                -- Cantidad de cada ítem
    v_product_id INT;              -- ID del producto de cada ítem
    v_disponible INT;              -- Stock disponible en el rango
BEGIN
    -- ─────────────────────────────────────────────
    -- VALIDACIÓN 1: Fechas obligatorias
    -- ─────────────────────────────────────────────
    IF p_start_date IS NULL OR p_end_date IS NULL THEN
        RETURN QUERY SELECT NULL::INT, NULL::NUMERIC,
            'Debes elegir fechas de inicio y fin'::TEXT;
        RETURN;                    -- Salir de la función
    END IF;

    -- ─────────────────────────────────────────────
    -- VALIDACIÓN 2: Coherencia de fechas
    -- ─────────────────────────────────────────────
    IF p_start_date > p_end_date THEN
        RETURN QUERY SELECT NULL::INT, NULL::NUMERIC,
            'La fecha de inicio no puede ser posterior a la de fin'::TEXT;
        RETURN;
    END IF;

    -- ─────────────────────────────────────────────
    -- VALIDACIÓN 3: No reservar en el pasado
    -- ─────────────────────────────────────────────
    IF p_start_date < CURRENT_DATE THEN
        RETURN QUERY SELECT NULL::INT, NULL::NUMERIC,
            'No puedes reservar en fechas pasadas'::TEXT;
        RETURN;
    END IF;

    -- ─────────────────────────────────────────────
    -- VALIDACIÓN 4: El usuario debe existir
    -- ─────────────────────────────────────────────
    IF NOT EXISTS (SELECT 1 FROM Users WHERE user_id = p_user_id) THEN
        RETURN QUERY SELECT NULL::INT, NULL::NUMERIC,
            'Usuario no encontrado'::TEXT;
        RETURN;
    END IF;

    -- ─────────────────────────────────────────────
    -- PASO 1: Recorrer cada ítem y validar disponibilidad
    -- ─────────────────────────────────────────────
    -- jsonb_array_elements(): convierte un array JSON en filas
    FOR v_item IN SELECT jsonb_array_elements(p_items) LOOP
        -- Extraer datos del JSON
        v_product_id := (v_item->>'product_id')::INT;    -- >> extrae como texto, ::INT castea
        v_cantidad := (v_item->>'quantity')::INT;

        -- Llamar a la función de disponibilidad
        v_disponible := fn_stock_disponible(v_product_id, p_start_date, p_end_date);

        -- Validar que el producto exista
        IF v_disponible < 0 THEN
            RETURN QUERY SELECT NULL::INT, NULL::NUMERIC,
                ('Producto ' || v_product_id || ' no encontrado')::TEXT;
            RETURN;
        END IF;

        -- Validar que haya suficiente stock
        IF v_disponible < v_cantidad THEN
            RETURN QUERY SELECT NULL::INT, NULL::NUMERIC,
                ('Stock insuficiente para el producto ' || v_product_id ||
                 ' (disponible: ' || v_disponible || ')')::TEXT;
            RETURN;
        END IF;

        -- Sumar al subtotal: precio × cantidad
        v_precio := (v_item->>'price')::NUMERIC;
        v_subtotal := v_subtotal + (v_precio * v_cantidad);
    END LOOP;

    -- ─────────────────────────────────────────────
    -- PASO 2: Calcular IVA y total
    -- ─────────────────────────────────────────────
    v_iva := v_subtotal * 0.19;    -- IVA del 19% (Colombia)
    v_total := v_subtotal + v_iva;

    -- ─────────────────────────────────────────────
    -- PASO 3: Insertar la cotización (cabecera)
    -- ─────────────────────────────────────────────
    INSERT INTO cotizaciones (
        user_id, iva, total_price, status,
        observations, start_date, end_date
    )
    VALUES (
        p_user_id, v_iva, v_total, 'pending',          -- Estado inicial: pendiente
        p_observaciones, p_start_date, p_end_date
    )
    RETURNING cotizaciones.cotizacion_id INTO v_cotizacion_id;  -- Captura el ID generado

    -- ─────────────────────────────────────────────
    -- PASO 4: Insertar los detalles (cada ítem)
    -- ─────────────────────────────────────────────
    FOR v_item IN SELECT jsonb_array_elements(p_items) LOOP
        INSERT INTO detalle_cotizaciones (cotizacion_id, product_id, quantity, price)
        VALUES (
            v_cotizacion_id,
            (v_item->>'product_id')::INT,
            (v_item->>'quantity')::INT,
            (v_item->>'price')::NUMERIC
        );
    END LOOP;

    -- ─────────────────────────────────────────────
    -- PASO 5: Devolver éxito
    -- ─────────────────────────────────────────────
    RETURN QUERY SELECT v_cotizacion_id, v_total,
        'Reserva creada. Espera la aprobación de un administrador.'::TEXT;

-- ─────────────────────────────────────────────
-- MANEJO DE ERRORES: si algo falla, se revierte todo
-- ─────────────────────────────────────────────
EXCEPTION
    WHEN OTHERS THEN                                    -- Cualquier error
        RETURN QUERY SELECT NULL::INT, NULL::NUMERIC, SQLERRM::TEXT;
END;
$$;
-- ============================================================
-- FUNCIÓN: fn_aprobar_reserva
-- PROPÓSITO: Aprobar una reserva pendiente. Solo admins pueden.
--            Antes de aprobar, RE-VALIDA el stock por si alguien
--            más reservó mientras tanto.
-- PARÁMETROS:
--   p_cotizacion_id → ID de la reserva a aprobar
--   p_admin_id      → ID del admin que aprueba
-- RETORNA: TEXT (mensaje de éxito o error)
-- ============================================================
-- ============================================================
-- FUNCIÓN: fn_aprobar_reserva
-- PROPÓSITO: Aprobar reserva. Solo admins. DESCUENTA STOCK.
-- ============================================================
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

    -- Re-validar disponibilidad
    FOR v_item IN
        SELECT dc.product_id, dc.quantity, c.start_date, c.end_date
        FROM detalle_cotizaciones dc
        INNER JOIN cotizaciones c ON c.cotizacion_id = dc.cotizacion_id
        WHERE dc.cotizacion_id = p_cotizacion_id
    LOOP
        v_disponible := fn_stock_disponible(
            v_item.product_id,
            v_item.start_date,
            v_item.end_date
        );
        IF v_disponible < v_item.quantity THEN
            RETURN 'No se puede aprobar: stock insuficiente para el producto ' || v_item.product_id;
        END IF;
    END LOOP;

    -- 🔥 DESCONTAR STOCK
    UPDATE Products p
    SET stock_quantity = p.stock_quantity - dc.quantity
    FROM detalle_cotizaciones dc
    WHERE dc.cotizacion_id = p_cotizacion_id
      AND p.product_id = dc.product_id;

    -- Marcar como aprobada
    UPDATE cotizaciones
    SET status = 'approved',
        approved_by = p_admin_id,
        approved_at = CURRENT_TIMESTAMP
    WHERE cotizacion_id = p_cotizacion_id;

    RETURN 'Reserva aprobada. Stock descontado.';
END;
$$;
-- ============================================================
-- FUNCIÓN: fn_rechazar_reserva
-- PROPÓSITO: Rechazar una reserva pendiente con un motivo.
--            Solo admins pueden.
-- PARÁMETROS:
--   p_cotizacion_id → ID de la reserva a rechazar
--   p_admin_id      → ID del admin que rechaza
--   p_motivo        → Razón del rechazo (se guarda para el cliente)
-- RETORNA: TEXT (mensaje de éxito o error)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_rechazar_reserva(
    p_cotizacion_id INT,
    p_admin_id INT,
    p_motivo TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_admin_role VARCHAR;          -- Rol del admin
BEGIN
    -- ─────────────────────────────────────────────
    -- VALIDACIÓN: El usuario debe ser admin
    -- ─────────────────────────────────────────────
    SELECT role INTO v_admin_role FROM Users WHERE user_id = p_admin_id;

    IF v_admin_role IS NULL OR v_admin_role != 'admin' THEN
        RETURN 'Solo un administrador puede rechazar reservas';
    END IF;

    -- ─────────────────────────────────────────────
    -- ACTUALIZACIÓN: Cambiar estado a 'rejected'
    -- Solo si está en 'pending' (no re-rechazar)
    -- ─────────────────────────────────────────────
    UPDATE cotizaciones
    SET status = 'rejected',                   -- Nuevo estado
        approved_by = p_admin_id,              -- Quién rechazó
        approved_at = CURRENT_TIMESTAMP,       -- Cuándo
        rejection_reason = p_motivo            -- Por qué
    WHERE cotizacion_id = p_cotizacion_id
      AND status = 'pending';                  -- Solo si está pendiente

    -- FOUND: variable especial que indica si el UPDATE afectó filas
    IF NOT FOUND THEN
        RETURN 'No se pudo rechazar (no existe o no está pendiente)';
    END IF;

    RETURN 'Reserva rechazada';
END;
$$;
-- ============================================================
-- FUNCIÓN: fn_reservas_por_vencer
-- PROPÓSITO: Listar reservas activas o aprobadas que terminen
--            en los próximos 3 días, para que el admin las
--            prepare (devolución, renovación, etc.)
-- RETORNA: Tabla con datos de cada reserva próxima a vencer
-- ============================================================
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
    -- Simplemente retorna el contenido de la vista ya creada
    RETURN QUERY
    SELECT
        v.cotizacion_id,
        v.username,
        v.cliente_email,
        v.end_date,
        v.dias_restantes::INT,                 -- Cast a INT (era interval)
        v.total_price,
        v.notificado_vencimiento
    FROM v_reservas_por_vencer v;             -- La vista hace el filtrado por fechas
END;
$$;
-- ============================================================
-- FUNCIÓN: fn_marcar_notificada
-- PROPÓSITO: Marcar una reserva como "ya notificada" para NO
--            enviar el email dos veces al mismo admin.
-- PARÁMETROS:
--   p_cotizacion_id → ID de la reserva notificada
-- RETORNA: TEXT (mensaje)
-- ============================================================
CREATE OR REPLACE FUNCTION fn_marcar_notificada(p_cotizacion_id INT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    -- ─────────────────────────────────────────────
    -- ACTUALIZACIÓN: marcar como notificada
    -- Solo si todavía NO estaba notificada (evita doble envío)
    -- ─────────────────────────────────────────────
    UPDATE cotizaciones
    SET notificado_vencimiento = TRUE,              -- Bandera de control
        fecha_notificacion = CURRENT_TIMESTAMP      -- Auditoría
    WHERE cotizacion_id = p_cotizacion_id
      AND notificado_vencimiento = FALSE;           -- ← clave: solo si no se había notificado

    -- Si no se actualizó nada, es porque ya estaba notificada
    IF NOT FOUND THEN
        RETURN 'La reserva ya fue notificada o no existe';
    END IF;

    RETURN 'Notificación marcada';
END;
$$;
-- ============================================================
-- FUNCIÓN: fn_actualizar_estados_reservas
-- PROPÓSITO: approved→active, active→completed.
--            AL COMPLETAR DEVUELVE EL STOCK.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_actualizar_estados_reservas()
RETURNS TABLE (
    actualizadas INT,
    detalle TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INT := 0;
    v_item RECORD;
    v_reserva RECORD;
BEGIN
    -- approved → active
    UPDATE cotizaciones
    SET status = 'active'
    WHERE status = 'approved'
      AND start_date <= CURRENT_DATE
      AND end_date >= CURRENT_DATE;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- active → completed + devolver stock
    FOR v_reserva IN
        SELECT cotizacion_id
        FROM cotizaciones
        WHERE status = 'active'
          AND end_date < CURRENT_DATE
    LOOP
        FOR v_item IN
            SELECT dc.product_id, dc.quantity
            FROM detalle_cotizaciones dc
            WHERE dc.cotizacion_id = v_reserva.cotizacion_id
        LOOP
            UPDATE Products
            SET stock_quantity = stock_quantity + v_item.quantity
            WHERE product_id = v_item.product_id;
        END LOOP;

        UPDATE cotizaciones
        SET status = 'completed'
        WHERE cotizacion_id = v_reserva.cotizacion_id;
    END LOOP;

    IF v_count > 0 THEN
        RETURN QUERY SELECT v_count, ('Activadas: ' || v_count)::TEXT;
    ELSE
        RETURN QUERY SELECT 0, 'Sin cambios'::TEXT;
    END IF;
END;
$$;
-- ============================================================
-- SINCRONIZACIÓN: inventory.quantity → Products.stock_quantity
-- ============================================================
CREATE OR REPLACE FUNCTION sync_stock_from_inventory_func()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE Products
        SET stock_quantity = stock_quantity + NEW.quantity
        WHERE product_id = NEW.product_id;
        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE Products
        SET stock_quantity = stock_quantity + (NEW.quantity - OLD.quantity)
        WHERE product_id = NEW.product_id;
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        UPDATE Products
        SET stock_quantity = stock_quantity - OLD.quantity
        WHERE product_id = OLD.product_id;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_stock_inventory ON inventory;

CREATE TRIGGER trg_sync_stock_inventory
AFTER INSERT OR UPDATE OR DELETE
ON inventory
FOR EACH ROW
EXECUTE FUNCTION sync_stock_from_inventory_func();

-- Sincronizar datos actuales
UPDATE Products p
SET stock_quantity = COALESCE(
    (SELECT i.quantity FROM inventory i WHERE i.product_id = p.product_id),
    0
);

-- Arreglar tipos numéricos (solo si aún son pequeños)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'cotizaciones'
          AND column_name = 'iva'
          AND numeric_precision = 5
    ) THEN
        ALTER TABLE cotizaciones ALTER COLUMN iva TYPE NUMERIC(12, 2);
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'cotizaciones'
          AND column_name = 'total_price'
          AND numeric_precision = 10
    ) THEN
        ALTER TABLE cotizaciones ALTER COLUMN total_price TYPE NUMERIC(14, 2);
    END IF;
END $$;

-- Permisos (si usas ce_app)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ce_app') THEN
        GRANT EXECUTE ON FUNCTION fn_crear_reserva(INT, DATE, INT, TEXT, JSONB) TO ce_app;
    END IF;
END $$;
-- ============================================================
DROP FUNCTION IF EXISTS fn_crear_reserva(INT, DATE, DATE, TEXT, JSONB);
DROP FUNCTION IF EXISTS fn_crear_reserva(INT, DATE, INT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION fn_crear_reserva(
    p_user_id INT,
    p_start_date DATE,
    p_months INT,
    p_observaciones TEXT,
    p_items JSONB      -- [{"product_id": 1, "quantity": 2}]
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
    v_precio_mensual NUMERIC;
    v_cantidad INT;
    v_product_id INT;
    v_disponible INT;
    v_end_date DATE;
BEGIN
    -- Validación 1: meses mínimo 1
    IF p_months IS NULL OR p_months < 1 THEN
        RETURN QUERY SELECT NULL::INT, NULL::NUMERIC,
            'La reserva mínima es de 1 mes'::TEXT;
        RETURN;
    END IF;

    -- Validación 2: fecha válida
    IF p_start_date IS NULL THEN
        RETURN QUERY SELECT NULL::INT, NULL::NUMERIC,
            'Debes elegir una fecha de inicio'::TEXT;
        RETURN;
    END IF;

    IF p_start_date < CURRENT_DATE THEN
        RETURN QUERY SELECT NULL::INT, NULL::NUMERIC,
            'No puedes reservar en fechas pasadas'::TEXT;
        RETURN;
    END IF;

    -- Validación 3: usuario existe
    IF NOT EXISTS (SELECT 1 FROM Users WHERE user_id = p_user_id) THEN
        RETURN QUERY SELECT NULL::INT, NULL::NUMERIC,
            'Usuario no encontrado'::TEXT;
        RETURN;
    END IF;

    -- Calcular fecha fin sumando meses
    v_end_date := p_start_date + (p_months || ' months')::INTERVAL;

    -- Validar cada ítem
    FOR v_item IN SELECT jsonb_array_elements(p_items) LOOP
        v_product_id := (v_item->>'product_id')::INT;
        v_cantidad := (v_item->>'quantity')::INT;

        -- Precio mensual desde inventory
        SELECT i.initial_price INTO v_precio_mensual
        FROM inventory i
        WHERE i.product_id = v_product_id
        LIMIT 1;

        IF v_precio_mensual IS NULL THEN
            RETURN QUERY SELECT NULL::INT, NULL::NUMERIC,
                ('Producto ' || v_product_id || ' sin inventario')::TEXT;
            RETURN;
        END IF;

        v_disponible := fn_stock_disponible(v_product_id, p_start_date, v_end_date);

        IF v_disponible < v_cantidad THEN
            RETURN QUERY SELECT NULL::INT, NULL::NUMERIC,
                ('Stock insuficiente para el producto ' || v_product_id ||
                 ' (disponible: ' || v_disponible || ')')::TEXT;
            RETURN;
        END IF;

        v_subtotal := v_subtotal + (v_precio_mensual * p_months * v_cantidad);
    END LOOP;

    v_iva := v_subtotal * 0.19;
    v_total := v_subtotal + v_iva;

    -- Insertar cotización
    INSERT INTO cotizaciones (
        user_id, iva, total_price, status,
        observations, start_date, end_date
    )
    VALUES (
        p_user_id, v_iva, v_total, 'pending',
        p_observaciones, p_start_date, v_end_date
    )
    RETURNING cotizaciones.cotizacion_id INTO v_cotizacion_id;

    -- Insertar detalle
    FOR v_item IN SELECT jsonb_array_elements(p_items) LOOP
        v_product_id := (v_item->>'product_id')::INT;
        v_cantidad := (v_item->>'quantity')::INT;

        SELECT i.initial_price INTO v_precio_mensual
        FROM inventory i
        WHERE i.product_id = v_product_id
        LIMIT 1;

        INSERT INTO detalle_cotizaciones (cotizacion_id, product_id, quantity, price)
        VALUES (
            v_cotizacion_id,
            v_product_id,
            v_cantidad,
            v_precio_mensual * p_months
        );
    END LOOP;

    RETURN QUERY SELECT v_cotizacion_id, v_total,
        ('Reserva creada por ' || p_months || ' mes(es). Espera aprobación.')::TEXT;

EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT NULL::INT, NULL::NUMERIC, SQLERRM::TEXT;
END;
$$;

-- Permisos
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ce_app') THEN
        GRANT EXECUTE ON FUNCTION fn_crear_reserva(INT, DATE, INT, TEXT, JSONB) TO ce_app;
    END IF;
END $$;