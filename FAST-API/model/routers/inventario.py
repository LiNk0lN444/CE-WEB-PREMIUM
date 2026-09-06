from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from ..models import Inventory
from schema.schemas import InventoryCreate, InventoryResponse


router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"]
)


@router.post("/", response_model=InventoryResponse)
def crear_inventario(
    data: InventoryCreate,
    db: Session = Depends(get_db)
):
    nuevo = Inventory(
        product_id=data.product_id,
        quantity=data.quantity,
        initial_price=data.initial_price
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return nuevo


@router.get("/", response_model=list[InventoryResponse])
def listar_inventario(
    db: Session = Depends(get_db)
):
    return db.query(Inventory).all()


@router.get("/{inventory_id}", response_model=InventoryResponse)
def obtener_inventario(
    inventory_id: int,
    db: Session = Depends(get_db)
):
    item = db.query(Inventory).filter(
        Inventory.inventory_id == inventory_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Registro de inventario no encontrado"
        )

    return item


@router.put("/{inventory_id}", response_model=InventoryResponse)
def actualizar_inventario(
    inventory_id: int,
    data: InventoryCreate,
    db: Session = Depends(get_db)
):
    item = db.query(Inventory).filter(
        Inventory.inventory_id == inventory_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Registro de inventario no encontrado"
        )

    item.product_id = data.product_id
    item.quantity = data.quantity
    item.initial_price = data.initial_price

    db.commit()
    db.refresh(item)

    return item


@router.delete("/{inventory_id}")
def eliminar_inventario(
    inventory_id: int,
    db: Session = Depends(get_db)
):
    item = db.query(Inventory).filter(
        Inventory.inventory_id == inventory_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Registro de inventario no encontrado"
        )

    db.delete(item)
    db.commit()

    return {
        "mensaje": "Registro de inventario eliminado correctamente"
    }