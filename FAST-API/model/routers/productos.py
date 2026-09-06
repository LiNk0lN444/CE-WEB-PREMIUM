from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from ..models import Product
from schema.schemas import ProductCreate, ProductResponse


router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


# ==========================================
# CREAR PRODUCTO
# ==========================================

@router.post("/", response_model=ProductResponse)
def crear_producto(
    data: ProductCreate,
    db: Session = Depends(get_db)
):
    nuevo = Product(
        name=data.name,
        description=data.description,
        stock_quantity=data.stock_quantity,
        type=data.type,
        status=data.status,
        image_url=data.image_url,
        model_number=data.model_number
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return nuevo


# ==========================================
# LISTAR PRODUCTOS
# ==========================================

@router.get("/", response_model=list[ProductResponse])
def listar_productos(
    db: Session = Depends(get_db)
):
    return db.query(Product).all()


# ==========================================
# OBTENER PRODUCTO POR ID
# ==========================================

@router.get("/{product_id}", response_model=ProductResponse)
def obtener_producto(
    product_id: int,
    db: Session = Depends(get_db)
):
    producto = db.query(Product).filter(
        Product.product_id == product_id
    ).first()

    if not producto:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    return producto


# ==========================================
# ACTUALIZAR PRODUCTO
# ==========================================

@router.put("/{product_id}", response_model=ProductResponse)
def actualizar_producto(
    product_id: int,
    data: ProductCreate,
    db: Session = Depends(get_db)
):
    producto = db.query(Product).filter(
        Product.product_id == product_id
    ).first()

    if not producto:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    producto.name = data.name
    producto.description = data.description
    producto.stock_quantity = data.stock_quantity
    producto.type = data.type
    producto.status = data.status
    producto.image_url = data.image_url
    producto.model_number = data.model_number

    db.commit()
    db.refresh(producto)

    return producto


# ==========================================
# ELIMINAR PRODUCTO
# ==========================================

@router.delete("/{product_id}")
def eliminar_producto(
    product_id: int,
    db: Session = Depends(get_db)
):
    producto = db.query(Product).filter(
        Product.product_id == product_id
    ).first()

    if not producto:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    db.delete(producto)
    db.commit()

    return {
        "mensaje": "Producto eliminado correctamente"
    }