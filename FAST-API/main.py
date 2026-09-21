from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import sys
import os

load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config.database import Base, engine
from model.routers import all_routers
from model.scheduler import iniciar_scheduler, detener_scheduler   # 👈 NUEVO

try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Nota: Verificación de tablas omitida o ya existentes: {e}")


app = FastAPI(
    title="CE Web API",
    description="API para gestión de usuarios, productos, inventario, cotizaciones y facturación",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in all_routers:
    app.include_router(router)


@app.get("/")
def root():
    return {"mensaje": "API CE Web funcionando correctamente"}


# ─────────────────────────────────────────
# Scheduler de tareas diarias
# ─────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    iniciar_scheduler()


@app.on_event("shutdown")
async def shutdown_event():
    detener_scheduler()