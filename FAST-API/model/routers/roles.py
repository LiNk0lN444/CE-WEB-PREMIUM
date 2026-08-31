from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from ..models import Role
from schema.schemas import RoleCreate, RoleResponse

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.post("/", response_model=RoleResponse)
def crear_rol(data: RoleCreate, db: Session = Depends(get_db)):
    nuevo = Role(**data.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=list[RoleResponse])
def listar_roles(db: Session = Depends(get_db)):
    return db.query(Role).all()


@router.get("/{id}", response_model=RoleResponse)
def obtener_rol(id: int, db: Session = Depends(get_db)):
    item = db.query(Role).filter(Role.id_rol == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Role no encontrado")
    return item


@router.put("/{id}", response_model=RoleResponse)
def actualizar_rol(id: int, data: RoleCreate, db: Session = Depends(get_db)):
    item = db.query(Role).filter(Role.id_rol == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Role no encontrado")
    for campo, valor in data.dict().items():
        setattr(item, campo, valor)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{id}")
def eliminar_rol(id: int, db: Session = Depends(get_db)):
    item = db.query(Role).filter(Role.id_rol == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Role no encontrado")
    db.delete(item)
    db.commit()
    return {"mensaje": "Role eliminado correctamente"}