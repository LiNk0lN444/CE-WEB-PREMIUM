from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()  # Carga las variables de entorno desde el archivo .env
import sys
import os

# Fuerza a Python a buscar 'config' y 'model' en la carpeta donde está este main.py
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Importaciones locales (ahora sí las encontrará sin problemas)
from config.database import Base, engine
from model.routers import all_routers

# Intenta verificar la base de datos de forma segura
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Nota: Verificación de tablas omitida o ya existentes: {e}")

app = FastAPI(
    title="CE Web API",
    description="API para gestión de cotizaciones, maquinaria y herramientas",
    version="1.0.0",
)

# CORS: permite que tu frontend consuma la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registra todos los routers (roles, usuarios, clientes, maquinaria, etc.)
for router in all_routers:
    app.include_router(router)


@app.get("/")
def root():
    return {"mensaje": "API CE Web funcionando correctamente"}