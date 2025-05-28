from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_restful import Api
from flask_admin import Admin, AdminIndexView, expose
from flask_admin.contrib.sqla import ModelView
from flask_login import current_user
from werkzeug.security import generate_password_hash

# Création des instances d'extensions sans les initialiser
# Elles seront initialisées avec init_app()
db = SQLAlchemy()
migrate = Migrate()
api = Api(prefix='/api')

# Vue personnalisée pour la page d'accueil de l'admin
class MyAdminIndexView(AdminIndexView):
    @expose('/')
    def index(self):
        if not current_user.is_authenticated or not current_user.is_admin:
            from flask import redirect, url_for
            return redirect(url_for('auth.login', next='/admin'))
        return super().index()

admin = Admin(
    name='EquipTrack Admin',
    template_mode='bootstrap4',
    index_view=MyAdminIndexView()
)

# Vue personnalisée pour le modèle User
class UserModelView(ModelView):
    column_exclude_list = ['password_hash']
    form_excluded_columns = ['password_hash']
    column_searchable_list = ['username', 'email']
    
    def on_model_change(self, form, model, is_created):
        if 'password' in form:
            model.set_password(form.password.data)
        return super().on_model_change(form, model, is_created)

def init_extensions(app):
    """Initialise toutes les extensions avec l'application Flask"""
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Configuration de l'interface d'administration
    from equiptrack.app.models import Equipment, Usage, User
    
    # Configuration des vues admin
    class EquipmentModelView(ModelView):
        column_list = ['qr_code', 'name', 'status', 'created_at']
        column_searchable_list = ['name', 'qr_code', 'status']
        column_filters = ['status']
        form_columns = ['qr_code', 'name', 'description', 'status']
        column_labels = {
            'qr_code': 'QR Code',
            'name': 'Nom',
            'description': 'Description',
            'status': 'Statut',
            'created_at': 'Date de création'
        }
    
    class UsageModelView(ModelView):
        column_list = ['equipment_id', 'usage_type', 'user_name', 'timestamp']
        column_searchable_list = ['user_name', 'usage_type', 'notes']
        column_filters = ['usage_type', 'timestamp']
        column_labels = {
            'equipment_id': 'ID Équipement',
            'usage_type': 'Type d\'utilisation',
            'user_name': 'Utilisateur',
            'notes': 'Notes',
            'timestamp': 'Date/Heure'
        }
        form_columns = ['equipment_id', 'usage_type', 'user_name', 'notes']
        
        def on_model_change(self, form, model, is_created):
            # Mettre à jour le nom d'utilisateur si un utilisateur est connecté
            if current_user.is_authenticated and not model.user_name:
                model.user_name = current_user.username
            super().on_model_change(form, model, is_created)
    
    # Initialisation de l'admin après la configuration
    admin.init_app(app)
    
    # Ajout des vues
    admin.add_view(EquipmentModelView(Equipment, db.session, name='Équipements', category='Données'))
    admin.add_view(UsageModelView(Usage, db.session, name='Utilisations', category='Données'))
    admin.add_view(UserModelView(User, db.session, name='Utilisateurs', category='Administration'))
    
    # Pas besoin d'initialiser api ici car il n'a pas de méthode init_app
