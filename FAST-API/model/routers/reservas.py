import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from config.database import get_db
from schema import schemas

router = APIRouter(prefix="/reservas", tags=["Reservas"])


# ============================================================
# CREAR RESERVA (cliente) — por MESES
# ============================================================
@router.post("/", response_model=schemas.ReservaResponse)
def crear_reserva(datos: schemas.ReservaCreate, db: Session = Depends(get_db)):
    if datos.months < 1:
        raise HTTPException(status_code=400, detail="La reserva mínima es de 1 mes")

    if not datos.items:
        raise HTTPException(status_code=400, detail="Debes incluir al menos un producto")

    items_json = [
        {"product_id": i.product_id, "quantity": i.quantity}
        for i in datos.items
    ]

    query = text("""
        SELECT * FROM fn_crear_reserva(
            :user_id, :start_date, :months, :observaciones, CAST(:items AS JSONB)
        )
    """)

    resultado = db.execute(query, {
        "user_id": datos.user_id,
        "start_date": datos.start_date,
        "months": datos.months,
        "observaciones": datos.observations or "",
        "items": json.dumps(items_json),
    }).fetchone()

    db.commit()

    if resultado.cotizacion_id is None:
        raise HTTPException(status_code=400, detail=resultado.mensaje)

    return schemas.ReservaResponse(
        cotizacion_id=resultado.cotizacion_id,
        total=float(resultado.total),
        mensaje=resultado.mensaje,
    )


# ============================================================
# RESERVAS PENDIENTES (admin)
# ============================================================
@router.get("/pendientes", response_model=list[schemas.ReservaDetalle])
def listar_reservas_pendientes(db: Session = Depends(get_db)):
    query = text("""
        SELECT
            c.cotizacion_id,
            c.user_id,
            u.username,
            u.email AS cliente_email,
            c.start_date,
            c.end_date,
            (EXTRACT(YEAR FROM age(c.end_date, c.start_date)) * 12 +
             EXTRACT(MONTH FROM age(c.end_date, c.start_date)))::INT AS months,
            c.total_price,
            c.status,
            c.observations,
            c.approved_by,
            c.approved_at,
            c.rejection_reason,
            c.notificado_vencimiento,
            (c.end_date - CURRENT_DATE)::INT AS dias_restantes
        FROM cotizaciones c
        INNER JOIN Users u ON u.user_id = c.user_id
        WHERE c.status = 'pending'
        ORDER BY c.date_created ASC
    """)
    return [dict(r._mapping) for r in db.execute(query).fetchall()]


# ============================================================
# MIS RESERVAS (cliente)
# ============================================================
@router.get("/mis-reservas/{user_id}", response_model=list[schemas.ReservaDetalle])
def listar_mis_reservas(user_id: int, db: Session = Depends(get_db)):
    query = text("""
        SELECT
            c.cotizacion_id,
            c.user_id,
            u.username,
            u.email AS cliente_email,
            c.start_date,
            c.end_date,
            (EXTRACT(YEAR FROM age(c.end_date, c.start_date)) * 12 +
             EXTRACT(MONTH FROM age(c.end_date, c.start_date)))::INT AS months,
            c.total_price,
            c.status,
            c.observations,
            c.approved_by,
            c.approved_at,
            c.rejection_reason,
            c.notificado_vencimiento,
            (c.end_date - CURRENT_DATE)::INT AS dias_restantes
        FROM cotizaciones c
        INNER JOIN Users u ON u.user_id = c.user_id
        WHERE c.user_id = :user_id
        ORDER BY c.date_created DESC
    """)
    return [dict(r._mapping) for r in db.execute(query, {"user_id": user_id}).fetchall()]


