from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from ..models import Categoria
from schema.schemas import CategoriaCreate, CategoriaResponse

router = APIRouter(prefix="/categorias", tags=["Categorias"])


@router.post("/", response_model=CategoriaResponse)
def crear_categoria(data: CategoriaCreate, db: Session = Depends(get_db)):
    nuevo = Categoria(**data.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=list[CategoriaResponse])
def listar_categorias(db: Session = Depends(get_db)):
    return db.query(Categoria).all()


@router.get("/{id}", response_model=CategoriaResponse)
def obtener_categoria(id: int, db: Session = Depends(get_db)):
    item = db.query(Categoria).filter(Categoria.id_categoria == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Categoria no encontrado")
    return item


@router.put("/{id}", response_model=CategoriaResponse)
def actualizar_categoria(id: int, data: CategoriaCreate, db: Session = Depends(get_db)):
    item = db.query(Categoria).filter(Categoria.id_categoria == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Categoria no encontrado")
    for campo, valor in data.dict().items():
        setattr(item, campo, valor)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{id}")
def eliminar_categoria(id: int, db: Session = Depends(get_db)):
    item = db.query(Categoria).filter(Categoria.id_categoria == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Categoria no encontrado")
    db.delete(item)
    db.commit()
    return {"mensaje": "Categoria eliminado correctamente"}