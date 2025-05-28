"""
Module d'administration de l'application EquipTrack.
Définit les vues personnalisées pour l'interface d'administration.
"""
from flask import redirect, url_for, flash, request
from flask_admin import AdminIndexView, expose
from flask_admin.contrib.sqla import ModelView
from flask_login import current_user
from wtforms import PasswordField
from sqlalchemy import func

# Import de l'instance de la base de données
from .extensions import db

class SecureAdminIndexView(AdminIndexView):
    """Vue d'administration sécurisée qui nécessite une authentification."""
    
    def is_accessible(self):
        return current_user.is_authenticated and current_user.is_admin
    
    def inaccessible_callback(self, name, **kwargs):
        if not current_user.is_authenticated:
            return redirect(url_for('auth.login', next=request.url))
        flash("Vous n'êtes pas autorisé à accéder à cette page.", 'error')
        return redirect(url_for('main.index'))

class UserModelView(ModelView):
    """Vue d'administration simplifiée pour les utilisateurs."""
    
    # Configuration de base
    page_size = 20
    can_view_details = True
    
    # Colonnes à afficher
    column_list = ['username', 'email', 'role', 'is_active']
    column_searchable_list = ['username', 'email']
    column_sortable_list = ['username', 'email', 'created_at']
    
    # Configuration des formulaires
    form_columns = ['username', 'email', 'password', 'role', 'is_active']
    form_extra_fields = {
        'password': PasswordField('Nouveau mot de passe')
    }
    
    # Configuration des filtres
    column_filters = ['role', 'is_active']
    
    # Désactiver certaines fonctionnalités avancées qui posent problème
    can_export = False
    can_create = True
    can_edit = True
    can_delete = True
    column_display_pk = False
    
    # Préfixe pour les routes d'administration
    route_base = 'admin/user'
    
    def is_accessible(self):
        return current_user.is_authenticated and current_user.is_admin
    
    def on_model_change(self, form, model, is_created):
        """Gère la modification d'un utilisateur."""
        if 'password' in form and form.password.data:
            model.set_password(form.password.data)
        return super().on_model_change(form, model, is_created)

class EquipmentModelView(ModelView):
    """Vue d'administration pour les équipements."""
    
    # Configuration de base
    page_size = 20
    can_view_details = True
    
    # Colonnes à afficher
    column_list = ['qr_code', 'name', 'description', 'status', 'created_at']
    column_searchable_list = ['qr_code', 'name', 'description']
    column_sortable_list = ['name', 'status', 'created_at']
    
    # Configuration des formulaires
    form_columns = ['qr_code', 'name', 'description', 'status']
    
    # Préfixe pour les routes d'administration
    route_base = 'admin/equipment'
    
    def is_accessible(self):
        return current_user.is_authenticated and current_user.is_admin

class UsageModelView(ModelView):
    """Vue d'administration pour les utilisations."""
    
    # Configuration de base
    page_size = 20
    can_view_details = True
    
    # Colonnes personnalisées
    column_list = ['equipment_id', 'user_name', 'usage_type', 'timestamp']
    column_searchable_list = ['equipment_id', 'user_name']
    column_sortable_list = ['timestamp', 'usage_type']
    
    # Configuration des formulaires
    form_columns = ['equipment_id', 'user_id', 'usage_type', 'notes']
    
    # Configuration des filtres
    column_filters = ['usage_type', 'timestamp']
    
    # Préfixe pour les routes d'administration
    route_base = 'admin/usage'
    
    # Désactiver la création et la modification via l'interface d'administration
    can_create = False
    can_edit = False
    can_delete = False
    
    def is_accessible(self):
        return current_user.is_authenticated and current_user.is_admin
    
    def on_model_change(self, form, model, is_created):
        """Met à jour le nom d'utilisateur lors de la création/modification."""
        from .models import User
        if model.user_id:
            user = User.query.get(model.user_id)
            if user:
                model.user_name = user.username
        return super().on_model_change(form, model, is_created)
    
    def get_query(self):
        """Surcharge pour personnaliser la requête."""
        return super().get_query().order_by(self.model.timestamp.desc())
    
    def get_count_query(self):
        """Surcharge pour optimiser le comptage."""
        return self.session.query(func.count('*')).select_from(self.model)

def init_admin(admin_instance):
    """Initialise les vues d'administration.
    
    Args:
        admin_instance: Instance de Flask-Admin
    """
    from .models import User, Equipment, Usage
    from .extensions import db
    
    # Ajout des vues personnalisées à l'interface d'administration
    admin_instance.add_view(UserModelView(User, db.session, name='Utilisateurs', category='Administration'))
    admin_instance.add_view(EquipmentModelView(Equipment, db.session, name='Équipements', category='Données'))
    admin_instance.add_view(UsageModelView(Usage, db.session, name='Utilisations', category='Données'))
    
    # Personnalisation de l'interface
    admin_instance.index_view.title = 'Tableau de bord'
    admin_instance.template_mode = 'bootstrap4'
    
    # Suppression de la ligne problématique qui tentait de désactiver la vue par défaut
    # La vue par défaut est déjà correctement configurée via SecureAdminIndexView
