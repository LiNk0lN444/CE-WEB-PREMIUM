from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import sys
import os

load_dotenv()

# Fuerza a Python a buscar 'config' y 'model'
# en la carpeta donde está este main.py
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Importaciones locales
from config.database import Base, engine
from model.routers import all_routers


# Verifica que las tablas definidas en los modelos existan
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Nota: Verificación de tablas omitida o ya existentes: {e}")


app = FastAPI(
    title="CE Web API",
    description="API para gestión de usuarios, productos, inventario, cotizaciones y facturación",
    version="1.0.0",
)


# CORS: permite que el frontend consuma la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Registra todos los routers de la aplicación
for router in all_routers:
    app.include_router(router)


@app.get("/")
def root():
    return {
        "mensaje": "API CE Web funcionando correctamente"
    }