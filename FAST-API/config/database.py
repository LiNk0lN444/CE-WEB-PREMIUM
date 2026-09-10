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

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()