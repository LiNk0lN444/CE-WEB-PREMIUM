# model/security.py
from passlib.context import CryptContext

# Configuración del hasher
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Convierte una contraseña en texto plano a un hash seguro."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si una contraseña coincide con su hash."""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False