from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config.database import get_db
from ..models import Audit
from schema.schemas import AuditCreate, AuditResponse


router = APIRouter(
    prefix="/audit",
    tags=["Audit"]
)


@router.post("/", response_model=AuditResponse)
def crear_auditoria(
    data: AuditCreate,
    db: Session = Depends(get_db)
):
    nueva = Audit(
        user_id=data.user_id,
        table_name=data.table_name,
        record_id=data.record_id,
        action=data.action,
        description=data.description
    )

    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    return nueva


@router.get("/", response_model=list[AuditResponse])
def listar_auditoria(
    db: Session = Depends(get_db)
):
    return db.query(Audit).all()


@router.get("/{audit_id}", response_model=AuditResponse)
def obtener_auditoria(
    audit_id: int,
    db: Session = Depends(get_db)
):
    auditoria = db.query(Audit).filter(
        Audit.audit_id == audit_id
    ).first()

    if not auditoria:
        raise HTTPException(
            status_code=404,
            detail="Registro de auditoría no encontrado"
        )

    return auditoria


@router.put("/{audit_id}", response_model=AuditResponse)
def actualizar_auditoria(
    audit_id: int,
    data: AuditCreate,
    db: Session = Depends(get_db)
):
    auditoria = db.query(Audit).filter(
        Audit.audit_id == audit_id
    ).first()

    if not auditoria:
        raise HTTPException(
            status_code=404,
            detail="Registro de auditoría no encontrado"
        )

    auditoria.user_id = data.user_id
    auditoria.table_name = data.table_name
    auditoria.record_id = data.record_id
    auditoria.action = data.action
    auditoria.description = data.description

    db.commit()
    db.refresh(auditoria)

    return auditoria


@router.delete("/{audit_id}")
def eliminar_auditoria(
    audit_id: int,
    db: Session = Depends(get_db)
):
    auditoria = db.query(Audit).filter(
        Audit.audit_id == audit_id
    ).first()

    if not auditoria:
        raise HTTPException(
            status_code=404,
            detail="Registro de auditoría no encontrado"
        )

    db.delete(auditoria)
    db.commit()

    return {
        "mensaje": "Registro de auditoría eliminado correctamente"
    }