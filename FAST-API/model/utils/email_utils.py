import json
import os
import urllib.error
import urllib.request

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
MAIL_FROM = os.getenv("MAIL_FROM", "CE-Web <onboarding@resend.dev>")


def enviar_correo(destinatario: str, asunto: str, cuerpo_html: str) -> bool:
    """
    Envía un correo vía HTTPS (Resend API) para evitar bloqueos SMTP en Railway.
    Devuelve True si se envió correctamente, False si falló.
    """
    if not RESEND_API_KEY:
        print("Falta la variable de entorno RESEND_API_KEY")
        return False

    payload = json.dumps({
        "from": MAIL_FROM,
        "to": [destinatario],
        "subject": asunto,
        "html": cuerpo_html,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "CE-Web-Backend/1.0",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return 200 <= resp.status < 300
    except urllib.error.HTTPError as err:
        detalle = err.read().decode("utf-8", errors="ignore")
        print(f"Error HTTP enviando correo ({err.code}): {detalle}")
        return False
    except Exception as err:
        print(f"Error enviando correo: {err}")
        return False


def cuerpo_confirmacion_cotizacion(nombre_cliente: str, numero_cotizacion: str, total_valor) -> tuple[str, str]:
    MONTO_LIMITE = 30000000.0

    try:
        valor_numerico = float(total_valor)
        total_formateado = f"${valor_numerico:,.0f}"
    except (ValueError, TypeError):
        valor_numerico = 0.0
        total_formateado = str(total_valor)

    if valor_numerico > MONTO_LIMITE:
        asunto = f"⚠️ Cotización {numero_cotizacion} - Requiere Asesor Comercial"
        cuerpo_html = f"""
        <html>
          <body>
            <h2>¡Hola {nombre_cliente}!</h2>
            <p>Tu solicitud de cotización <strong>{numero_cotizacion}</strong> por un valor total de <strong>{total_formateado} COP</strong> supera el límite de aprobación automática.</p>
            <p style="color: #d32f2f; font-weight: bold;">Por motivos de seguridad y políticas de crédito de CE-Web, esta orden requiere validación humana.</p>
            <p>Por favor, <strong>comuníquese directamente con nuestra asesora comercial Emily Mora Silva</strong> para procesar y autorizar tu solicitud.</p>
            <br>
            <p>Correo de contacto: <a href="mailto:emily.mora@ce-web.com">emily.mora@ce-web.com</a></p>
            <p>Teléfono de contacto: <a href="tel:+573058247819">+57 305 824 7819</a></p>
            <p>Gracias por confiar en Cimentaciones y Estructuras CE-Web.</p>
          </body>
        </html>
        """
    else:
        asunto = f"✅ Confirmación de Cotización {numero_cotizacion}"
        cuerpo_html = f"""
        <html>
          <body>
            <h2>¡Hola {nombre_cliente}!</h2>
            <p>Tu cotización <strong>{numero_cotizacion}</strong> ha sido generada exitosamente.</p>
            <p><strong>Total:</strong> {total_formateado} COP</p>
            <p>Sigue disfrutando de nuestros servicios.</p>
            <br>
            <p>Gracias por confiar en nosotros.</p>
            <p>Cimentaciones y Estructuras CE-Web</p>
          </body>
        </html>
        """

    return asunto, cuerpo_html