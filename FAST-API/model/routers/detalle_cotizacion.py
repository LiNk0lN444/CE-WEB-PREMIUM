from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from ..models import DetalleCotizacion
from schema.schemas import DetalleCotizacionCreate, DetalleCotizacionResponse

router = APIRouter(prefix="/detalle-cotizacion", tags=["DetalleCotizacion"])


@router.post("/", response_model=DetalleCotizacionResponse)
def crear_detalle(data: DetalleCotizacionCreate, db: Session = Depends(get_db)):
    nuevo = DetalleCotizacion(**data.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=list[DetalleCotizacionResponse])
def listar_detalles(db: Session = Depends(get_db)):
    return db.query(DetalleCotizacion).all()


@router.get("/{id}", response_model=DetalleCotizacionResponse)
def obtener_detalle(id: int, db: Session = Depends(get_db)):
    item = db.query(DetalleCotizacion).filter(DetalleCotizacion.id_detalle == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="DetalleCotizacion no encontrado")
    return item


@router.put("/{id}", response_model=DetalleCotizacionResponse)
def actualizar_detalle(id: int, data: DetalleCotizacionCreate, db: Session = Depends(get_db)):
    item = db.query(DetalleCotizacion).filter(DetalleCotizacion.id_detalle == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="DetalleCotizacion no encontrado")
    for campo, valor in data.dict().items():
        setattr(item, campo, valor)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{id}")
def eliminar_detalle(id: int, db: Session = Depends(get_db)):
    item = db.query(DetalleCotizacion).filter(DetalleCotizacion.id_detalle == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="DetalleCotizacion no encontrado")
    db.delete(item)
    db.commit()
    return {"mensaje": "DetalleCotizacion eliminado correctamente"}