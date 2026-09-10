from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Numeric,
    ForeignKey,
    TIMESTAMP
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from config.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True)
    username = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    phone_number = Column(String(15))
    status = Column(String(20), default="active")
    role = Column(String(20), nullable=False, default="client")
    date_registered = Column(
        TIMESTAMP,
        server_default=func.current_timestamp()
    )
    created_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp()
    )

    cotizaciones = relationship(
        "Cotizacion",
        back_populates="user"
    )

    audits = relationship(
        "Audit",
        back_populates="user"
    )


class Product(Base):
    __tablename__ = "products"

    product_id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    stock_quantity = Column(Integer, nullable=False)
    type = Column(String(100), nullable=False)
    status = Column(String(20), default="available")
    image_url = Column(String(255))
    model_number = Column(String(100))

    inventory = relationship(
        "Inventory",
        back_populates="product"
    )

    inventory_movements = relationship(
        "InventoryMovement",
        back_populates="product"
    )

    detalles = relationship(
        "DetalleCotizacion",
        back_populates="product"
    )


class Inventory(Base):
    __tablename__ = "inventory"

    inventory_id = Column(Integer, primary_key=True)
    product_id = Column(
        Integer,
        ForeignKey("products.product_id"),
        nullable=False
    )
    quantity = Column(Integer, nullable=False)
    date_added = Column(
        TIMESTAMP,
        server_default=func.current_timestamp()
    )
    initial_price = Column(Numeric(10, 2), nullable=False)

    product = relationship(
        "Product",
        back_populates="inventory"
    )


class InventoryMovement(Base):
    __tablename__ = "inventory_movement"

    movement_id = Column(Integer, primary_key=True)
    product_id = Column(
        Integer,
        ForeignKey("products.product_id"),
        nullable=False
    )
    quantity = Column(Integer, nullable=False)
    movement_type = Column(String(10), nullable=False)
    date_moved = Column(
        TIMESTAMP,
        server_default=func.current_timestamp()
    )
    price = Column(Numeric(10, 2), nullable=False)

    product = relationship(
        "Product",
        back_populates="inventory_movements"
    )


class Cotizacion(Base):
    __tablename__ = "cotizaciones"

    cotizacion_id = Column(Integer, primary_key=True)
    user_id = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=False
    )
    iva = Column(Numeric(12, 2), nullable=False)  # <-- Corregido a 12,2
    date_created = Column(
        TIMESTAMP,
        server_default=func.current_timestamp()
    )
    total_price = Column(Numeric(12, 2), nullable=False)  # <-- Corregido a 12,2
    status = Column(String(20), default="pending")
    observations = Column(Text)
    created_at = Column(
        TIMESTAMP,
        server_default=func.current_timestamp()
    )

    user = relationship(
        "User",
        back_populates="cotizaciones"
    )

    detalles = relationship(
        "DetalleCotizacion",
        back_populates="cotizacion"
    )

    billing = relationship(
        "Billing",
        back_populates="cotizacion"
    )


class DetalleCotizacion(Base):
    __tablename__ = "detalle_cotizaciones"

    detalle_id = Column(Integer, primary_key=True)
    cotizacion_id = Column(
        Integer,
        ForeignKey("cotizaciones.cotizacion_id"),
        nullable=False
    )
    product_id = Column(
        Integer,
        ForeignKey("products.product_id"),
        nullable=False
    )
    quantity = Column(Integer, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)

    cotizacion = relationship(
        "Cotizacion",
        back_populates="detalles"
    )

    product = relationship(
        "Product",
        back_populates="detalles"
    )


class Billing(Base):
    __tablename__ = "billing"

    billing_id = Column(Integer, primary_key=True)
    cotizacion_id = Column(
        Integer,
        ForeignKey("cotizaciones.cotizacion_id"),
        nullable=False
    )
    total_amount = Column(Numeric(10, 2), nullable=False)
    date_billed = Column(
        TIMESTAMP,
        server_default=func.current_timestamp()
    )

    cotizacion = relationship(
        "Cotizacion",
        back_populates="billing"
    )


class Audit(Base):
    __tablename__ = "audit"

    audit_id = Column(Integer, primary_key=True)
    user_id = Column(
        Integer,
        ForeignKey("users.user_id")
    )
    table_name = Column(String(100), nullable=False)
    record_id = Column(Integer, nullable=False)
    action = Column(String(10), nullable=False)
    description = Column(String(500))
    date = Column(
        TIMESTAMP,
        server_default=func.current_timestamp()
    )

    user = relationship(
        "User",
        back_populates="audits"
    )