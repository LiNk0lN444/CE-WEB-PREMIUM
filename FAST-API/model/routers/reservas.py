import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from config.database import get_db
from schema import schemas

router = APIRouter(prefix="/reservas", tags=["Reservas"])


# ============================================================
# CREAR RESERVA (cliente) — por MESES + Email de confirmación
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

    # ─────────────────────────────────────────────
    # 📧 Email de confirmación al cliente
    # ─────────────────────────────────────────────
    from model.utils.email_utils import enviar_correo

    cliente = db.execute(
        text("SELECT username, email FROM Users WHERE user_id = :uid"),
        {"uid": datos.user_id},
    ).fetchone()

    if cliente and cliente.email:
        try:
            # ¿Requiere asesor? (>30M)
            cot_info = db.execute(
                text("""
                    SELECT total_price, requiere_asesor
                    FROM cotizaciones WHERE cotizacion_id = :cid
                """),
                {"cid": resultado.cotizacion_id},
            ).fetchone()

            if cot_info and cot_info.requiere_asesor:
                # Email especial: requiere asesor
                asesor_info = db.execute(
                    text("""
                        SELECT u.username, u.email, u.phone_number,
                               ag.fecha, ag.hora_inicio, ag.hora_fin
                        FROM cotizaciones c
                        INNER JOIN Users u ON u.user_id = c.asesor_id
                        LEFT JOIN agenda_asesor ag ON ag.cotizacion_id = c.cotizacion_id
                        WHERE c.cotizacion_id = :cid
                        LIMIT 1
                    """),
                    {"cid": resultado.cotizacion_id},
                ).fetchone()

                asunto = f"📞 Tu cotización COT-{resultado.cotizacion_id} requiere asesoría"
                cuerpo = f"""
                <html>
                  <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 8px; padding: 30px;">
                      <h2 style="color: #b21420;">📞 Requiere asesoría personalizada</h2>

                      <p>Hola <strong>{cliente.username}</strong>,</p>

                      <p>Tu cotización <strong>COT-{resultado.cotizacion_id}</strong> supera los $30.000.000 COP.
                      Un asesor comercial se contactará contigo en el siguiente horario laboral:</p>

                      {f'''
                      <div style="background: #fff; border-left: 4px solid #2e7d32; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>📅 Fecha:</strong> {asesor_info.fecha}</p>
                        <p style="margin: 5px 0 0 0;"><strong>🕐 Hora:</strong> {asesor_info.hora_inicio} - {asesor_info.hora_fin}</p>
                        <p style="margin: 5px 0 0 0;"><strong>👤 Asesor:</strong> {asesor_info.username}</p>
                        <p style="margin: 5px 0 0 0;"><strong>📞 Teléfono:</strong> {asesor_info.phone_number or 'No disponible'}</p>
                      </div>
                      ''' if asesor_info else ''}

                      <p style="color: #888; font-size: 13px;">
                        Si no podemos contactarte, te llamaremos en el siguiente horario disponible.
                      </p>

                      <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">
                      <p style="color: #999; font-size: 12px; text-align: center;">
                        Cimentaciones y Estructuras CE-Web
                      </p>
                    </div>
                  </body>
                </html>
                """

                enviar_correo(cliente.email, asunto, cuerpo)
                print(f"📧 Email de asesoría enviado a {cliente.email}")

                # 📧 Email al asesor
                if asesor_info and asesor_info.email:
                    asunto_asesor = f"📞 Nueva cita: COT-{resultado.cotizacion_id}"
                    cuerpo_asesor = f"""
                    <html>
                      <body style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2 style="color: #b21420;">📞 Nueva cita agendada</h2>
                        <p>Tienes una nueva llamada de asesoría:</p>
                        <ul>
                          <li><strong>Cotización:</strong> COT-{resultado.cotizacion_id}</li>
                          <li><strong>Cliente:</strong> {cliente.username} ({cliente.email})</li>
                          <li><strong>Total:</strong> ${float(cot_info.total_price):,.0f} COP</li>
                          <li><strong>Fecha:</strong> {asesor_info.fecha}</li>
                          <li><strong>Hora:</strong> {asesor_info.hora_inicio} - {asesor_info.hora_fin}</li>
                        </ul>
                        <p>Revisa tu panel de asesor para más detalles.</p>
                      </body>
                    </html>
                    """
                    enviar_correo(asesor_info.email, asunto_asesor, cuerpo_asesor)
                    print(f"📧 Email de cita enviado al asesor {asesor_info.email}")

            else:
                # Email normal (reserva <30M)
                asunto = f"📋 Reserva COT-{resultado.cotizacion_id} recibida"
                cuerpo = f"""
                <html>
                  <body style="font-family: Arial, sans-serif; padding: 20px;">
                    <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 8px; padding: 30px;">
                      <h2 style="color: #b21420;">📋 Solicitud recibida</h2>
                      <p>Hola <strong>{cliente.username}</strong>,</p>
                      <p>Hemos recibido tu solicitud. Un administrador la revisará pronto.</p>
                      <p><strong>Número:</strong> COT-{resultado.cotizacion_id}</p>
                      <p><strong>Total:</strong> ${float(resultado.total):,.0f} COP</p>
                    </div>
                  </body>
                </html>
                """
                enviar_correo(cliente.email, asunto, cuerpo)

        except Exception as e:
            print(f"❌ Error enviando emails: {e}")

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
# APROBAR RESERVA (admin) + Email al cliente
# ============================================================
@router.post("/{cotizacion_id}/aprobar")
def aprobar_reserva(
    cotizacion_id: int,
    datos: schemas.AprobarReserva,
    db: Session = Depends(get_db),
):
    """Aprueba una reserva y envía email de confirmación al cliente."""

    # ─────────────────────────────────────────────
    # 1. Datos de la reserva (para el email)
    # ─────────────────────────────────────────────
    info = db.execute(
        text("""
            SELECT
                c.cotizacion_id,
                c.start_date,
                c.end_date,
                c.total_price,
                u.username,
                u.email AS cliente_email
            FROM cotizaciones c
            INNER JOIN Users u ON u.user_id = c.user_id
            WHERE c.cotizacion_id = :cid
        """),
        {"cid": cotizacion_id},
    ).fetchone()

    # ─────────────────────────────────────────────
    # 2. Aprobar en la BD (descuenta stock)
    # ─────────────────────────────────────────────
    resultado = db.execute(
        text("SELECT fn_aprobar_reserva(:cid, :aid) AS msg"),
        {"cid": cotizacion_id, "aid": datos.admin_id},
    ).fetchone()
    db.commit()

    if "aprobada" not in resultado.msg.lower():
        raise HTTPException(status_code=400, detail=resultado.msg)

    # ─────────────────────────────────────────────
    # 3. Email al cliente
    # ─────────────────────────────────────────────
    if info and info.cliente_email:
        try:
            from model.utils.email_utils import enviar_correo

            asunto = f"✅ Reserva COT-{cotizacion_id} aprobada"
            cuerpo = f"""
            <html>
              <body style="font-family: Arial, sans-serif; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 8px; padding: 30px;">
                  <h2 style="color: #2e7d32;">✅ ¡Tu reserva fue aprobada!</h2>

                  <p>Hola <strong>{info.username}</strong>,</p>

                  <p>Tu reserva ha sido aprobada por un administrador. Aquí los detalles:</p>

                  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Número:</td>
                      <td style="padding: 8px 0;"><strong>COT-{cotizacion_id}</strong></td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Fecha de inicio:</td>
                      <td style="padding: 8px 0;"><strong>{info.start_date}</strong></td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Fecha de fin:</td>
                      <td style="padding: 8px 0;"><strong>{info.end_date}</strong></td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666;">Total:</td>
                      <td style="padding: 8px 0;"><strong>${float(info.total_price):,.0f} COP</strong></td>
                    </tr>
                  </table>

                  <p>Puedes pasar a retirar tu maquinaria o herramienta en la fecha acordada.</p>

                  <p style="color: #888; font-size: 13px;">
                    Recuerda que 3 días antes del vencimiento te avisaremos para coordinar la devolución.
                  </p>

                  <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">
                  <p style="color: #999; font-size: 12px; text-align: center;">
                    Cimentaciones y Estructuras CE-Web
                  </p>
                </div>
              </body>
            </html>
            """

            enviado = enviar_correo(info.cliente_email, asunto, cuerpo)
            if enviado:
                print(f"📧 Email de aprobación enviado a {info.cliente_email}")
            else:
                print(f"⚠️ Email de aprobación NO enviado a {info.cliente_email}")

        except Exception as e:
            print(f"❌ Error enviando email de aprobación: {e}")

    return {"mensaje": resultado.msg}


