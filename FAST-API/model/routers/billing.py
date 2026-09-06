from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from ..models import Billing
from schema.schemas import BillingCreate, BillingResponse


router = APIRouter(
    prefix="/billing",
    tags=["Billing"]
)


@router.post("/", response_model=BillingResponse)
def crear_facturacion(
    data: BillingCreate,
    db: Session = Depends(get_db)
):
    nueva = Billing(
        cotizacion_id=data.cotizacion_id,
        total_amount=data.total_amount
    )

    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    return nueva


@router.get("/", response_model=list[BillingResponse])
def listar_facturacion(
    db: Session = Depends(get_db)
):
    return db.query(Billing).all()


@router.get("/{billing_id}", response_model=BillingResponse)
def obtener_facturacion(
    billing_id: int,
    db: Session = Depends(get_db)
):
    factura = db.query(Billing).filter(
        Billing.billing_id == billing_id
    ).first()

    if not factura:
        raise HTTPException(
            status_code=404,
            detail="Registro de facturación no encontrado"
        )

    return factura


@router.put("/{billing_id}", response_model=BillingResponse)
def actualizar_facturacion(
    billing_id: int,
    data: BillingCreate,
    db: Session = Depends(get_db)
):
    factura = db.query(Billing).filter(
        Billing.billing_id == billing_id
    ).first()

    if not factura:
        raise HTTPException(
            status_code=404,
            detail="Registro de facturación no encontrado"
        )

    factura.cotizacion_id = data.cotizacion_id
    factura.total_amount = data.total_amount

    db.commit()
    db.refresh(factura)

    return factura


@router.delete("/{billing_id}")
def eliminar_facturacion(
    billing_id: int,
    db: Session = Depends(get_db)
):
    factura = db.query(Billing).filter(
        Billing.billing_id == billing_id
    ).first()

    if not factura:
        raise HTTPException(
            status_code=404,
            detail="Registro de facturación no encontrado"
        )

    db.delete(factura)
    db.commit()

    return {
        "mensaje": "Registro de facturación eliminado correctamente"
    }