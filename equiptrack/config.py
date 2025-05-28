import os
from dotenv import load_dotenv
from pathlib import Path

# Charger les variables d'environnement depuis .env
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

# Créer le répertoire de base de données si nécessaire
os.makedirs('data', exist_ok=True)

class Config:
    # Configuration de base
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev_change_this_in_production')
    FLASK_ENV = os.getenv('FLASK_ENV', 'production')
    
    # Base de données
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', f'sqlite:///{os.path.join(BASE_DIR, "app.db")}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Configuration du serveur
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5000))
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'logs/equiptrack.log')
    
    # Configuration de l'application
    APP_NAME = os.getenv('APP_NAME', 'EquipTrack')
    APP_DESCRIPTION = os.getenv('APP_DESCRIPTION', 'Application de suivi des équipements éducatifs')
    
    # Sécurité
    SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'false').lower() == 'true'
    REMEMBER_COOKIE_SECURE = os.getenv('REMEMBER_COOKIE_SECURE', 'false').lower() == 'true'
    SESSION_COOKIE_HTTPONLY = os.getenv('SESSION_COOKIE_HTTPONLY', 'true').lower() == 'true'
    REMEMBER_COOKIE_HTTPONLY = os.getenv('REMEMBER_COOKIE_HTTPONLY', 'true').lower() == 'true'
    
    # Configuration de Flask-Login
    LOGIN_VIEW = 'auth.login'
    LOGIN_MESSAGE = 'Veuillez vous connecter pour accéder à cette page.'
    LOGIN_MESSAGE_CATEGORY = 'info'
    
    # Configuration de Flask-Admin
    FLASK_ADMIN_SWATCH = 'cerulean'
    
    # Configuration du compte administrateur par défaut
    ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')
    ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@example.com')
    ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin123')
    
    # Chemins des fichiers de données
    DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
    os.makedirs(DATA_DIR, exist_ok=True)
    EQUIPMENTS_JSON = os.path.join(DATA_DIR, 'equipments.json')
    USAGES_JSON = os.path.join(DATA_DIR, 'usages.json')
    
    @staticmethod
    def init_app(app):
        """Initialisation de l'application."""
        # Créer le répertoire de logs s'il n'existe pas
        log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
        os.makedirs(log_dir, exist_ok=True)


class DevelopmentConfig(Config):
    FLASK_ENV = 'development'
    DEBUG = True
    SQLALCHEMY_ECHO = True
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(Config.BASE_DIR, "data/equiptrack_dev.db")}'


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False


class ProductionConfig(Config):
    FLASK_ENV = 'production'
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', f'sqlite:///{os.path.join(Config.BASE_DIR, "data/equiptrack_prod.db")}')
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True


# Dictionnaire des configurations disponibles
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
