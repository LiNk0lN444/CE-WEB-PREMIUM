from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from config.database import get_db
from model.security import SECRET_KEY, ALGORITHM

# Esto le dice a FastAPI dónde está el endpoint de login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Aquí hacemos una consulta rápida para obtener el usuario (asumiendo que tienes un modelo User)
    from sqlalchemy import text
    user = db.execute(text("SELECT * FROM Users WHERE user_id = :uid"), {"uid": user_id}).fetchone()
    if user is None:
        raise credentials_exception
    return user

def require_admin(current_user = Depends(get_current_user)):
    # Asumiendo que el usuario tiene un campo 'role'
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos de administrador"
        )
    return current_user