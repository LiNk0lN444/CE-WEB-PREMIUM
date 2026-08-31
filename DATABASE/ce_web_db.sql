// TABLA DE USUARIOS//

CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15),
    status ENUM('active', 'inactive') DEFAULT 'active',
    date_registered TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

//TABLA DE PRODUCTOS//

CREATE TABLE Products (
  product_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,  
  description TEXT,
  stock_quantity INT NOT NULL,
  type VARCHAR(100) NOT NULL,
  status ENUM('available', 'for loan', 'unavailable') DEFAULT 'available',
  image_url VARCHAR(255),
  model_number VARCHAR(100),
);

//TABLA DE INVENTARIO//

CREATE TABLE inventory (
  inventory_id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  initial_price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

//TABLA DE MOVIMIENTOS DE INVENTARIO//

CREATE TABLE inventory_movement (
  movement_id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  movement_type ENUM('in', 'out') NOT NULL,
  date_moved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

//TABLA DE COTIZACIONES//

CREATE TABLE cotizaciones (
    cotizacion_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    iva DECIMAL(5, 2) NOT NULL,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_price DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
);

//TABLA DE DETALLE DE COTIZACIONES//

CREATE TABLE detalle_cotizaciones (
    detalle_id INT PRIMARY KEY AUTO_INCREMENT,
    cotizacion_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,

    FOREIGN KEY (cotizacion_id)
        REFERENCES cotizaciones(cotizacion_id),

    FOREIGN KEY (product_id)
        REFERENCES Products(product_id)
);

//TABLA DE FACTURACION//

CREATE TABLE billing (
    billing_id INT PRIMARY KEY AUTO_INCREMENT,
    cotizacion_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    date_billed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(cotizacion_id)
);

//TABLA DE AUDITORIA//

CREATE TABLE audit (
    audit_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    description VARCHAR(500),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);   