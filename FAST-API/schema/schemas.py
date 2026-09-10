from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime


# ==========================================
# 1. USERS
# ==========================================

# Base común
class UserBase(BaseModel):
    username: str
    email: str
    phone_number: Optional[str] = None
    status: str = "active"

# Para crear usuario (desde el frontend público)
class UserCreate(UserBase):
    password: str

# Para admin (crear otros admins)
class UserCreateAdmin(UserBase):
    password: str
    role: str = "client"

# Para responder al frontend
class UserResponse(BaseModel):
    user_id: int
    username: str
    email: str
    phone_number: Optional[str] = None
    status: str
    role: str          # 👈 añadido

    class Config:
        from_attributes = True


# ==========================================
# 2. PRODUCTS
# ==========================================

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    stock_quantity: int
    type: str
    status: Optional[str] = "available"
    image_url: Optional[str] = None
    model_number: Optional[str] = None


class ProductResponse(BaseModel):
    product_id: int
    name: str
    description: Optional[str] = None
    stock_quantity: int
    type: str
    status: Optional[str] = None
    image_url: Optional[str] = None
    model_number: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 3. INVENTORY
# ==========================================

class InventoryCreate(BaseModel):
    product_id: int
    quantity: int
    initial_price: float


class InventoryResponse(BaseModel):
    inventory_id: int
    product_id: int
    quantity: int
    date_added: Optional[datetime] = None
    initial_price: float

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 4. INVENTORY MOVEMENT
# ==========================================

class InventoryMovementCreate(BaseModel):
    product_id: int
    quantity: int
    movement_type: str
    price: float


class InventoryMovementResponse(BaseModel):
    movement_id: int
    product_id: int
    quantity: int
    movement_type: str
    date_moved: Optional[datetime] = None
    price: float

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 5. COTIZACIONES
# ==========================================

class CotizacionCreate(BaseModel):
    user_id: int
    iva: float
    total_price: float
    status: Optional[str] = "pending"
    observations: Optional[str] = None


class CotizacionResponse(BaseModel):
    cotizacion_id: int
    user_id: int
    iva: float
    date_created: Optional[datetime] = None
    total_price: float
    status: Optional[str] = None
    observations: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 6. DETALLE COTIZACIONES
# ==========================================

class DetalleCotizacionCreate(BaseModel):
    cotizacion_id: int
    product_id: int
    quantity: int
    price: float


class DetalleCotizacionResponse(BaseModel):
    detalle_id: int
    cotizacion_id: int
    product_id: int
    quantity: int
    price: float

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 7. BILLING
# ==========================================

class BillingCreate(BaseModel):
    cotizacion_id: int
    total_amount: float


class BillingResponse(BaseModel):
    billing_id: int
    cotizacion_id: int
    total_amount: float
    date_billed: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 8. AUDIT
# ==========================================

class AuditCreate(BaseModel):
    user_id: Optional[int] = None
    table_name: str
    record_id: int
    action: str
    description: Optional[str] = None


class AuditResponse(BaseModel):
    audit_id: int
    user_id: Optional[int] = None
    table_name: str
    record_id: int
    action: str
    description: Optional[str] = None
    date: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# ============================
# AUTH (para login)
# ============================
class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    user_id: int
    username: str
    email: str
    phone_number: Optional[str] = None
    status: str
    role: str