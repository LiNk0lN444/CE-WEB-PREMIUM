from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from ..models import Cotizacion
from schema.schemas import CotizacionCreate, CotizacionResponse

router = APIRouter(prefix="/cotizaciones", tags=["Cotizaciones"])


@router.post("/", response_model=CotizacionResponse)
def crear_cotizacion(data: CotizacionCreate, db: Session = Depends(get_db)):
    nuevo = Cotizacion(**data.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=list[CotizacionResponse])
def listar_cotizaciones(db: Session = Depends(get_db)):
    return db.query(Cotizacion).all()


@router.get("/{id}", response_model=CotizacionResponse)
def obtener_cotizacion(id: int, db: Session = Depends(get_db)):
    item = db.query(Cotizacion).filter(Cotizacion.id_cotizacion == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cotizacion no encontrado")
    return item


@router.put("/{id}", response_model=CotizacionResponse)
def actualizar_cotizacion(id: int, data: CotizacionCreate, db: Session = Depends(get_db)):
    item = db.query(Cotizacion).filter(Cotizacion.id_cotizacion == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cotizacion no encontrado")
    for campo, valor in data.dict().items():
        setattr(item, campo, valor)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{id}")
def eliminar_cotizacion(id: int, db: Session = Depends(get_db)):
    item = db.query(Cotizacion).filter(Cotizacion.id_cotizacion == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cotizacion no encontrado")
    db.delete(item)
    db.commit()
    return {"mensaje": "Cotizacion eliminado correctamente"}