# ============================================================
# RECHAZAR RESERVA (admin) + Email al cliente
# ============================================================
@router.post("/{cotizacion_id}/rechazar")
def rechazar_reserva(
    cotizacion_id: int,
    datos: schemas.RechazarReserva,
    db: Session = Depends(get_db),
):
    """Rechaza una reserva y envía email al cliente con el motivo."""

    # Datos para el email
    info = db.execute(
        text("""
            SELECT
                c.cotizacion_id,
                u.username,
                u.email AS cliente_email
            FROM cotizaciones c
            INNER JOIN Users u ON u.user_id = c.user_id
            WHERE c.cotizacion_id = :cid
        """),
        {"cid": cotizacion_id},
    ).fetchone()

    # Rechazar en la BD
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

    # Email al cliente
    if info and info.cliente_email:
        try:
            from model.utils.email_utils import enviar_correo

            asunto = f"❌ Reserva COT-{cotizacion_id} rechazada"
            cuerpo = f"""
            <html>
              <body style="font-family: Arial, sans-serif; padding: 20px;">
                <div style="max-width: 600px; margin: 0 auto; background: #f9f9f9; border-radius: 8px; padding: 30px;">
                  <h2 style="color: #d32f2f;">❌ Reserva rechazada</h2>

                  <p>Hola <strong>{info.username}</strong>,</p>

                  <p>Lamentablemente tu reserva <strong>COT-{cotizacion_id}</strong> no pudo ser aprobada.</p>

                  <p><strong>Motivo:</strong></p>
                  <p style="background: #fff; border-left: 3px solid #d32f2f; padding: 10px 15px; font-style: italic;">
                    "{datos.motivo}"
                  </p>

                  <p>Puedes intentar con otras fechas u otro equipo. Si tienes dudas, contáctanos.</p>

                  <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">
                  <p style="color: #999; font-size: 12px; text-align: center;">
                    Cimentaciones y Estructuras CE-Web
                  </p>
                </div>
              </body>
            </html>
            """

            enviado = enviar_correo(info.cliente_email, asunto, cuerpo)
            if enviado:
                print(f"📧 Email de rechazo enviado a {info.cliente_email}")
            else:
                print(f"⚠️ Email de rechazo NO enviado a {info.cliente_email}")

        except Exception as e:
            print(f"❌ Error enviando email de rechazo: {e}")

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

    # ============================================================
# RESERVAS EN CURSO (admin) — approved y active
# ============================================================
@router.get("/en-curso", response_model=list[schemas.ReservaDetalle])
def listar_reservas_en_curso(db: Session = Depends(get_db)):
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
        ORDER BY
            CASE c.status WHEN 'active' THEN 1 WHEN 'approved' THEN 2 END,
            c.start_date ASC
    """)
    return [dict(r._mapping) for r in db.execute(query).fetchall()]