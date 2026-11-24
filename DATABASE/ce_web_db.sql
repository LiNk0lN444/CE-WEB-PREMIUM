-- ==========================================
-- 1. TABLAS BASE
-- ==========================================
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    date_registered TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin'))
);

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

CREATE TABLE inventory (
    inventory_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    initial_price NUMERIC(10, 2) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

CREATE TABLE inventory_movement (
    movement_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('in', 'out')),
    date_moved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    price NUMERIC(10, 2) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

CREATE TABLE cotizaciones (
    cotizacion_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    iva NUMERIC(12, 2) NOT NULL,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_price NUMERIC(14, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled')),
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    start_date DATE,
    end_date DATE,
    approved_by INT,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    notificado_vencimiento BOOLEAN DEFAULT FALSE,
    fecha_notificacion TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (approved_by) REFERENCES Users(user_id)
);

CREATE TABLE detalle_cotizaciones (
    detalle_id SERIAL PRIMARY KEY,
    cotizacion_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(cotizacion_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

CREATE TABLE billing (
    billing_id SERIAL PRIMARY KEY,
    cotizacion_id INT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    date_billed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(cotizacion_id)
);

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

-- ==========================================
-- 2. TRIGGERS Y FUNCIONES DE AUDITORÍA
-- ==========================================
CREATE OR REPLACE FUNCTION log_audit_trigger_func()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_user_id INT; v_record_id INT; v_action VARCHAR(10); v_description VARCHAR(500);
BEGIN
    BEGIN v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::INT; EXCEPTION WHEN OTHERS THEN v_user_id := NULL; END;
    IF TG_OP = 'INSERT' THEN
        v_action := 'INSERT';
        IF TG_TABLE_NAME = 'users' THEN v_record_id := NEW.user_id;
        ELSIF TG_TABLE_NAME = 'products' THEN v_record_id := NEW.product_id;
        ELSIF TG_TABLE_NAME = 'inventory' THEN v_record_id := NEW.inventory_id;
        ELSIF TG_TABLE_NAME = 'inventory_movement' THEN v_record_id := NEW.movement_id;
        ELSIF TG_TABLE_NAME = 'cotizaciones' THEN v_record_id := NEW.cotizacion_id;
        ELSIF TG_TABLE_NAME = 'detalle_cotizaciones' THEN v_record_id := NEW.detalle_id;
        ELSIF TG_TABLE_NAME = 'billing' THEN v_record_id := NEW.billing_id; END IF;
        v_description := 'Se insertó el registro ' || v_record_id || ' en ' || TG_TABLE_NAME;
        INSERT INTO audit (user_id, table_name, record_id, action, description) VALUES (v_user_id, TG_TABLE_NAME, v_record_id, v_action, v_description);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        IF TG_TABLE_NAME = 'users' THEN v_record_id := NEW.user_id;
        ELSIF TG_TABLE_NAME = 'products' THEN v_record_id := NEW.product_id;
        ELSIF TG_TABLE_NAME = 'inventory' THEN v_record_id := NEW.inventory_id;
        ELSIF TG_TABLE_NAME = 'inventory_movement' THEN v_record_id := NEW.movement_id;
        ELSIF TG_TABLE_NAME = 'cotizaciones' THEN v_record_id := NEW.cotizacion_id;
        ELSIF TG_TABLE_NAME = 'detalle_cotizaciones' THEN v_record_id := NEW.detalle_id;
        ELSIF TG_TABLE_NAME = 'billing' THEN v_record_id := NEW.billing_id; END IF;
        v_description := 'Se actualizó el registro ' || v_record_id || ' en ' || TG_TABLE_NAME;
        INSERT INTO audit (user_id, table_name, record_id, action, description) VALUES (v_user_id, TG_TABLE_NAME, v_record_id, v_action, v_description);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        IF TG_TABLE_NAME = 'users' THEN v_record_id := OLD.user_id;
        ELSIF TG_TABLE_NAME = 'products' THEN v_record_id := OLD.product_id;
        ELSIF TG_TABLE_NAME = 'inventory' THEN v_record_id := OLD.inventory_id;
        ELSIF TG_TABLE_NAME = 'inventory_movement' THEN v_record_id := OLD.movement_id;
        ELSIF TG_TABLE_NAME = 'cotizaciones' THEN v_record_id := OLD.cotizacion_id;
        ELSIF TG_TABLE_NAME = 'detalle_cotizaciones' THEN v_record_id := OLD.detalle_id;
        ELSIF TG_TABLE_NAME = 'billing' THEN v_record_id := OLD.billing_id; END IF;
        v_description := 'Se eliminó el registro ' || v_record_id || ' de ' || TG_TABLE_NAME;
        INSERT INTO audit (user_id, table_name, record_id, action, description) VALUES (v_user_id, TG_TABLE_NAME, v_record_id, v_action, v_description);
        RETURN OLD;
    END IF;
    RETURN NULL;
END; $$;

CREATE TRIGGER trg_audit_users AFTER INSERT OR UPDATE OR DELETE ON Users FOR EACH ROW EXECUTE FUNCTION log_audit_trigger_func();
CREATE TRIGGER trg_audit_products AFTER INSERT OR UPDATE OR DELETE ON Products FOR EACH ROW EXECUTE FUNCTION log_audit_trigger_func();
CREATE TRIGGER trg_audit_inventory AFTER INSERT OR UPDATE OR DELETE ON inventory FOR EACH ROW EXECUTE FUNCTION log_audit_trigger_func();
CREATE TRIGGER trg_audit_inventory_movement AFTER INSERT OR UPDATE OR DELETE ON inventory_movement FOR EACH ROW EXECUTE FUNCTION log_audit_trigger_func();
CREATE TRIGGER trg_audit_cotizaciones AFTER INSERT OR UPDATE OR DELETE ON cotizaciones FOR EACH ROW EXECUTE FUNCTION log_audit_trigger_func();
CREATE TRIGGER trg_audit_detalle_cotizaciones AFTER INSERT OR UPDATE OR DELETE ON detalle_cotizaciones FOR EACH ROW EXECUTE FUNCTION log_audit_trigger_func();
CREATE TRIGGER trg_audit_billing AFTER INSERT OR UPDATE OR DELETE ON billing FOR EACH ROW EXECUTE FUNCTION log_audit_trigger_func();

-- ==========================================
-- 3. SINCRONIZACIÓN DE STOCK
-- ==========================================
CREATE OR REPLACE FUNCTION sync_stock_from_inventory_func()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE Products SET stock_quantity = stock_quantity + NEW.quantity WHERE product_id = NEW.product_id; RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE Products SET stock_quantity = stock_quantity + (NEW.quantity - OLD.quantity) WHERE product_id = NEW.product_id; RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE Products SET stock_quantity = stock_quantity - OLD.quantity WHERE product_id = OLD.product_id; RETURN OLD;
    END IF;
    RETURN NULL;
END; $$;

CREATE TRIGGER trg_sync_stock_inventory AFTER INSERT OR UPDATE OR DELETE ON inventory FOR EACH ROW EXECUTE FUNCTION sync_stock_from_inventory_func();

-- ==========================================
-- 4. FUNCIONES DE RESERVAS Y STOCK
-- ==========================================
CREATE OR REPLACE FUNCTION fn_stock_disponible(p_product_id INT, p_start_date DATE, p_end_date DATE) RETURNS INT LANGUAGE plpgsql AS $$
DECLARE v_stock_total INT; v_bloqueado INT;
BEGIN
    SELECT stock_quantity INTO v_stock_total FROM Products WHERE product_id = p_product_id;
    IF v_stock_total IS NULL THEN RETURN -1; END IF;
    SELECT COALESCE(SUM(dc.quantity), 0) INTO v_bloqueado
    FROM detalle_cotizaciones dc
    INNER JOIN cotizaciones c ON c.cotizacion_id = dc.cotizacion_id
    WHERE dc.product_id = p_product_id AND c.status IN ('approved', 'active')
      AND c.start_date <= p_end_date AND c.end_date >= p_start_date;
    RETURN v_stock_total - v_bloqueado;
END; $$;

CREATE OR REPLACE FUNCTION fn_crear_reserva(p_user_id INT, p_start_date DATE, p_months INT, p_observaciones TEXT, p_items JSONB)
RETURNS TABLE (cotizacion_id INT, total NUMERIC, mensaje TEXT) LANGUAGE plpgsql AS $$
DECLARE
    v_cotizacion_id INT; v_item JSONB; v_subtotal NUMERIC := 0; v_iva NUMERIC; v_total NUMERIC;
    v_precio_mensual NUMERIC; v_cantidad INT; v_product_id INT; v_disponible INT; v_end_date DATE;
BEGIN
    IF p_months IS NULL OR p_months < 1 THEN RETURN QUERY SELECT NULL::INT, NULL::NUMERIC, 'La reserva mínima es de 1 mes'::TEXT; RETURN; END IF;
    IF p_start_date IS NULL THEN RETURN QUERY SELECT NULL::INT, NULL::NUMERIC, 'Debes elegir una fecha de inicio'::TEXT; RETURN; END IF;
    IF p_start_date < CURRENT_DATE THEN RETURN QUERY SELECT NULL::INT, NULL::NUMERIC, 'No puedes reservar en fechas pasadas'::TEXT; RETURN; END IF;
    IF NOT EXISTS (SELECT 1 FROM Users WHERE user_id = p_user_id) THEN RETURN QUERY SELECT NULL::INT, NULL::NUMERIC, 'Usuario no encontrado'::TEXT; RETURN; END IF;
    
    v_end_date := p_start_date + (p_months || ' months')::INTERVAL;
    
    FOR v_item IN SELECT jsonb_array_elements(p_items) LOOP
        v_product_id := (v_item->>'product_id')::INT;
        v_cantidad := (v_item->>'quantity')::INT;
        SELECT i.initial_price INTO v_precio_mensual FROM inventory i WHERE i.product_id = v_product_id LIMIT 1;
        IF v_precio_mensual IS NULL THEN RETURN QUERY SELECT NULL::INT, NULL::NUMERIC, ('Producto ' || v_product_id || ' sin inventario')::TEXT; RETURN; END IF;
        v_disponible := fn_stock_disponible(v_product_id, p_start_date, v_end_date);
        IF v_disponible < v_cantidad THEN RETURN QUERY SELECT NULL::INT, NULL::NUMERIC, ('Stock insuficiente para el producto ' || v_product_id || ' (disponible: ' || v_disponible || ')')::TEXT; RETURN; END IF;
        v_subtotal := v_subtotal + (v_precio_mensual * p_months * v_cantidad);
    END LOOP;
    
    v_iva := v_subtotal * 0.19; v_total := v_subtotal + v_iva;
    
    INSERT INTO cotizaciones (user_id, iva, total_price, status, observations, start_date, end_date)
    VALUES (p_user_id, v_iva, v_total, 'pending', p_observaciones, p_start_date, v_end_date)
    RETURNING cotizaciones.cotizacion_id INTO v_cotizacion_id;
    
    FOR v_item IN SELECT jsonb_array_elements(p_items) LOOP
        v_product_id := (v_item->>'product_id')::INT;
        v_cantidad := (v_item->>'quantity')::INT;
        SELECT i.initial_price INTO v_precio_mensual FROM inventory i WHERE i.product_id = v_product_id LIMIT 1;
        INSERT INTO detalle_cotizaciones (cotizacion_id, product_id, quantity, price) VALUES (v_cotizacion_id, v_product_id, v_cantidad, v_precio_mensual * p_months);
    END LOOP;
    
    RETURN QUERY SELECT v_cotizacion_id, v_total, ('Reserva creada por ' || p_months || ' mes(es). Espera aprobación.')::TEXT;
EXCEPTION WHEN OTHERS THEN RETURN QUERY SELECT NULL::INT, NULL::NUMERIC, SQLERRM::TEXT;
END; $$;

CREATE OR REPLACE FUNCTION fn_aprobar_reserva(p_cotizacion_id INT, p_admin_id INT) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE v_status VARCHAR; v_admin_role VARCHAR; v_item RECORD; v_disponible INT;
BEGIN
    SELECT role INTO v_admin_role FROM Users WHERE user_id = p_admin_id;
    IF v_admin_role IS NULL OR v_admin_role != 'admin' THEN RETURN 'Solo un administrador puede aprobar reservas'; END IF;
    SELECT status INTO v_status FROM cotizaciones WHERE cotizacion_id = p_cotizacion_id;
    IF v_status IS NULL THEN RETURN 'Reserva no encontrada'; END IF;
    IF v_status != 'pending' THEN RETURN 'Solo se pueden aprobar reservas pendientes'; END IF;
    FOR v_item IN SELECT dc.product_id, dc.quantity, c.start_date, c.end_date FROM detalle_cotizaciones dc INNER JOIN cotizaciones c ON c.cotizacion_id = dc.cotizacion_id WHERE dc.cotizacion_id = p_cotizacion_id LOOP
        v_disponible := fn_stock_disponible(v_item.product_id, v_item.start_date, v_item.end_date);
        IF v_disponible < v_item.quantity THEN RETURN 'No se puede aprobar: stock insuficiente para el producto ' || v_item.product_id; END IF;
    END LOOP;
    UPDATE Products p SET stock_quantity = p.stock_quantity - dc.quantity FROM detalle_cotizaciones dc WHERE dc.cotizacion_id = p_cotizacion_id AND p.product_id = dc.product_id;
    UPDATE cotizaciones SET status = 'approved', approved_by = p_admin_id, approved_at = CURRENT_TIMESTAMP WHERE cotizacion_id = p_cotizacion_id;
    RETURN 'Reserva aprobada. Stock descontado.';
END; $$;

CREATE OR REPLACE FUNCTION fn_rechazar_reserva(p_cotizacion_id INT, p_admin_id INT, p_motivo TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE v_admin_role VARCHAR;
BEGIN
    SELECT role INTO v_admin_role FROM Users WHERE user_id = p_admin_id;
    IF v_admin_role IS NULL OR v_admin_role != 'admin' THEN RETURN 'Solo un administrador puede rechazar reservas'; END IF;
    UPDATE cotizaciones SET status = 'rejected', approved_by = p_admin_id, approved_at = CURRENT_TIMESTAMP, rejection_reason = p_motivo WHERE cotizacion_id = p_cotizacion_id AND status = 'pending';
    IF NOT FOUND THEN RETURN 'No se pudo rechazar (no existe o no está pendiente)'; END IF;
    RETURN 'Reserva rechazada';
END; $$;

CREATE OR REPLACE FUNCTION fn_marcar_notificada(p_cotizacion_id INT) RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
    UPDATE cotizaciones SET notificado_vencimiento = TRUE, fecha_notificacion = CURRENT_TIMESTAMP WHERE cotizacion_id = p_cotizacion_id AND notificado_vencimiento = FALSE;
    IF NOT FOUND THEN RETURN 'La reserva ya fue notificada o no existe'; END IF;
    RETURN 'Notificación marcada';
END; $$;

CREATE OR REPLACE FUNCTION fn_actualizar_estados_reservas() RETURNS TABLE (actualizadas INT, detalle TEXT) LANGUAGE plpgsql AS $$
DECLARE v_count INT := 0; v_item RECORD; v_reserva RECORD;
BEGIN
    UPDATE cotizaciones SET status = 'active' WHERE status = 'approved' AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    FOR v_reserva IN SELECT cotizacion_id FROM cotizaciones WHERE status = 'active' AND end_date < CURRENT_DATE LOOP
        FOR v_item IN SELECT dc.product_id, dc.quantity FROM detalle_cotizaciones dc WHERE dc.cotizacion_id = v_reserva.cotizacion_id LOOP
            UPDATE Products SET stock_quantity = stock_quantity + v_item.quantity WHERE product_id = v_item.product_id;
        END LOOP;
        UPDATE cotizaciones SET status = 'completed' WHERE cotizacion_id = v_reserva.cotizacion_id;
    END LOOP;
    IF v_count > 0 THEN RETURN QUERY SELECT v_count, ('Activadas: ' || v_count)::TEXT;
    ELSE RETURN QUERY SELECT 0, 'Sin cambios'::TEXT; END IF;
END; $$;

-- ==========================================
-- 5. ÍNDICES Y VISTAS
-- ==========================================
CREATE INDEX idx_cotizaciones_fechas ON cotizaciones(start_date, end_date) WHERE status IN ('approved', 'active');
CREATE INDEX idx_cotizaciones_end_date ON cotizaciones(end_date) WHERE status IN ('approved', 'active');
CREATE INDEX idx_cotizaciones_user ON cotizaciones(user_id, status);
CREATE INDEX idx_cotizaciones_approved_by ON cotizaciones(approved_by) WHERE approved_by IS NOT NULL;

CREATE OR REPLACE VIEW v_stock_bloqueado AS
SELECT dc.product_id, c.start_date, c.end_date, SUM(dc.quantity) AS cantidad_bloqueada
FROM detalle_cotizaciones dc
INNER JOIN cotizaciones c ON c.cotizacion_id = dc.cotizacion_id
WHERE c.status IN ('approved', 'active')
GROUP BY dc.product_id, c.start_date, c.end_date;

CREATE OR REPLACE VIEW v_reservas_por_vencer AS
SELECT c.cotizacion_id, c.user_id, u.username, u.email AS cliente_email, c.start_date, c.end_date, c.total_price, c.status, (c.end_date - CURRENT_DATE) AS dias_restantes, c.notificado_vencimiento, c.fecha_notificacion
FROM cotizaciones c
INNER JOIN Users u ON u.user_id = c.user_id
WHERE c.status IN ('approved', 'active') AND c.end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '3 days')
ORDER BY c.end_date ASC;

-- ==========================================
-- 6. DATOS DE PRUEBA (OPCIONAL)
-- ==========================================
INSERT INTO Users (username, email, password, phone_number, status, role) VALUES 
('david_perez', 'david.perez@example.com', 'hashed_pass_123', '3001234567', 'active', 'admin'),
('ana_gomez', 'ana.gomez@example.com', 'hashed_pass_456', '3109876543', 'active', 'client');

INSERT INTO Products (name, description, stock_quantity, type, status, image_url, model_number) VALUES 
('Taladro Percutor 12V', 'Taladro inalambrico profesional con maletin', 10, 'Herramienta', 'available', 'https://img.example.com/taladro.jpg', 'TP-2026'),
('Excavadora Oruga 340D2', 'Maquinaria pesada para construccion y mineria', 2, 'Maquinaria', 'available', 'https://img.example.com/excavadora.jpg', 'CAT-340');

INSERT INTO inventory (product_id, quantity, initial_price) VALUES 
(1, 10, 45000.00),
(2, 2, 850000.00);

INSERT INTO inventory_movement (product_id, quantity, movement_type, price) VALUES 
(1, 5, 'in', 45000.00),
(2, 1, 'in', 850000.00);