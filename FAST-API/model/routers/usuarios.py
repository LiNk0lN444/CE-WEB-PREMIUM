
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from schema.schemas import UserCreate, UserResponse
from model.models import User
from model.security import hash_password

router = APIRouter(prefix="/users", tags=["Users"])

# ✅ Endpoint público — SIEMPRE crea client
@router.post("/", response_model=UserResponse)
def crear_usuario(user: UserCreate, db: Session = Depends(get_db)):
    # Verificar email duplicado
    existente = db.query(User).filter(User.email == user.email).first()
    if existente:
        raise HTTPException(status_code=400, detail="El correo ya está registrado.")

    nuevo = User(
        username=user.username,
        email=user.email,
        password=hash_password(user.password),
        phone_number=user.phone_number,
        status="active",
        role="client"              # 👈 forzado en el backend
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

# ✅ Listar usuarios (protegido — solo admins)
@router.get("/", response_model=list[UserResponse])
def listar_usuarios(db: Session = Depends(get_db)):
    # (por ahora abierto, luego le añadimos protección)
    return db.query(User).all()
# ==========================================
# OBTENER USUARIO POR ID
# ==========================================

@router.get("/{user_id}", response_model=UserResponse)
def obtener_usuario(
    user_id: int,
    db: Session = Depends(get_db)
):
    usuario = db.query(User).filter(
        User.user_id == user_id
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    return usuario


# ==========================================
# ACTUALIZAR USUARIO
# ==========================================

@router.put("/{user_id}", response_model=UserResponse)
def actualizar_usuario(
    user_id: int,
    data: UserCreate,
    db: Session = Depends(get_db)
):
    usuario = db.query(User).filter(
        User.user_id == user_id
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    usuario.username = data.username
    usuario.email = data.email
    usuario.password = data.password
    usuario.phone_number = data.phone_number
    usuario.status = data.status

    db.commit()
    db.refresh(usuario)

    return usuario


# ==========================================
# ELIMINAR USUARIO
# ==========================================

@router.delete("/{user_id}")
def eliminar_usuario(
    user_id: int,
    db: Session = Depends(get_db)
):
    usuario = db.query(User).filter(
        User.user_id == user_id
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    db.delete(usuario)
    db.commit()

    return {
        "mensaje": "Usuario eliminado correctamente"
    }