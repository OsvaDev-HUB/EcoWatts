from flask import Flask
from app.config import Config
from app.extensions import db, login_manager, csrf, limiter
from flask_talisman import Talisman

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Configurar cookies seguras (false en dev para permitir inicio de sesión)
    app.config.update(
        SESSION_COOKIE_SECURE=not app.config.get('DEBUG', False),
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax"
    )

    # Inicializar extensiones
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    csrf.init_app(app)
    limiter.init_app(app)
    
    csp = {
        'default-src': [
            '\'self\'',
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://cdnjs.cloudflare.com',
            'https://cdn.jsdelivr.net'
        ],
        'script-src': [
            '\'self\'',
            'https://cdn.jsdelivr.net',
            '\'unsafe-inline\''
        ],
        'style-src': [
            '\'self\'',
            'https://fonts.googleapis.com',
            'https://cdnjs.cloudflare.com',
            '\'unsafe-inline\''
        ],
        'font-src': [
            '\'self\'',
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://cdnjs.cloudflare.com'
        ],
        'img-src': [
            '\'self\'',
            'data:',
            'https://upload.wikimedia.org'
        ]
    }
    Talisman(app, content_security_policy=csp, force_https=False)

    # Configurar User loader para flask_login
    # Importar modelos para que SQLAlchemy los reconozca
    from app.models.user import User
    from app.models.aparato import Aparato
    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    # Registrar Blueprints
    from app.routes.auth import bp as auth_bp
    from app.routes.pages import bp as pages_bp
    from app.routes.api import bp as api_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(pages_bp)
    app.register_blueprint(api_bp)

    # Crear tablas si no existen
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            print(f"Error al conectar con la base de datos: {e}")

    return app
