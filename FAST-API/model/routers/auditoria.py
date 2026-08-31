from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from ..models import Auditoria
from schema.schemas import AuditoriaCreate, AuditoriaResponse

router = APIRouter(prefix="/auditoria", tags=["Auditoria"])


@router.post("/", response_model=AuditoriaResponse)
def crear_auditoria(data: AuditoriaCreate, db: Session = Depends(get_db)):
    nuevo = Auditoria(**data.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=list[AuditoriaResponse])
def listar_auditorias(db: Session = Depends(get_db)):
    return db.query(Auditoria).all()


@router.get("/{id}", response_model=AuditoriaResponse)
def obtener_auditoria(id: int, db: Session = Depends(get_db)):
    item = db.query(Auditoria).filter(Auditoria.id_auditoria == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Auditoria no encontrado")
    return item


@router.put("/{id}", response_model=AuditoriaResponse)
def actualizar_auditoria(id: int, data: AuditoriaCreate, db: Session = Depends(get_db)):
    item = db.query(Auditoria).filter(Auditoria.id_auditoria == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Auditoria no encontrado")
    for campo, valor in data.dict().items():
        setattr(item, campo, valor)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{id}")
def eliminar_auditoria(id: int, db: Session = Depends(get_db)):
    item = db.query(Auditoria).filter(Auditoria.id_auditoria == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Auditoria no encontrado")
    db.delete(item)
    db.commit()
    return {"mensaje": "Auditoria eliminado correctamente"}