from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from ..models import Cotizacion
from schema.schemas import CotizacionCreate, CotizacionResponse


router = APIRouter(
    prefix="/cotizaciones",
    tags=["Cotizaciones"]
)


@router.post("/", response_model=CotizacionResponse)
def crear_cotizacion(
    data: CotizacionCreate,
    db: Session = Depends(get_db)
):
    nueva = Cotizacion(
        user_id=data.user_id,
        iva=data.iva,
        total_price=data.total_price,
        status=data.status,
        observations=data.observations
    )

    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    return nueva


@router.get("/", response_model=list[CotizacionResponse])
def listar_cotizaciones(
    db: Session = Depends(get_db)
):
    return db.query(Cotizacion).all()


@router.get("/{cotizacion_id}", response_model=CotizacionResponse)
def obtener_cotizacion(
    cotizacion_id: int,
    db: Session = Depends(get_db)
):
    cotizacion = db.query(Cotizacion).filter(
        Cotizacion.cotizacion_id == cotizacion_id
    ).first()

    if not cotizacion:
        raise HTTPException(
            status_code=404,
            detail="Cotización no encontrada"
        )

    return cotizacion


@router.put("/{cotizacion_id}", response_model=CotizacionResponse)
def actualizar_cotizacion(
    cotizacion_id: int,
    data: CotizacionCreate,
    db: Session = Depends(get_db)
):
    cotizacion = db.query(Cotizacion).filter(
        Cotizacion.cotizacion_id == cotizacion_id
    ).first()

    if not cotizacion:
        raise HTTPException(
            status_code=404,
            detail="Cotización no encontrada"
        )

    cotizacion.user_id = data.user_id
    cotizacion.iva = data.iva
    cotizacion.total_price = data.total_price
    cotizacion.status = data.status
    cotizacion.observations = data.observations

    db.commit()
    db.refresh(cotizacion)

    return cotizacion


@router.delete("/{cotizacion_id}")
def eliminar_cotizacion(
    cotizacion_id: int,
    db: Session = Depends(get_db)
):
    cotizacion = db.query(Cotizacion).filter(
        Cotizacion.cotizacion_id == cotizacion_id
    ).first()

    if not cotizacion:
        raise HTTPException(
            status_code=404,
            detail="Cotización no encontrada"
        )

    db.delete(cotizacion)
    db.commit()

    return {
        "mensaje": "Cotización eliminada correctamente"
    }