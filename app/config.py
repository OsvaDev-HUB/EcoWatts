import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY')
    if not SECRET_KEY:
        raise ValueError("No se ha configurado SECRET_KEY para Flask")
        
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    TARIFA_KWH = 236
    
    # Debug por defecto es False si no está definido en el entorno
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() in ['true', '1', 't']
