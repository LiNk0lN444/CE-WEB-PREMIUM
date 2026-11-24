from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from schema.schemas import UserCreate, UserResponse
from model.models import User
from model.security import hash_password

router = APIRouter(prefix="/users", tags=["Users"])

# ✅ Registro público — SIEMPRE crea un client.
# La gestión de usuarios (listar, editar, eliminar) vive en
# /admin/users y solo puede usarla un administrador.
@router.post("/", response_model=UserResponse)
def crear_usuario(user: UserCreate, db: Session = Depends(get_db)):
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
