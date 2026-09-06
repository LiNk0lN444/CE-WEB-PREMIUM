from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from ..models import DetalleCotizacion
from schema.schemas import DetalleCotizacionCreate, DetalleCotizacionResponse


router = APIRouter(
    prefix="/detalle-cotizaciones",
    tags=["Detalle Cotizaciones"]
)


@router.post("/", response_model=DetalleCotizacionResponse)
def crear_detalle(
    data: DetalleCotizacionCreate,
    db: Session = Depends(get_db)
):
    nuevo = DetalleCotizacion(
        cotizacion_id=data.cotizacion_id,
        product_id=data.product_id,
        quantity=data.quantity,
        price=data.price
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return nuevo


@router.get("/", response_model=list[DetalleCotizacionResponse])
def listar_detalles(
    db: Session = Depends(get_db)
):
    return db.query(DetalleCotizacion).all()


@router.get("/{detalle_id}", response_model=DetalleCotizacionResponse)
def obtener_detalle(
    detalle_id: int,
    db: Session = Depends(get_db)
):
    detalle = db.query(DetalleCotizacion).filter(
        DetalleCotizacion.detalle_id == detalle_id
    ).first()

    if not detalle:
        raise HTTPException(
            status_code=404,
            detail="Detalle de cotización no encontrado"
        )

    return detalle


@router.put("/{detalle_id}", response_model=DetalleCotizacionResponse)
def actualizar_detalle(
    detalle_id: int,
    data: DetalleCotizacionCreate,
    db: Session = Depends(get_db)
):
    detalle = db.query(DetalleCotizacion).filter(
        DetalleCotizacion.detalle_id == detalle_id
    ).first()

    if not detalle:
        raise HTTPException(
            status_code=404,
            detail="Detalle de cotización no encontrado"
        )

    detalle.cotizacion_id = data.cotizacion_id
    detalle.product_id = data.product_id
    detalle.quantity = data.quantity
    detalle.price = data.price

    db.commit()
    db.refresh(detalle)

    return detalle


@router.delete("/{detalle_id}")
def eliminar_detalle(
    detalle_id: int,
    db: Session = Depends(get_db)
):
    detalle = db.query(DetalleCotizacion).filter(
        DetalleCotizacion.detalle_id == detalle_id
    ).first()

    if not detalle:
        raise HTTPException(
            status_code=404,
            detail="Detalle de cotización no encontrado"
        )

    db.delete(detalle)
    db.commit()

    return {
        "mensaje": "Detalle de cotización eliminado correctamente"
    }