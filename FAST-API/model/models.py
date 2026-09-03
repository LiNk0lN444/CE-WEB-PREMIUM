from sqlalchemy import Column, Integer, String, Text, Boolean, Numeric, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.database import Base
 
 
class Role  (Base):
    __tablename__ = "roles"
 
    id_rol = Column(Integer, primary_key=True)
    cargo = Column(String(50), nullable=False)
    descripcion = Column(Text)
 
    usuarios = relationship("Usuario", back_populates="rol")
 
 
class Usuario(Base):
    __tablename__ = "usuarios"
 
    id_usuario = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    contrasena = Column(String(255), nullable=False)
    telefono = Column(String(20))
    estado = Column(String(20), default="activo")
    id_rol = Column(Integer, ForeignKey("roles.id_rol", ondelete="RESTRICT"))
    fecha_registro = Column(TIMESTAMP, server_default=func.current_timestamp())
 
    rol = relationship("Role", back_populates="usuarios")
 
 
class Cliente(Base):
    __tablename__ = "clientes"
 
    id_cliente = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    documento = Column(String(50), unique=True, nullable=False)
    empresa = Column(String(150))
    telefono = Column(String(20))
    correo = Column(String(150), unique=True, nullable=False)
    direccion = Column(String(255))
    ciudad = Column(String(100))
    fecha_registro = Column(TIMESTAMP, server_default=func.current_timestamp())
 
 
class Maquinaria(Base):
    __tablename__ = "maquinaria"
 
    id_maquinaria = Column(Integer, primary_key=True)
    codigo = Column(String(50), unique=True, nullable=False)
    nombre = Column(String(150), nullable=False)
    marca = Column(String(100))
    maquina_disponible = Column(Boolean, default=True)
    modelo = Column(String(100))
    descripcion = Column(Text)
    precio_dia = Column(Numeric(12, 2), nullable=False)
    estado = Column(String(50), default="disponible")
    imagen = Column(Text)
 
 
class Categoria(Base):
    __tablename__ = "categorias"
 
    id_categoria = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
 
    herramientas = relationship("Herramienta", back_populates="categoria")
 
 
class Herramienta(Base):
    __tablename__ = "herramientas"
 
    id_herramienta = Column(Integer, primary_key=True)
    codigo = Column(String(50), unique=True, nullable=False)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(Text)
    cantidad_disponible = Column(Integer, nullable=False, default=0)
    precio = Column(Numeric(12, 2), nullable=False)
    imagen = Column(Text)
    id_categoria = Column(Integer, ForeignKey("categorias.id_categoria", ondelete="SET NULL"))
 
    categoria = relationship("Categoria", back_populates="herramientas")
 
 
class Auditoria(Base):
    __tablename__ = "auditoria"
 
    id_auditoria = Column(Integer, primary_key=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="RESTRICT"))
    id_maquinaria = Column(Integer, ForeignKey("maquinaria.id_maquinaria", ondelete="SET NULL"))
    movimiento = Column(String(100), nullable=False)
    tiempo_alquiler = Column(String(100), nullable=False)
    estado = Column(String(50), nullable=False)
    fecha = Column(TIMESTAMP, server_default=func.current_timestamp())
 
 
class Cotizacion(Base):
    __tablename__ = "cotizaciones"
 
    id_cotizacion = Column(Integer, primary_key=True)
    numero_cotizacion = Column(String(50), unique=True, nullable=False)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente", ondelete="RESTRICT"))
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario", ondelete="RESTRICT"))
    fecha = Column(TIMESTAMP, server_default=func.current_timestamp())
    subtotal = Column(Numeric(12, 2), nullable=False, default=0.00)
    iva = Column(Numeric(12, 2), nullable=False, default=0.00)
    total = Column(Numeric(12, 2), nullable=False, default=0.00)
    estado = Column(String(50), default="borrador")
    observaciones = Column(Text)
 
    detalles = relationship("DetalleCotizacion", back_populates="cotizacion", cascade="all, delete")
 
 
class DetalleCotizacion(Base):
    __tablename__ = "detalle_cotizacion"
 
    id_detalle = Column(Integer, primary_key=True)
    id_cotizacion = Column(Integer, ForeignKey("cotizaciones.id_cotizacion", ondelete="CASCADE"))
    id_maquinaria = Column(Integer, ForeignKey("maquinaria.id_maquinaria", ondelete="SET NULL"))
    id_herramienta = Column(Integer, ForeignKey("herramientas.id_herramienta", ondelete="SET NULL"))
    cantidad = Column(Integer, nullable=False, default=1)
    dias_alquiler = Column(Integer, nullable=False, default=1)
    valor_unitario = Column(Numeric(12, 2), nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False)
 
    cotizacion = relationship("Cotizacion", back_populates="detalles")
 
 
class Reporte(Base):
    __tablename__ = "reportes"
 
    id_reporte = Column(Integer, primary_key=True)
    nombre = Column(String(150), nullable=False)
    tipo = Column(String(100), nullable=False)
    fecha_generacion = Column(TIMESTAMP, server_default=func.current_timestamp())
    usuario = Column(String(100), nullable=False)
 
 
class Notificacion(Base):
    __tablename__ = "notificaciones"
 
    id_notificacion = Column(Integer, primary_key=True)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente", ondelete="CASCADE"))
    id_cotizacion = Column(Integer, ForeignKey("cotizaciones.id_cotizacion", ondelete="CASCADE"))
    correo = Column(String(150), nullable=False)
    mensaje = Column(Text, nullable=False)
    estado_envio = Column(String(50), default="pendiente")
    fecha = Column(TIMESTAMP, server_default=func.current_timestamp())