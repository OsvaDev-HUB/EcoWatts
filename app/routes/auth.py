from flask import Blueprint, render_template, request, redirect, url_for, flash, session, current_app
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db, limiter
from app.models.user import User
from datetime import datetime
import re
import requests
import secrets
import string

def generate_random_password(length=16):
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        password = ''.join(secrets.choice(alphabet) for i in range(length))
        if (any(c.islower() for c in password)
                and any(c.isupper() for c in password)
                and sum(c.isdigit() for c in password) >= 1
                and any(c in "!@#$%^&*" for c in password)):
            return password

bp = Blueprint('auth', __name__)

def is_valid_email(email):
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None

@bp.route('/registro', methods=['GET', 'POST'])
@limiter.limit("5 per minute")
def registro():
    if current_user.is_authenticated:
        return redirect(url_for('pages.inicio'))
    
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        
        # Validaciones de seguridad
        if not username or not email or not password:
            flash('Todos los campos son obligatorios', 'error')
            return redirect(url_for('auth.registro'))

        if len(username) < 3 or len(username) > 80:
            flash('El nombre de usuario debe tener entre 3 y 80 caracteres', 'error')
            return redirect(url_for('auth.registro'))

        if not is_valid_email(email):
            flash('El formato del correo electrónico no es válido', 'error')
            return redirect(url_for('auth.registro'))
            
        if password != confirm_password:
            flash('Las contraseñas no coinciden', 'error')
            return redirect(url_for('auth.registro'))
        
        if User.query.filter_by(username=username).first():
            flash('El nombre de usuario ya existe', 'error')
            return redirect(url_for('auth.registro'))
            
        if User.query.filter_by(email=email).first():
            flash('El correo electrónico ya está registrado', 'error')
            return redirect(url_for('auth.registro'))
            
        if len(password) < 8 or not re.search(r"[A-Z]", password) or not re.search(r"\d", password) or not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            flash('La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo', 'error')
            return redirect(url_for('auth.registro'))
        
        hashed_pw = generate_password_hash(password)
        nuevo_usuario = User(
            username=username, 
            email=email,
            password_hash=hashed_pw,
            created_at=datetime.utcnow(),
            is_active=True
        )
        db.session.add(nuevo_usuario)
        db.session.commit()
        
        # Enviar correo asíncrono de bienvenida
        from app.services.email_service import enviar_correo_bienvenida
        enviar_correo_bienvenida(email, username)
        
        flash('Registro exitoso. Revisa tu correo electrónico.', 'success')
        return redirect(url_for('auth.login'))
        
    return render_template('registro.html')

