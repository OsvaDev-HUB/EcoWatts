import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import render_template, current_app
import os
import threading

def send_email_async(app, msg, server, port, sender):
    with app.app_context():
        try:
            with smtplib.SMTP(server, port) as smtp:
                # Si hubiera credenciales reales se usaría:
                # smtp.starttls()
                # smtp.login(user, password)
                smtp.send_message(msg)
                print(f"Correo enviado exitosamente a {msg['To']}")
        except Exception as e:
            print(f"Error enviando correo: {e}")

def enviar_correo_bienvenida(email_destino, username):
    server = os.environ.get('SMTP_SERVER', 'mailpit')
    port = int(os.environ.get('SMTP_PORT', 1025))
    sender = os.environ.get('SENDER_EMAIL', 'noreply@ecowatts.cl')
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = f"¡Bienvenido a EcoWatts, {username}!"
    msg['From'] = f"EcoWatts <{sender}>"
    msg['To'] = email_destino

    # Cargar el contenido HTML del template
    html_content = render_template('emails/welcome.html', username=username)
    
    # Texto plano como fallback
    text_content = f"Hola {username},\n\n¡Bienvenido a EcoWatts! Estamos felices de tenerte a bordo para empezar a ahorrar energía.\n\nSaludos,\nEl equipo de EcoWatts"

    msg.attach(MIMEText(text_content, 'plain'))
    msg.attach(MIMEText(html_content, 'html'))

    # Ejecutar en un hilo separado para no bloquear la respuesta HTTP
    app = current_app._get_current_object()
    thread = threading.Thread(target=send_email_async, args=(app, msg, server, port, sender))
    thread.start()

def enviar_correo_recuperacion(email_destino, username, reset_link):
    server = os.environ.get('SMTP_SERVER', 'mailpit')
    port = int(os.environ.get('SMTP_PORT', 1025))
    sender = os.environ.get('SENDER_EMAIL', 'noreply@ecowatts.cl')
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = f"Recuperación de contraseña - EcoWatts"
    msg['From'] = f"EcoWatts Seguridad <{sender}>"
    msg['To'] = email_destino

    html_content = render_template('emails/reset_password.html', username=username, reset_link=reset_link)
    text_content = f"Hola {username},\n\nHaz clic en el siguiente enlace para restablecer tu contraseña:\n\n{reset_link}\n\nSi no fuiste tú, ignora este correo."

    msg.attach(MIMEText(text_content, 'plain'))
    msg.attach(MIMEText(html_content, 'html'))

    app = current_app._get_current_object()
    thread = threading.Thread(target=send_email_async, args=(app, msg, server, port, sender))
    thread.start()
