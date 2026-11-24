# model/security.py
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

# ── Configuración JWT ──────────────────────────────────────────
# Define JWT_SECRET en el .env (ej: python -c "import secrets; print(secrets.token_urlsafe(48))").
# Si no existe se genera uno aleatorio al arrancar: funciona, pero las sesiones
# se invalidan cada vez que se reinicia la API.
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    JWT_SECRET = secrets.token_urlsafe(48)
    print("⚠️  JWT_SECRET no está definido en el .env: se usa una clave temporal "
          "(las sesiones se cerrarán al reiniciar la API).")

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "8"))

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


# ── Tokens de sesión ───────────────────────────────────────────
def create_access_token(user_id: int, role: str) -> str:
    """Genera el token que el frontend enviará en el header Authorization."""
    ahora = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": ahora,
        "exp": ahora + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Devuelve el payload si el token es válido y no ha expirado; si no, None."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None