@bp.route('/login', methods=['GET', 'POST'])
@limiter.limit("10 per minute", methods=["POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('pages.inicio'))
    
    if request.method == 'POST':
        login_input = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        
        # Permitir login por email o username
        user = User.query.filter((User.username == login_input) | (User.email == login_input.lower())).first()
        
        if user and check_password_hash(user.password_hash, password):
            if getattr(user, 'is_active', True) is False:
                flash('Tu cuenta ha sido desactivada. Contacta a soporte.', 'error')
                return redirect(url_for('auth.login'))
                
            # Actualizar último inicio de sesión
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            login_user(user)
            
            # Limpiar sesión temporal si la hubiera, para evitar conflictos o migraciones no deseadas por ahora
            if 'anon_aparatos' in session:
                session.pop('anon_aparatos', None)
                session.modified = True
                
            return redirect(url_for('pages.inicio'))
        
        # Evitar dar información sobre si falló el usuario o la contraseña para prevenir enumeración
        flash('Credenciales incorrectas', 'error')
        
    return render_template('login.html')

@bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('pages.inicio'))

@bp.route('/recuperar-password', methods=['GET', 'POST'])
@limiter.limit("5 per minute")
def recuperar_password():
    if current_user.is_authenticated:
        return redirect(url_for('pages.inicio'))
        
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        user = User.query.filter_by(email=email).first()
        
        if user:
            # Generar token seguro que expira en 1 hora (3600 segundos)
            s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
            token = s.dumps(user.email, salt='recuperar-password')
            
            reset_link = url_for('auth.reset_password', token=token, _external=True)
            
            from app.services.email_service import enviar_correo_recuperacion
            enviar_correo_recuperacion(user.email, user.username, reset_link)
            
        # Siempre mostrar el mismo mensaje para evitar filtración de usuarios registrados
        flash('Si el correo existe en nuestra base de datos, te hemos enviado un enlace para recuperar tu contraseña.', 'success')
        return redirect(url_for('auth.login'))
        
    return render_template('recuperar.html')

@bp.route('/reset-password/<token>', methods=['GET', 'POST'])
@limiter.limit("5 per minute")
def reset_password(token):
    if current_user.is_authenticated:
        return redirect(url_for('pages.inicio'))
        
    s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        # El token dura 1 hora (3600 segundos)
        email = s.loads(token, salt='recuperar-password', max_age=3600)
    except Exception:
        flash('El enlace de recuperación es inválido o ha expirado.', 'error')
        return redirect(url_for('auth.recuperar_password'))
        
    if request.method == 'POST':
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        
        if password != confirm_password:
            flash('Las contraseñas no coinciden', 'error')
            return render_template('reset_password.html', token=token)
            
        if len(password) < 8 or not re.search(r"[A-Z]", password) or not re.search(r"\d", password) or not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            flash('La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo', 'error')
            return render_template('reset_password.html', token=token)
            
        user = User.query.filter_by(email=email).first()
        if user:
            user.password_hash = generate_password_hash(password)
            db.session.commit()
            flash('Tu contraseña ha sido actualizada con éxito. Ahora puedes iniciar sesión.', 'success')
            return redirect(url_for('auth.login'))
        else:
            flash('Usuario no encontrado.', 'error')
            return redirect(url_for('auth.recuperar_password'))
            
    return render_template('reset_password.html', token=token)

@bp.route('/google')
def google_login():
    client_id = current_app.config.get('GOOGLE_CLIENT_ID')
    if not client_id:
        flash('El inicio de sesión con Google no está configurado aún. Por favor contacta al administrador.', 'error')
        return redirect(url_for('auth.login'))
        
    redirect_uri = url_for('auth.google_callback', _external=True)
    google_auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&scope=openid%20email%20profile"
    return redirect(google_auth_url)

@bp.route('/google/callback')
def google_callback():
    code = request.args.get('code')
    if not code:
        flash('No se pudo autenticar con Google.', 'error')
        return redirect(url_for('auth.login'))
        
    client_id = current_app.config.get('GOOGLE_CLIENT_ID')
    client_secret = current_app.config.get('GOOGLE_CLIENT_SECRET')
    redirect_uri = url_for('auth.google_callback', _external=True)
    
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code"
    }
    
    try:
        response = requests.post(token_url, data=data)
        if not response.ok:
            flash('Fallo al obtener token de Google.', 'error')
            return redirect(url_for('auth.login'))
            
        tokens = response.json()
        access_token = tokens.get("access_token")
        
        userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        userinfo_response = requests.get(userinfo_url, headers=headers)
        
        if not userinfo_response.ok:
            flash('Fallo al obtener datos del usuario de Google.', 'error')
            return redirect(url_for('auth.login'))
            
        userinfo = userinfo_response.json()
        email = userinfo.get("email")
        name = userinfo.get("name", "").replace(" ", "")
        
        if not email:
            flash('Google no proporcionó un email.', 'error')
            return redirect(url_for('auth.login'))
            
        user = User.query.filter_by(email=email).first()
        if not user:
            # Crear usuario nuevo
            base_username = name if name else email.split('@')[0]
            username = base_username
            counter = 1
            while User.query.filter_by(username=username).first():
                username = f"{base_username}{counter}"
                counter += 1
                
            random_pw = generate_random_password()
            hashed_pw = generate_password_hash(random_pw)
            
            user = User(
                username=username,
                email=email,
                password_hash=hashed_pw,
                created_at=datetime.utcnow(),
                is_active=True
            )
            db.session.add(user)
            db.session.commit()
            
            from app.services.email_service import enviar_correo_bienvenida
            enviar_correo_bienvenida(email, username)
            
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        login_user(user)
        if 'anon_aparatos' in session:
            session.pop('anon_aparatos', None)
            session.modified = True
            
        return redirect(url_for('pages.inicio'))
        
    except Exception as e:
        current_app.logger.error(f"Error en Google Auth: {str(e)}")
        flash('Ocurrió un error en la autenticación con Google.', 'error')
        return redirect(url_for('auth.login'))
