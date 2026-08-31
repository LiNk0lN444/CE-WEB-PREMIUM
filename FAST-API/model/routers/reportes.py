from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from ..models import Reporte
from schema.schemas import ReporteCreate, ReporteResponse

router = APIRouter(prefix="/reportes", tags=["Reportes"])


@router.post("/", response_model=ReporteResponse)
def crear_reporte(data: ReporteCreate, db: Session = Depends(get_db)):
    nuevo = Reporte(**data.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/", response_model=list[ReporteResponse])
def listar_reportes(db: Session = Depends(get_db)):
    return db.query(Reporte).all()


@router.get("/{id}", response_model=ReporteResponse)
def obtener_reporte(id: int, db: Session = Depends(get_db)):
    item = db.query(Reporte).filter(Reporte.id_reporte == id).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Reporte no encontrado"
        )

    return item


@router.put("/{id}", response_model=ReporteResponse)
def actualizar_reporte(
    id: int,
    data: ReporteCreate,
    db: Session = Depends(get_db)
):
    item = db.query(Reporte).filter(Reporte.id_reporte == id).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Reporte no encontrado"
        )

    for campo, valor in data.dict().items():
        setattr(item, campo, valor)

    db.commit()
    db.refresh(item)

    return item


@router.delete("/{id}")
def eliminar_reporte(id: int, db: Session = Depends(get_db)):
    item = db.query(Reporte).filter(Reporte.id_reporte == id).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Reporte no encontrado"
        )

    db.delete(item)
    db.commit()

    return {"mensaje": "Reporte eliminado correctamente"}