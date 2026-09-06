from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from ..models import InventoryMovement
from schema.schemas import InventoryMovementCreate, InventoryMovementResponse


router = APIRouter(
    prefix="/inventory-movements",
    tags=["Inventory Movements"]
)


@router.post("/", response_model=InventoryMovementResponse)
def crear_movimiento(
    data: InventoryMovementCreate,
    db: Session = Depends(get_db)
):
    nuevo = InventoryMovement(
        product_id=data.product_id,
        quantity=data.quantity,
        movement_type=data.movement_type,
        price=data.price
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return nuevo


@router.get("/", response_model=list[InventoryMovementResponse])
def listar_movimientos(
    db: Session = Depends(get_db)
):
    return db.query(InventoryMovement).all()


@router.get("/{movement_id}", response_model=InventoryMovementResponse)
def obtener_movimiento(
    movement_id: int,
    db: Session = Depends(get_db)
):
    movimiento = db.query(InventoryMovement).filter(
        InventoryMovement.movement_id == movement_id
    ).first()

    if not movimiento:
        raise HTTPException(
            status_code=404,
            detail="Movimiento no encontrado"
        )

    return movimiento


@router.put("/{movement_id}", response_model=InventoryMovementResponse)
def actualizar_movimiento(
    movement_id: int,
    data: InventoryMovementCreate,
    db: Session = Depends(get_db)
):
    movimiento = db.query(InventoryMovement).filter(
        InventoryMovement.movement_id == movement_id
    ).first()

    if not movimiento:
        raise HTTPException(
            status_code=404,
            detail="Movimiento no encontrado"
        )

    movimiento.product_id = data.product_id
    movimiento.quantity = data.quantity
    movimiento.movement_type = data.movement_type
    movimiento.price = data.price

    db.commit()
    db.refresh(movimiento)

    return movimiento


@router.delete("/{movement_id}")
def eliminar_movimiento(
    movement_id: int,
    db: Session = Depends(get_db)
):
    movimiento = db.query(InventoryMovement).filter(
        InventoryMovement.movement_id == movement_id
    ).first()

    if not movimiento:
        raise HTTPException(
            status_code=404,
            detail="Movimiento no encontrado"
        )

    db.delete(movimiento)
    db.commit()

    return {
        "mensaje": "Movimiento eliminado correctamente"
    }