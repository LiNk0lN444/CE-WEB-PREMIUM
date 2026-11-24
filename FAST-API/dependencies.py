# model/dependencies.py
"""Dependencias de seguridad reutilizables en los routers."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from config.database import get_db
from model.models import User
from model.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


def _no_autorizado(detalle: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detalle,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Usuario autenticado. El rol y el estado se leen SIEMPRE de la BD
    (no del token), así un cambio de rol o una desactivación aplica al instante."""
    if credentials is None:
        raise _no_autorizado("Debes iniciar sesión.")

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise _no_autorizado("Sesión inválida o expirada. Inicia sesión de nuevo.")

    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise _no_autorizado("Sesión inválida.")

    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None or user.status != "active":
        raise _no_autorizado("Usuario no disponible. Inicia sesión de nuevo.")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    """Solo deja pasar a usuarios con rol 'admin'."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso restringido a administradores.",
        )
    return user
