import os
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


def enviar_correo(destinatario: str, asunto: str, cuerpo_html: str) -> bool:
    remitente = os.getenv("GMAIL_SENDER_EMAIL") or os.getenv("GMAIL_USER")
    client_id = os.getenv("GMAIL_CLIENT_ID")
    client_secret = os.getenv("GMAIL_CLIENT_SECRET")
    refresh_token = os.getenv("GMAIL_REFRESH_TOKEN")

    if not all([remitente, client_id, client_secret, refresh_token]):
        print("⚠️ Faltan credenciales OAuth de Gmail en variables de entorno.")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = asunto
    msg["From"] = f"Cimentaciones y Estructuras CE-Web <{remitente}>"
    msg["To"] = destinatario

    parte_html = MIMEText(cuerpo_html, "html")
    msg.attach(parte_html)

    try:
        creds = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=client_id,
            client_secret=client_secret,
            scopes=["https://www.googleapis.com/auth/gmail.send"]
        )

        servicio = build("gmail", "v1", credentials=creds)
        mensaje_codificado = base64.urlsafe_b64encode(msg.as_bytes()).decode("utf-8")

        servicio.users().messages().send(
            userId="me",
            body={"raw": mensaje_codificado}
        ).execute()

        print(f"✅ Correo enviado a {destinatario}")
        return True
    except Exception as e:
        print(f"❌ Error enviando correo: {e}")
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
            <p style="color: #d32f2f; font-weight: bold;">Por motivos de seguridad, esta orden requiere validación humana.</p>
            <p>Por favor, <strong>comuníquese directamente con nuestra asesora comercial Emily Mora Silva</strong>.</p>
            <p>Correo: <a href="mailto:emily.mora@ce-web.com">emily.mora@ce-web.com</a></p>
            <p>Teléfono: <a href="tel:+573058247819">+57 305 824 7819</a></p>
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
            <p>Gracias por confiar en Cimentaciones y Estructuras CE-Web.</p>
          </body>
        </html>
        """
    return asunto, cuerpo_html