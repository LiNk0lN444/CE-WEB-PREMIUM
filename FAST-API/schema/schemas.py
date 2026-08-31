from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# ==========================================
# 1. ROLES
# ==========================================

class RoleCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None


class RoleResponse(BaseModel):
    id_rol: int
    nombre: str
    descripcion: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================
# 2. USUARIOS
# ==========================================

class UsuarioCreate(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    contrasena: str
    telefono: Optional[str] = None
    id_rol: int


class UsuarioResponse(BaseModel):
    id_usuario: int
    nombre: str
    apellido: str
    email: EmailStr
    telefono: Optional[str] = None
    estado: str
    id_rol: int
    fecha_registro: datetime

    class Config:
        from_attributes = True


# ==========================================
# 3. CLIENTES
# ==========================================

class ClienteCreate(BaseModel):
    nombre: str
    apellido: str
    documento: str
    empresa: Optional[str] = None
    telefono: Optional[str] = None
    correo: EmailStr
    direccion: Optional[str] = None
    ciudad: Optional[str] = None


class ClienteResponse(BaseModel):
    id_cliente: int
    nombre: str
    apellido: str
    documento: str
    empresa: Optional[str] = None
    telefono: Optional[str] = None
    correo: EmailStr
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    fecha_registro: datetime

    class Config:
        from_attributes = True


# ==========================================
# 4. MAQUINARIA
# ==========================================

class MaquinariaCreate(BaseModel):
    codigo: str
    nombre: str
    marca: Optional[str] = None
    maquina_disponible: Optional[bool] = True
    modelo: Optional[str] = None
    descripcion: Optional[str] = None
    precio_dia: float
    estado: Optional[str] = "disponible"
    imagen: Optional[str] = None


class MaquinariaResponse(BaseModel):
    id_maquinaria: int
    codigo: str
    nombre: str
    marca: Optional[str] = None
    maquina_disponible: bool
    modelo: Optional[str] = None
    descripcion: Optional[str] = None
    precio_dia: float
    estado: str
    imagen: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================
# 5. CATEGORÍAS
# ==========================================

class CategoriaCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None


class CategoriaResponse(BaseModel):
    id_categoria: int
    nombre: str
    descripcion: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================
# 6. HERRAMIENTAS
# ==========================================

class HerramientaCreate(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    cantidad_disponible: int = 0
    precio: float
    imagen: Optional[str] = None
    id_categoria: Optional[int] = None


class HerramientaResponse(BaseModel):
    id_herramienta: int
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    cantidad_disponible: int
    precio: float
    imagen: Optional[str] = None
    id_categoria: Optional[int] = None

    class Config:
        from_attributes = True


# ==========================================
# 7. DETALLE COTIZACIÓN
# ==========================================

class DetalleCotizacionCreate(BaseModel):
    id_maquinaria: Optional[int] = None
    id_herramienta: Optional[int] = None
    cantidad: int = 1
    dias_alquiler: int = 1
    valor_unitario: float
    subtotal: float


class DetalleCotizacionResponse(BaseModel):
    id_detalle: int
    id_cotizacion: int
    id_maquinaria: Optional[int] = None
    id_herramienta: Optional[int] = None
    cantidad: int
    dias_alquiler: int
    valor_unitario: float
    subtotal: float

    class Config:
        from_attributes = True


# ==========================================
# 8. COTIZACIONES
# ==========================================

class CotizacionCreate(BaseModel):
    numero_cotizacion: str
    id_cliente: int
    id_usuario: int
    subtotal: float = 0.0
    iva: float = 0.0
    total: float = 0.0
    estado: str = "borrador"
    observaciones: Optional[str] = None


class CotizacionResponse(BaseModel):
    id_cotizacion: int
    numero_cotizacion: str
    id_cliente: int
    id_usuario: int
    fecha: datetime
    subtotal: float
    iva: float
    total: float
    estado: str
    observaciones: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================
# 9. AUDITORÍA
# ==========================================

class AuditoriaCreate(BaseModel):
    id_usuario: Optional[int] = None
    id_maquinaria: Optional[int] = None
    movimiento: str
    tiempo_alquiler: str
    estado: str


class AuditoriaResponse(BaseModel):
    id_auditoria: int
    id_usuario: Optional[int] = None
    id_maquinaria: Optional[int] = None
    movimiento: str
    tiempo_alquiler: str
    estado: str
    fecha: datetime

    class Config:
        from_attributes = True


# ==========================================
# 10. REPORTES
# ==========================================

class ReporteCreate(BaseModel):
    nombre: str
    tipo: str
    usuario: str


class ReporteResponse(BaseModel):
    id_reporte: int
    nombre: str
    tipo: str
    fecha_generacion: datetime
    usuario: str

    class Config:
        from_attributes = True


# ==========================================
# 11. NOTIFICACIONES
# ==========================================

class NotificacionCreate(BaseModel):
    id_cliente: Optional[int] = None
    id_cotizacion: Optional[int] = None
    correo: EmailStr
    mensaje: str
    estado_envio: Optional[str] = "pendiente"


class NotificacionResponse(BaseModel):
    id_notificacion: int
    id_cliente: Optional[int] = None
    id_cotizacion: Optional[int] = None
    correo: EmailStr
    mensaje: str
    estado_envio: str
    fecha: datetime

    class Config:
        from_attributes = True


# ==========================================
# ESQUEMA DE PRUEBA
# ==========================================

class UserSchema(BaseModel):
    id: Optional[int] = None
    name: str
    email: str