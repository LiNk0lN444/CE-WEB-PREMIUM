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
 
 
def cuerpo_confirmacion_cotizacion(nombre_cliente: str, numero_cotizacion: str, total_valor) -> tuple[str, str]:
    MONTO_LIMITE = 20000000.0
    
    # Convertir a float por seguridad por si llega como string o número
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
            <p>Por favor, <strong>comuniquese directamente con nuestra asesora comercial Emily Mora Silva</strong> para procesar y autorizar tu solicitud.</p>
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