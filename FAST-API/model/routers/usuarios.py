from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from ..models import User
from schema.schemas import UserCreate, UserResponse


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# ==========================================
# CREAR USUARIO
# ==========================================

@router.post("/", response_model=UserResponse)
def crear_usuario(
    data: UserCreate,
    db: Session = Depends(get_db)
):
    # Verificar si el correo ya existe
    usuario_existente = db.query(User).filter(
        User.email == data.email
    ).first()

    if usuario_existente:
        raise HTTPException(
            status_code=400,
            detail="El correo electrónico ya está registrado"
        )

    nuevo = User(
        username=data.username,
        email=data.email,
        password=data.password,
        phone_number=data.phone_number,
        status=data.status
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return nuevo


# ==========================================
# LISTAR USUARIOS
# ==========================================

@router.get("/", response_model=list[UserResponse])
def listar_usuarios(
    db: Session = Depends(get_db)
):
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