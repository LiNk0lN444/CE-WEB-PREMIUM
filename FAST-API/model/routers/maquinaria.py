from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from ..models import Maquinaria
from schema.schemas import MaquinariaCreate, MaquinariaResponse

router = APIRouter(prefix="/maquinaria", tags=["Maquinaria"])


@router.post("/", response_model=MaquinariaResponse)
def crear_maquinaria(data: MaquinariaCreate, db: Session = Depends(get_db)):
    nuevo = Maquinaria(**data.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=list[MaquinariaResponse])
def listar_maquinaria(db: Session = Depends(get_db)):
    return db.query(Maquinaria).all()


@router.get("/{id}", response_model=MaquinariaResponse)
def obtener_maquinaria(id: int, db: Session = Depends(get_db)):
    item = db.query(Maquinaria).filter(Maquinaria.id_maquinaria == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Maquinaria no encontrado")
    return item


@router.put("/{id}", response_model=MaquinariaResponse)
def actualizar_maquinaria(id: int, data: MaquinariaCreate, db: Session = Depends(get_db)):
    item = db.query(Maquinaria).filter(Maquinaria.id_maquinaria == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Maquinaria no encontrado")
    for campo, valor in data.dict().items():
        setattr(item, campo, valor)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{id}")
def eliminar_maquinaria(id: int, db: Session = Depends(get_db)):
    item = db.query(Maquinaria).filter(Maquinaria.id_maquinaria == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Maquinaria no encontrado")
    db.delete(item)
    db.commit()
    return {"mensaje": "Maquinaria eliminado correctamente"}