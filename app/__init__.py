from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
import os
from dotenv import load_dotenv
from datetime import datetime

# Charger les variables d'environnement
load_dotenv()

# Initialiser les extensions
db = SQLAlchemy()
login_manager = LoginManager()

def create_app():
    app = Flask(__name__)
    
    # Configuration de l'application
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-for-testing')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URI', 'sqlite:///app.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialiser les extensions avec l'application
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.session_protection = 'strong'
    
    # Enregistrer les blueprints
    from app.controllers.auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)
    
    from app.controllers.main import main as main_blueprint
    app.register_blueprint(main_blueprint)
    
    from app.controllers.equipment import equipment as equipment_blueprint
    app.register_blueprint(equipment_blueprint)
    
    from app.controllers.session import session as session_blueprint
    app.register_blueprint(session_blueprint)
    
    from app.controllers.scan import scan as scan_blueprint
    app.register_blueprint(scan_blueprint)
    
    from app.controllers.user import user as user_blueprint
    app.register_blueprint(user_blueprint)
    
    # Ajouter un context processor pour injecter la variable 'now'
    @app.context_processor
    def inject_now():
        return {'now': datetime.utcnow()}
    
    # Créer les tables de la base de données si elles n'existent pas
    with app.app_context():
        db.create_all()
    
    return app
