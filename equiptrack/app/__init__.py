from flask import Flask, redirect, url_for, request
from flask_login import LoginManager, current_user
from flask_migrate import Migrate
from flask_admin import Admin
from flask_admin.menu import MenuLink
from config import config
from .extensions import db, login_manager
from .admin import init_admin

def create_app(config_name='development'):
    # Création de l'application Flask
    app = Flask(__name__)
    
    # Chargement de la configuration
    if isinstance(config_name, dict):
        # Si on passe directement un dictionnaire de configuration
        app.config.update(config_name)
    else:
        # Si on passe un nom de configuration
        app.config.from_object(config[config_name])
        config[config_name].init_app(app)
    
    # Initialisation des extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    
    # Initialisation de Flask-Admin avec la vue d'index sécurisée
    from .admin import SecureAdminIndexView
    
    # Création d'un sous-application pour l'administration
    admin = Admin(
        app, 
        name='ÉquipTrack Admin', 
        template_mode='bootstrap4',
        index_view=SecureAdminIndexView(),
        url='/admin',  # S'assurer que l'admin est bien sous /admin
        endpoint='admin'  # Utiliser un endpoint spécifique pour éviter les conflits
    )
    
    # Initialisation des vues d'administration
    init_admin(admin)
    
    @login_manager.user_loader
    def load_user(user_id):
        from .models import User
        return User.query.get(int(user_id))
    
    # Enregistrement des blueprints
    app.logger.info("Début de l'enregistrement des blueprints...")
    
    # Importation des blueprints
    try:
        from .main import bp as main_bp
        app.logger.info("Import du blueprint main réussi")
    except Exception as e:
        app.logger.error(f"Erreur lors de l'import du blueprint main: {e}")
    
    try:
        from .auth import bp as auth_bp
        app.logger.info("Import du blueprint auth réussi")
    except Exception as e:
        app.logger.error(f"Erreur lors de l'import du blueprint auth: {e}")
    
    try:
        from .equipment import bp as equipment_bp
        app.logger.info("Import du blueprint equipment réussi")
        app.logger.info(f"Type de equipment_bp: {type(equipment_bp)}")
        app.logger.info(f"Nom du blueprint equipment: {equipment_bp.name}")
    except Exception as e:
        app.logger.error(f"Erreur lors de l'import du blueprint equipment: {e}")
    
    try:
        from .api import bp as api_bp
        app.logger.info("Import du blueprint api réussi")
    except Exception as e:
        app.logger.error(f"Erreur lors de l'import du blueprint api: {e}")
    
    # Enregistrement conditionnel des blueprints pour éviter les doublons
    if 'main' not in app.blueprints:
        app.logger.info("Enregistrement du blueprint main")
        app.register_blueprint(main_bp)
    else:
        app.logger.info("Le blueprint main est déjà enregistré")
    
    if 'auth' not in app.blueprints:
        app.logger.info("Enregistrement du blueprint auth")
        app.register_blueprint(auth_bp, url_prefix='/auth')
    else:
        app.logger.info("Le blueprint auth est déjà enregistré")
    
    if 'equipment' not in app.blueprints:
        app.logger.info("Enregistrement du blueprint equipment")
        app.logger.info(f"Type de equipment_bp: {type(equipment_bp)}")
        app.logger.info(f"Nom du blueprint equipment: {equipment_bp.name}")
        app.logger.info(f"Routes du blueprint equipment avant enregistrement: {equipment_bp.deferred_functions}")
        try:
            app.register_blueprint(equipment_bp, url_prefix='/equipment')
            app.logger.info("Blueprint equipment enregistré avec succès")
        except Exception as e:
            app.logger.error(f"Erreur lors de l'enregistrement du blueprint equipment: {e}")
    else:
        app.logger.info("Le blueprint equipment est déjà enregistré")
    
    if 'api' not in app.blueprints:
        app.logger.info("Enregistrement du blueprint api")
        app.register_blueprint(api_bp, url_prefix='/api/v1')
    else:
        app.logger.info("Le blueprint api est déjà enregistré")
    
    app.logger.info(f"Blueprints enregistrés: {app.blueprints}")
    app.logger.info(f"Routes disponibles: {app.url_map}")
    
    # Enregistrement des gestionnaires d'erreurs de l'API
    # (déplacé dans le blueprint API pour éviter les enregistrements multiples)
    
    # Protection de l'interface d'administration
    @app.before_request
    def before_request():
        if request.path.startswith('/admin'):
            if not current_user.is_authenticated or not current_user.is_admin:
                return redirect(url_for('auth.login'))
    
    # Création des tables de la base de données
    with app.app_context():
        db.create_all()
        
        # Vérifier et créer l'administrateur par défaut si nécessaire
        from .models import User
        from sqlalchemy.exc import IntegrityError
        
        # Vérifier si un administrateur existe déjà
        if not User.query.filter_by(is_admin=True).first():
            try:
                admin_user = User(
                    username='admin',
                    email='admin@example.com',
                    is_admin=True,
                    is_active=True
                )
                admin_user.set_password('admin123')  # À changer en production !
                db.session.add(admin_user)
                db.session.commit()
                app.logger.info("Compte administrateur créé avec succès")
            except IntegrityError as e:
                db.session.rollback()
                app.logger.warning("Erreur lors de la création de l'administrateur, il existe peut-être déjà: %s", str(e))
    
    return app
