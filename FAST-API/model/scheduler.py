import os
import traceback
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import text

from config.database import SessionLocal
from model.utils.email_utils import enviar_correo

scheduler = AsyncIOScheduler()

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@ce-web.com")


def _construir_email_vencimiento(cotizacion_id, username, cliente_email, end_date, total_price):
    """Construye el asunto y cuerpo HTML del email de vencimiento."""
    asunto = f"⏰ Reserva COT-{cotizacion_id} vence en 3 días"
    cuerpo = f"""
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #b21420;">⏰ Reserva por vencer</h2>
        <p>La siguiente reserva vence en <strong>3 días</strong>:</p>
        <ul>
          <li><strong>Número:</strong> COT-{cotizacion_id}</li>
          <li><strong>Cliente:</strong> {username} ({cliente_email})</li>
          <li><strong>Fecha de fin:</strong> {end_date}</li>
          <li><strong>Total:</strong> ${total_price:,.0f} COP</li>
        </ul>
        <p>Por favor prepárate para gestionar la devolución o renovación.</p>
        <hr>
        <p style="color: #999; font-size: 12px;">CE-Web</p>
      </body>
    </html>
    """
    return asunto, cuerpo


# ============================================================
# FUNCIÓN SÍNCRONA PRINCIPAL — se puede llamar desde el endpoint
# ============================================================
def ejecutar_tarea_diaria():
    """
    Ejecuta la tarea diaria (versión síncrona).
    La llaman tanto el scheduler como el endpoint manual.
    """
    print("🔄 Ejecutando tarea diaria de reservas...")
    db = SessionLocal()
    reservas_notificadas = 0

    try:
        # 1. Actualizar estados automáticamente
        resultado = db.execute(
            text("SELECT * FROM fn_actualizar_estados_reservas()")
        ).fetchall()

        for fila in resultado:
            print(f"   📊 {fila.detalle}")

        # 2. Buscar reservas por vencer y notificar
        reservas = db.execute(
            text("SELECT * FROM fn_reservas_por_vencer()")
        ).fetchall()

        for r in reservas:
            if r.notificado:
                continue

            asunto, cuerpo = _construir_email_vencimiento(
                r.cotizacion_id, r.username, r.cliente_email,
                r.end_date, float(r.total_price)
            )

            # 👇 Captura el resultado real
            enviar = enviar_correo(ADMIN_EMAIL, asunto, cuerpo)

            if enviar:
                print(f"   📧 ✅ Email enviado para COT-{r.cotizacion_id}")
            else:
                print(f"   📧 ❌ Email NO enviado para COT-{r.cotizacion_id}")

            db.execute(
                text("SELECT fn_marcar_notificada(:id)"),
                {"id": r.cotizacion_id}
            )
            reservas_notificadas += 1
            print(f"   ✅ Marcada notificada COT-{r.cotizacion_id}")

        db.commit()
        print(f"✅ Tarea diaria completada ({reservas_notificadas} notificadas)")

        return {
            "status": "ok",
            "reservas_notificadas": reservas_notificadas,
        }

    except Exception as e:
        db.rollback()
        print(f"❌ Error en tarea diaria: {e}")
        traceback.print_exc()
        raise
    finally:
        db.close()


# ============================================================
# WRAPPER ASYNC — para el scheduler de APScheduler
# ============================================================
async def tarea_diaria_async():
    """Versión async que envuelve la síncrona. Solo la usa APScheduler."""
    ejecutar_tarea_diaria()


def iniciar_scheduler():
    if scheduler.running:
        return
    scheduler.add_job(
        tarea_diaria_async,
        CronTrigger(hour=8, minute=0),
        id="tarea_diaria_reservas",
        replace_existing=True,
    )
    scheduler.start()
    print("⏰ Scheduler iniciado — corre a las 8:00 AM")


def detener_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        print("⏰ Scheduler detenido")