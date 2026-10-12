# model/routers/asesores.py
"""
Endpoints para la gestión de asesores, horarios, contratos y citas.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from config.database import get_db
from schema import schemas

router = APIRouter(prefix="/asesores", tags=["Asesores"])


# ============================================================
# CRUD ASESORES
# ============================================================
@router.get("/", response_model=list[schemas.AsesorResponse])
def listar_asesores(db: Session = Depends(get_db)):
    query = text("""
        SELECT asesor_id, user_id, nombre_completo, telefono, especialidad, activo
        FROM asesores
        ORDER BY asesor_id
    """)
    return [dict(r._mapping) for r in db.execute(query).fetchall()]


@router.get("/{asesor_id}", response_model=schemas.AsesorResponse)
def obtener_asesor(asesor_id: int, db: Session = Depends(get_db)):
    query = text("""
        SELECT asesor_id, user_id, nombre_completo, telefono, especialidad, activo
        FROM asesores WHERE asesor_id = :aid
    """)
    row = db.execute(query, {"aid": asesor_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Asesor no encontrado")
    return dict(row._mapping)


@router.post("/", response_model=schemas.AsesorResponse)
def crear_asesor(datos: schemas.AsesorCreate, db: Session = Depends(get_db)):
    # Validar que el usuario existe
    user = db.execute(
        text("SELECT user_id, role FROM Users WHERE user_id = :uid"),
        {"uid": datos.user_id},
    ).fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Verificar que no esté ya registrado como asesor
    existente = db.execute(
        text("SELECT asesor_id FROM asesores WHERE user_id = :uid"),
        {"uid": datos.user_id},
    ).fetchone()

    if existente:
        raise HTTPException(status_code=400, detail="Este usuario ya es asesor")

    # Cambiar el rol a 'asesor'
    db.execute(
        text("UPDATE Users SET role = 'asesor' WHERE user_id = :uid"),
        {"uid": datos.user_id},
    )

    # Insertar en asesores
    resultado = db.execute(
        text("""
            INSERT INTO asesores (user_id, nombre_completo, telefono, especialidad)
            VALUES (:uid, :nombre, :tel, :esp)
            RETURNING asesor_id, user_id, nombre_completo, telefono, especialidad, activo
        """),
        {
            "uid": datos.user_id,
            "nombre": datos.nombre_completo,
            "tel": datos.telefono,
            "esp": datos.especialidad,
        },
    ).fetchone()

    db.commit()
    return dict(resultado._mapping)


@router.delete("/{asesor_id}")
def desactivar_asesor(asesor_id: int, db: Session = Depends(get_db)):
    db.execute(
        text("UPDATE asesores SET activo = FALSE WHERE asesor_id = :aid"),
        {"aid": asesor_id},
    )
    db.commit()
    return {"mensaje": "Asesor desactivado"}


# ============================================================
# HORARIOS
# ============================================================
@router.get("/{asesor_id}/horarios", response_model=list[schemas.HorarioResponse])
def listar_horarios(asesor_id: int, db: Session = Depends(get_db)):
    query = text("""
        SELECT horario_id, asesor_id, dia_semana, hora_inicio, hora_fin, activo
        FROM horarios_asesor
        WHERE asesor_id = :aid
        ORDER BY
            CASE dia_semana
                WHEN 'lunes' THEN 1 WHEN 'martes' THEN 2 WHEN 'miercoles' THEN 3
                WHEN 'jueves' THEN 4 WHEN 'viernes' THEN 5 WHEN 'sabado' THEN 6
                WHEN 'domingo' THEN 7 END,
            hora_inicio
    """)
    return [dict(r._mapping) for r in db.execute(query, {"aid": asesor_id}).fetchall()]


@router.post("/{asesor_id}/horarios", response_model=schemas.HorarioResponse)
def crear_horario(
    asesor_id: int,
    datos: schemas.HorarioCreate,
    db: Session = Depends(get_db),
):
    resultado = db.execute(
        text("""
            INSERT INTO horarios_asesor (asesor_id, dia_semana, hora_inicio, hora_fin)
            VALUES (:aid, :dia, :inicio, :fin)
            RETURNING horario_id, asesor_id, dia_semana, hora_inicio, hora_fin, activo
        """),
        {
            "aid": asesor_id,
            "dia": datos.dia_semana,
            "inicio": datos.hora_inicio,
            "fin": datos.hora_fin,
        },
    ).fetchone()
    db.commit()
    return dict(resultado._mapping)


@router.delete("/horarios/{horario_id}")
def eliminar_horario(horario_id: int, db: Session = Depends(get_db)):
    db.execute(
        text("DELETE FROM horarios_asesor WHERE horario_id = :hid"),
        {"hid": horario_id},
    )
    db.commit()
    return {"mensaje": "Horario eliminado"}


# ============================================================
# CONTRATOS
# ============================================================
@router.get("/{asesor_id}/contratos", response_model=list[schemas.ContratoResponse])
def listar_contratos(asesor_id: int, db: Session = Depends(get_db)):
    query = text("""
        SELECT contrato_id, asesor_id, fecha_inicio, fecha_fin, salario,
               tipo_contrato, estado, documento_url, observaciones
        FROM contratos
        WHERE asesor_id = :aid
        ORDER BY fecha_inicio DESC
    """)
    return [dict(r._mapping) for r in db.execute(query, {"aid": asesor_id}).fetchall()]


@router.post("/{asesor_id}/contratos", response_model=schemas.ContratoResponse)
def crear_contrato(
    asesor_id: int,
    datos: schemas.ContratoCreate,
    db: Session = Depends(get_db),
):
    resultado = db.execute(
        text("""
            INSERT INTO contratos (
                asesor_id, fecha_inicio, fecha_fin, salario,
                tipo_contrato, estado, documento_url, observaciones
            )
            VALUES (
                :aid, :inicio, :fin, :salario,
                :tipo, :estado, :doc, :obs
            )
            RETURNING contrato_id, asesor_id, fecha_inicio, fecha_fin, salario,
                      tipo_contrato, estado, documento_url, observaciones
        """),
        {
            "aid": asesor_id,
            "inicio": datos.fecha_inicio,
            "fin": datos.fecha_fin,
            "salario": datos.salario,
            "tipo": datos.tipo_contrato,
            "estado": datos.estado,
            "doc": datos.documento_url,
            "obs": datos.observaciones,
        },
    ).fetchone()
    db.commit()
    return dict(resultado._mapping)


# ============================================================
# DISPONIBILIDAD
# ============================================================
@router.get("/disponibilidad/{user_id}")
def verificar_disponibilidad(user_id: int, db: Session = Depends(get_db)):
    resultado = db.execute(
        text("SELECT fn_asesor_disponible_ahora(:uid) AS disponible"),
        {"uid": user_id},
    ).fetchone()
    return {"disponible": resultado.disponible}


# ============================================================
# CITAS DEL ASESOR (panel propio)
# ============================================================
@router.get("/mis-citas/{user_id}", response_model=list[schemas.CitaResponse])
def listar_mis_citas(user_id: int, db: Session = Depends(get_db)):
    """Citas asignadas al asesor (para su panel)."""
    query = text("""
        SELECT
            ag.slot_id,
            ag.asesor_id,
            ag.cotizacion_id,
            ag.fecha,
            ag.hora_inicio,
            ag.hora_fin,
            ag.estado,
            ag.notas,
            u.username AS cliente_username,
            u.email AS cliente_email,
            u.phone_number AS cliente_telefono,
            c.total_price AS cotizacion_total
        FROM agenda_asesor ag
        INNER JOIN asesores a ON a.asesor_id = ag.asesor_id
        LEFT JOIN cotizaciones c ON c.cotizacion_id = ag.cotizacion_id
        LEFT JOIN Users u ON u.user_id = c.user_id
        WHERE a.user_id = :uid
          AND ag.fecha >= CURRENT_DATE
        ORDER BY ag.fecha, ag.hora_inicio
    """)
    return [dict(r._mapping) for r in db.execute(query, {"uid": user_id}).fetchall()]


@router.put("/citas/{slot_id}/estado")
def actualizar_estado_cita(
    slot_id: int,
    datos: schemas.CitaEstadoUpdate,
    db: Session = Depends(get_db),
):
    """Marca una cita como realizada, cancelada o no contestó."""
    if datos.estado not in ("realizada", "cancelada", "no_contesto"):
        raise HTTPException(status_code=400, detail="Estado inválido")

    db.execute(
        text("""
            UPDATE agenda_asesor
            SET estado = :estado, notas = :notas
            WHERE slot_id = :sid
        """),
        {"sid": slot_id, "estado": datos.estado, "notas": datos.notas},
    )
    db.commit()

    # Si fue realizada, marcar la cotización como contactada
    if datos.estado == "realizada":
        db.execute(
            text("""
                UPDATE cotizaciones c
                SET contactado = TRUE, fecha_contacto = CURRENT_TIMESTAMP
                FROM agenda_asesor ag
                WHERE ag.slot_id = :sid
                  AND ag.cotizacion_id = c.cotizacion_id
            """),
            {"sid": slot_id},
        )
        db.commit()

    return {"mensaje": f"Cita marcada como {datos.estado}"}