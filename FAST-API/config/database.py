import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Carga variables desde un archivo .env (si existe) en la raíz de FAST-API
load_dotenv()

# Puedes sobreescribir esta URL definiendo la variable de entorno DATABASE_URL
# en un archivo .env (ver .env.example), por ejemplo:
# DATABASE_URL=postgresql+psycopg2://usuario:password@host:puerto/nombre_bd
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg2://postgres:1508@localhost:5432/ce_web"
)

if not DATABASE_URL:
    raise ValueError(
        "❌ Falta la variable DATABASE_URL. "
        "Crea un archivo .env en la raíz de FAST-API basándote en .env.example"
    )

# Aseguramos que la URL use el driver psycopg2
db_url = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://")
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)

# 🔥 CONFIGURACIÓN DEL MOTOR (Engine) PARA PRODUCCIÓN EN RAILWAY
engine = create_engine(
    db_url,
    pool_pre_ping=True,      # Verifica que la conexión esté viva antes de usarla
    pool_recycle=300,        # Recicla las conexiones cada 5 minutos (evita cortes de la nube)
    pool_timeout=10,         # Si no hay conexión en 10s, lanza error (evita esperas de 2 mins)
    pool_size=5,             # Mantiene 5 conexiones abiertas
    max_overflow=10          # Permite hasta 10 conexiones extra en horas pico
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()