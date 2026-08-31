from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
 
from config.database import get_db
from ..models import Notificacion, Cliente, Cotizacion
from schema.schemas import NotificacionCreate, NotificacionResponse
from ..utils.email_utils import enviar_correo, cuerpo_confirmacion_cotizacion
 
router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])
 
 
def _tarea_enviar_y_actualizar(id_notificacion: int, correo: str, asunto: str, cuerpo: str, db: Session):
    enviado = enviar_correo(correo, asunto, cuerpo)
    notificacion = db.query(Notificacion).filter(
        Notificacion.id_notificacion == id_notificacion
    ).first()
    if notificacion:
        notificacion.estado_envio = "enviado" if enviado else "fallido"
        db.commit()
 
 
@router.post("/", response_model=NotificacionResponse)
def crear_notificacion(
    data: NotificacionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    cliente = db.query(Cliente).filter(Cliente.id_cliente == data.id_cliente).first()
    cotizacion = db.query(Cotizacion).filter(
        Cotizacion.id_cotizacion == data.id_cotizacion
    ).first()
    if not cliente or not cotizacion:
        raise HTTPException(status_code=404, detail="Cliente o cotización no encontrados")
 
    nueva = Notificacion(**data.dict(), estado_envio="pendiente")
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
 
    asunto = f"Confirmación de tu cotización {cotizacion.numero_cotizacion}"
    cuerpo = cuerpo_confirmacion_cotizacion(
        nombre_cliente=cliente.nombre,
        numero_cotizacion=cotizacion.numero_cotizacion,
        total=str(cotizacion.total),
    )
 
    # Se envía en segundo plano para no demorar la respuesta al cliente
    background_tasks.add_task(
        _tarea_enviar_y_actualizar, nueva.id_notificacion, data.correo, asunto, cuerpo, db
    )
 
    return nueva
 
 
@router.get("/", response_model=list[NotificacionResponse])
def listar_notificaciones(db: Session = Depends(get_db)):
    return db.query(Notificacion).all()
 
 
@router.get("/{id}", response_model=NotificacionResponse)
def obtener_notificacion(id: int, db: Session = Depends(get_db)):
    item = db.query(Notificacion).filter(Notificacion.id_notificacion == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    return item
 
 
@router.delete("/{id}")
def eliminar_notificacion(id: int, db: Session = Depends(get_db)):
    item = db.query(Notificacion).filter(Notificacion.id_notificacion == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    db.delete(item)
    db.commit()
    return {"message": "Notificación eliminada"}