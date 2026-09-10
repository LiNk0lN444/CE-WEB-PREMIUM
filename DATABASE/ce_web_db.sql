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
IF TG_TABLE_NAME = 'users' AND OLD.role IS DISTINCT FROM NEW.role THEN
    v_description := v_description || 
        ' | Cambio de rol: ' || OLD.role || ' → ' || NEW.role;
END IF;
UPDATE Users
SET role = 'admin'
WHERE email = 'david.perez@example.com';