# ============================================================
# RESERVAS POR VENCER (admin — para badge/email)
# ============================================================
@router.get("/por-vencer", response_model=list[schemas.ReservaDetalle])
def listar_por_vencer(db: Session = Depends(get_db)):
    query = text("""
        SELECT
            c.cotizacion_id,
            c.user_id,
            u.username,
            u.email AS cliente_email,
            c.start_date,
            c.end_date,
            (EXTRACT(YEAR FROM age(c.end_date, c.start_date)) * 12 +
             EXTRACT(MONTH FROM age(c.end_date, c.start_date)))::INT AS months,
            c.total_price,
            c.status,
            c.observations,
            c.approved_by,
            c.approved_at,
            c.rejection_reason,
            c.notificado_vencimiento,
            (c.end_date - CURRENT_DATE)::INT AS dias_restantes
        FROM cotizaciones c
        INNER JOIN Users u ON u.user_id = c.user_id
        WHERE c.status IN ('approved', 'active')
          AND c.end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '3 days')
        ORDER BY c.end_date ASC
    """)
    return [dict(r._mapping) for r in db.execute(query).fetchall()]


# ============================================================
# APROBAR RESERVA (admin)
# ============================================================
@router.post("/{cotizacion_id}/aprobar")
def aprobar_reserva(
    cotizacion_id: int,
    datos: schemas.AprobarReserva,
    db: Session = Depends(get_db),
):
    resultado = db.execute(
        text("SELECT fn_aprobar_reserva(:cid, :aid) AS msg"),
        {"cid": cotizacion_id, "aid": datos.admin_id},
    ).fetchone()
    db.commit()

    if "aprobada" not in resultado.msg.lower():
        raise HTTPException(status_code=400, detail=resultado.msg)

    return {"mensaje": resultado.msg}


# ============================================================
# RECHAZAR RESERVA (admin)
# ============================================================
@router.post("/{cotizacion_id}/rechazar")
def rechazar_reserva(
    cotizacion_id: int,
    datos: schemas.RechazarReserva,
    db: Session = Depends(get_db),
):
    resultado = db.execute(
        text("SELECT fn_rechazar_reserva(:cid, :aid, :motivo) AS msg"),
        {
            "cid": cotizacion_id,
            "aid": datos.admin_id,
            "motivo": datos.motivo,
        },
    ).fetchone()
    db.commit()

    if "rechazada" not in resultado.msg.lower():
        raise HTTPException(status_code=400, detail=resultado.msg)

    return {"mensaje": resultado.msg}


# ============================================================
# DISPONIBILIDAD
# ============================================================
@router.get("/disponibilidad/{product_id}", response_model=schemas.DisponibilidadResponse)
def consultar_disponibilidad(
    product_id: int,
    start_date: str,
    end_date: str,
    db: Session = Depends(get_db),
):
    resultado = db.execute(
        text("SELECT fn_stock_disponible(:pid, :start, :end) AS disponibles"),
        {"pid": product_id, "start": start_date, "end": end_date},
    ).fetchone()

    if resultado.disponibles < 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    return schemas.DisponibilidadResponse(
        product_id=product_id,
        start_date=start_date,
        end_date=end_date,
        disponibles=resultado.disponibles,
        mensaje=f"{resultado.disponibles} unidades disponibles",
    )


# ============================================================
# MARCAR NOTIFICADA
# ============================================================
@router.post("/{cotizacion_id}/marcar-notificada")
def marcar_notificada(cotizacion_id: int, db: Session = Depends(get_db)):
    resultado = db.execute(
        text("SELECT fn_marcar_notificada(:cid) AS msg"),
        {"cid": cotizacion_id},
    ).fetchone()
    db.commit()
    return {"mensaje": resultado.msg}


# ============================================================
# EJECUTAR TAREA DIARIA (manual, para pruebas)
# ============================================================
@router.post("/ejecutar-tarea-diaria")
def ejecutar_tarea_diaria_manual():
    """
    Ejecuta manualmente la tarea que normalmente corre a las 8 AM.
    Se ejecuta de forma SÍNCRONA para evitar problemas con asyncio.
    """
    from model.scheduler import ejecutar_tarea_diaria

    try:
        resultado = ejecutar_tarea_diaria()
        return {
            "mensaje": "Tarea diaria ejecutada correctamente",
            "detalles": resultado,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error en tarea diaria: {str(e)}")