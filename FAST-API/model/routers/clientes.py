from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from ..models import Cliente
from schema.schemas import ClienteCreate, ClienteResponse

router = APIRouter(prefix="/clientes", tags=["Clientes"])


@router.post("/", response_model=ClienteResponse)
def crear_cliente(data: ClienteCreate, db: Session = Depends(get_db)):
    nuevo = Cliente(**data.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=list[ClienteResponse])
def listar_clientes(db: Session = Depends(get_db)):
    return db.query(Cliente).all()


@router.get("/{id}", response_model=ClienteResponse)
def obtener_cliente(id: int, db: Session = Depends(get_db)):
    item = db.query(Cliente).filter(Cliente.id_cliente == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return item


@router.put("/{id}", response_model=ClienteResponse)
def actualizar_cliente(id: int, data: ClienteCreate, db: Session = Depends(get_db)):
    item = db.query(Cliente).filter(Cliente.id_cliente == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    for campo, valor in data.dict().items():
        setattr(item, campo, valor)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{id}")
def eliminar_cliente(id: int, db: Session = Depends(get_db)):
    item = db.query(Cliente).filter(Cliente.id_cliente == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    db.delete(item)
    db.commit()
    return {"mensaje": "Cliente eliminado correctamente"}