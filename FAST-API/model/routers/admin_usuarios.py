"""
CRUD de usuarios — SOLO administradores.

Reglas de negocio:
  • Todo el router exige un token válido de un usuario con rol 'admin'.
  • Los administradores son INVISIBLES aquí: no aparecen en el listado y
    consultar/editar/eliminar uno responde 404 (no se revela que existe).
  • Los usuarios creados desde este módulo son siempre 'client'. Los asesores
    se promueven desde el módulo de asesores; los admins no se crean desde la app.
  • El rol no se puede cambiar desde aquí.
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from config.database import get_db
from model.dependencies import require_admin
from model.models import User
from model.security import hash_password
from schema.schemas import AdminUserCreate, AdminUserResponse, AdminUserUpdate

router = APIRouter(
    prefix="/admin/users",
    tags=["Admin - Usuarios"],
    dependencies=[Depends(require_admin)],
)


def _buscar_no_admin(db: Session, user_id: int) -> User:
    """Busca un usuario que NO sea admin; si es admin o no existe → 404."""
    usuario = (
        db.query(User)
        .filter(User.user_id == user_id, User.role != "admin")
        .first()
    )
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


def _email_en_uso(db: Session, email: str, excluir_id: Optional[int] = None) -> bool:
    q = db.query(User.user_id).filter(func.lower(User.email) == email.lower())
    if excluir_id is not None:
        q = q.filter(User.user_id != excluir_id)
    return q.first() is not None


# ==========================================
# LISTAR (sin admins) + búsqueda y filtros
# ==========================================
@router.get("/", response_model=list[AdminUserResponse])
def listar_usuarios(
    q: Optional[str] = Query(None, description="Busca por nombre, correo o teléfono"),
    role: Optional[str] = Query(None, description="client | asesor"),
    status: Optional[str] = Query(None, description="active | inactive"),
    db: Session = Depends(get_db),
):
    query = db.query(User).filter(User.role != "admin")

    if q:
        patron = f"%{q.strip()}%"
        query = query.filter(
            or_(
                User.username.ilike(patron),
                User.email.ilike(patron),
                User.phone_number.ilike(patron),
            )
        )
    if role:
        query = query.filter(User.role == role)
    if status:
        query = query.filter(User.status == status)

    return query.order_by(User.user_id.desc()).all()


# ==========================================
# OBTENER UNO
# ==========================================
@router.get("/{user_id}", response_model=AdminUserResponse)
def obtener_usuario(user_id: int, db: Session = Depends(get_db)):
    return _buscar_no_admin(db, user_id)


# ==========================================
# CREAR
# ==========================================
@router.post("/", response_model=AdminUserResponse, status_code=201)
def crear_usuario(datos: AdminUserCreate, db: Session = Depends(get_db)):
    if _email_en_uso(db, datos.email):
        raise HTTPException(status_code=400, detail="El correo ya está registrado.")

    nuevo = User(
        username=datos.username.strip(),
        email=datos.email,
        password=hash_password(datos.password),
        phone_number=datos.phone_number,
        status=datos.status,
        role="client",
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


# ==========================================
# ACTUALIZAR (parcial). La contraseña es opcional.
# ==========================================
@router.put("/{user_id}", response_model=AdminUserResponse)
def actualizar_usuario(user_id: int, datos: AdminUserUpdate, db: Session = Depends(get_db)):
    usuario = _buscar_no_admin(db, user_id)
    cambios = datos.model_dump(exclude_unset=True)

    if cambios.get("email") and _email_en_uso(db, cambios["email"], excluir_id=user_id):
        raise HTTPException(status_code=400, detail="El correo ya está registrado.")

    if cambios.get("username"):
        usuario.username = cambios["username"].strip()
    if cambios.get("email"):
        usuario.email = cambios["email"]
    if "phone_number" in cambios:               # permite dejarlo vacío (None)
        usuario.phone_number = cambios["phone_number"] or None
    if cambios.get("status"):
        usuario.status = cambios["status"]
    if cambios.get("password"):                 # solo si escribieron una nueva
        usuario.password = hash_password(cambios["password"])

    db.commit()
    db.refresh(usuario)
    return usuario


# ==========================================
# ELIMINAR
# ==========================================
@router.delete("/{user_id}")
def eliminar_usuario(user_id: int, db: Session = Depends(get_db)):
    _buscar_no_admin(db, user_id)   # 404 si no existe o es admin

    try:
        # DELETE directo (no db.delete) para que SQLAlchemy no intente poner
        # en NULL las cotizaciones/auditorías del usuario; decide la BD (FK).
        db.execute(delete(User).where(User.user_id == user_id))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=(
                "No se puede eliminar: el usuario tiene cotizaciones, reservas o "
                "registros asociados. Puedes desactivarlo en su lugar."
            ),
        )

    return {"mensaje": "Usuario eliminado correctamente"}
