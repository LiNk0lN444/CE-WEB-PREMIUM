from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime
from datetime import date
from typing import List


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
# ==========================================
# RESERVAS (sistema por meses)
# ==========================================



class ReservaItem(BaseModel):
    """Ítem de la reserva. El precio NO se envía — lo toma el backend de inventory."""
    product_id: int
    quantity: int


class ReservaCreate(BaseModel):
    """Datos para crear una reserva por meses."""
    user_id: int
    start_date: date
    months: int          # mínimo 1
    observations: Optional[str] = ""
    items: List[ReservaItem]


class ReservaResponse(BaseModel):
    cotizacion_id: int
    total: float
    mensaje: str


class AprobarReserva(BaseModel):
    admin_id: int


class RechazarReserva(BaseModel):
    admin_id: int
    motivo: str


class ReservaDetalle(BaseModel):
    cotizacion_id: int
    user_id: int
    username: str
    cliente_email: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    months: Optional[int] = None
    total_price: float
    status: str
    observations: Optional[str] = None
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    notificado_vencimiento: bool = False
    dias_restantes: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class DisponibilidadResponse(BaseModel):
    product_id: int
    start_date: date
    end_date: date
    disponibles: int
    mensaje: str


# ==========================================
# ASESORES
# ==========================================
from datetime import time as dt_time
from typing import List


class AsesorCreate(BaseModel):
    user_id: int
    nombre_completo: str
    telefono: Optional[str] = None
    especialidad: Optional[str] = None


class AsesorResponse(BaseModel):
    asesor_id: int
    user_id: int
    nombre_completo: str
    telefono: Optional[str] = None
    especialidad: Optional[str] = None
    activo: bool

    model_config = ConfigDict(from_attributes=True)


class HorarioCreate(BaseModel):
    dia_semana: str  # lunes, martes, miercoles, jueves, viernes, sabado, domingo
    hora_inicio: dt_time
    hora_fin: dt_time


class HorarioResponse(BaseModel):
    horario_id: int
    asesor_id: int
    dia_semana: str
    hora_inicio: dt_time
    hora_fin: dt_time
    activo: bool

    model_config = ConfigDict(from_attributes=True)


class ContratoCreate(BaseModel):
    fecha_inicio: date
    fecha_fin: Optional[date] = None
    salario: float
    tipo_contrato: str  # indefinido, fijo, prestacion_servicios
    estado: str = "activo"
    documento_url: Optional[str] = None
    observaciones: Optional[str] = None


class ContratoResponse(BaseModel):
    contrato_id: int
    asesor_id: int
    fecha_inicio: date
    fecha_fin: Optional[date] = None
    salario: float
    tipo_contrato: str
    estado: str
    documento_url: Optional[str] = None
    observaciones: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class CitaResponse(BaseModel):
    slot_id: int
    asesor_id: int
    cotizacion_id: Optional[int] = None
    fecha: date
    hora_inicio: dt_time
    hora_fin: dt_time
    estado: str
    notas: Optional[str] = None

    # Info del cliente y cotización
    cliente_username: Optional[str] = None
    cliente_email: Optional[str] = None
    cliente_telefono: Optional[str] = None
    cotizacion_total: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class CitaEstadoUpdate(BaseModel):
    estado: str  # realizada, cancelada, no_contesto
    notas: Optional[str] = None