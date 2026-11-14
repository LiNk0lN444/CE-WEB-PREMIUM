from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from config.database import get_db
from schema import schemas
from model import models
from model.security import verify_password

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=schemas.LoginResponse)
def login(credenciales: schemas.LoginRequest, db: Session = Depends(get_db)):
    print("\n=== INTENTO DE LOGIN ===")
    print(f"Contraseña recibida: {credenciales.password}")
    
    # Buscar usuario por email
    user = db.query(models.User).filter(models.User.email == credenciales.email).first()

    # ⚠️ Mismo mensaje para email y contraseña incorrectos (evita enumeración)
    if not user:
        print("❌ Usuario no encontrado en la BD")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos."
        )

    # 👇 ESTAS SON LAS LÍNEAS QUE FALTABAN
    print(f"Hash en BD: {user.password}")
    es_valido = verify_password(credenciales.password, user.password)
    print(f"¿Es la contraseña válida?: {es_valido}")
    # 👆

    # Verificar contraseña
    if not es_valido:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos."
        )

    # Verificar que esté activo
    if user.status != "active":
        print(f"❌ Usuario inactivo. Status actual: {user.status}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta está inactiva. Contacta al administrador."
        )

    print("✅ Login exitoso")
    return user