import os
import smtplib
import socket
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")


def _resolver_ipv4(host: str, port: int) -> str:
    """Obtiene una dirección IPv4 explícita para evitar [Errno 101] Network is unreachable en IPv6."""
    infos = socket.getaddrinfo(host, port, socket.AF_INET, socket.SOCK_STREAM)
    if not infos:
        raise OSError(f"No se pudo resolver IPv4 para {host}:{port}")
    return infos[0][4][0]


def enviar_correo(destinatario: str, asunto: str, cuerpo_html: str) -> bool:
    """
    Envía un correo usando Gmail SMTP forzando IPv4 con contraseña de aplicación.
    Intenta primero SSL (puerto 465) y, si falla, STARTTLS (puerto 587).
    Devuelve True si se envió correctamente, False si falló.
    """
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        print("Faltan las variables de entorno GMAIL_USER o GMAIL_APP_PASSWORD")
        return False

    mensaje = MIMEMultipart("alternative")
    mensaje["Subject"] = asunto
    mensaje["From"] = GMAIL_USER
    mensaje["To"] = destinatario
    mensaje.attach(MIMEText(cuerpo_html, "html"))

    host = "smtp.gmail.com"
    timeout = 15

    # Intento 1: SMTP_SSL en puerto 465 sobre IPv4
    try:
        ip_465 = _resolver_ipv4(host, 465)
        with smtplib.SMTP_SSL(ip_465, 465, timeout=timeout) as servidor:
            servidor.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            servidor.sendmail(GMAIL_USER, destinatario, mensaje.as_string())
        return True
    except Exception as err_465:
        print(f"Error enviando correo por puerto 465 (SSL/IPv4): {err_465}")

    # Intento 2: SMTP + STARTTLS en puerto 587 sobre IPv4
    try:
        ip_587 = _resolver_ipv4(host, 587)
        with smtplib.SMTP(ip_587, 587, timeout=timeout) as servidor:
            servidor.ehlo()
            servidor.starttls()
            servidor.ehlo()
            servidor.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            servidor.sendmail(GMAIL_USER, destinatario, mensaje.as_string())
        return True
    except Exception as err_587:
        print(f"Error enviando correo por puerto 587 (STARTTLS/IPv4): {err_587}")
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