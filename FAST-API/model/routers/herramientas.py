from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from ..models import Herramienta
from schema.schemas import HerramientaCreate, HerramientaResponse

router = APIRouter(prefix="/herramientas", tags=["Herramientas"])


@router.post("/", response_model=HerramientaResponse)
def crear_herramienta(data: HerramientaCreate, db: Session = Depends(get_db)):
    nuevo = Herramienta(**data.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=list[HerramientaResponse])
def listar_herramientas(db: Session = Depends(get_db)):
    return db.query(Herramienta).all()


@router.get("/{id}", response_model=HerramientaResponse)
def obtener_herramienta(id: int, db: Session = Depends(get_db)):
    item = db.query(Herramienta).filter(Herramienta.id_herramienta == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Herramienta no encontrado")
    return item


@router.put("/{id}", response_model=HerramientaResponse)
def actualizar_herramienta(id: int, data: HerramientaCreate, db: Session = Depends(get_db)):
    item = db.query(Herramienta).filter(Herramienta.id_herramienta == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Herramienta no encontrado")
    for campo, valor in data.dict().items():
        setattr(item, campo, valor)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{id}")
def eliminar_herramienta(id: int, db: Session = Depends(get_db)):
    item = db.query(Herramienta).filter(Herramienta.id_herramienta == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Herramienta no encontrado")
    db.delete(item)
    db.commit()
    return {"mensaje": "Herramienta eliminado correctamente"}