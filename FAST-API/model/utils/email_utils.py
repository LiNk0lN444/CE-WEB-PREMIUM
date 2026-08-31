import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
 
GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
 
 
def enviar_correo(destinatario: str, asunto: str, cuerpo_html: str) -> bool:
    """
    Envía un correo usando Gmail SMTP con contraseña de aplicación.
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
 
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as servidor:
            servidor.starttls()
            servidor.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            servidor.sendmail(GMAIL_USER, destinatario, mensaje.as_string())
        return True
    except Exception as err:
        print(f"Error enviando correo: {err}")
        return False
 
 
def cuerpo_confirmacion_cotizacion(nombre_cliente: str, numero_cotizacion: str, total: str) -> str:
    return f"""
    <html>
      <body>
        <h2>¡Hola {nombre_cliente}!</h2>
        <p>Tu cotización <strong>{numero_cotizacion}</strong> ha sido generada exitosamente.</p>
        <p><strong>Total:</strong> ${total}</p>
        <p>Pronto uno de nuestros asesores se pondrá en contacto contigo.</p>
        <br>
        <p>Gracias por confiar en nosotros.</p>
      </body>
    </html>
    """