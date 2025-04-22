from flask import Blueprint, render_template, redirect, url_for, flash, request, session
from flask_login import login_user, logout_user, login_required, current_user
from app.models import User
from app import db, login_manager
from app.services.auth_service import AuthService
import os
import json

auth = Blueprint('auth', __name__)
auth_service = AuthService()

@login_manager.user_loader
def load_user(user_id):
    # Récupérer l'utilisateur depuis Google Sheets
    user_data = auth_service.get_user_by_id(user_id)
    if user_data:
        # Créer un objet User à partir des données
        return User(
            id=user_data['id'],
            nom_complet=user_data['nom_complet'],
            role=user_data['role']
        )
    return None

@auth.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password', '1234')  # Par défaut '1234'
        
        # Authentifier l'utilisateur via le service
        user_data = auth_service.authenticate_user(email, password)
        
        if user_data:
            # Créer un objet User pour Flask-Login
            user = User(
                id=user_data['id'],
                nom_complet=user_data['nom_complet'],
                role=user_data['role']
            )
            
            # Stocker les données utilisateur dans la session
            session['user_data'] = {
                'id': user_data['id'],
                'nom_complet': user_data['nom_complet'],
                'role': user_data['role']
            }
            
            login_user(user)
            next_page = request.args.get('next')
            
            # Rediriger en fonction du rôle
            if user.role == 'Admin':
                return redirect(next_page or url_for('equipment.list_equipments'))
            elif user.role == 'Enseignant':
                return redirect(next_page or url_for('session.list_sessions'))
            else:  # Étudiant
                return redirect(next_page or url_for('main.dashboard'))
        else:
            flash('Identifiants incorrects. Veuillez réessayer.', 'danger')
    
    # Pour le développement, afficher la liste des utilisateurs disponibles
    try:
        # Essayer de charger les utilisateurs de test depuis le fichier JSON
        if os.path.exists('data/test_users.json'):
            with open('data/test_users.json', 'r') as f:
                users = json.load(f)
        else:
            # Sinon, récupérer depuis Google Sheets
            users = auth_service.get_users()
            
            # Si aucun utilisateur n'est trouvé, créer des utilisateurs de test
            if not users:
                users = auth_service.create_test_users_file()
    except:
        users = []
    
    return render_template('auth/login.html', users=users)

@auth.route('/auto-login/<role>')
def auto_login(role):
    """Connexion automatique en fonction du rôle pour le développement"""
    users = auth_service.get_users()
    
    user_data = None
    for user in users:
        if user['role'].lower() == role.lower() or (role == 'admin' and user['role'] == 'Admin') or (role == 'teacher' and user['role'] == 'Enseignant') or (role == 'student' and user['role'] == 'Etudiant'):
            user_data = user
            break
    
    if user_data:
        user = User(
            id=user_data['id'],
            nom_complet=user_data['nom_complet'],
            role=user_data['role']
        )
        
        # Stocker les données utilisateur dans la session
        session['user_data'] = {
            'id': user_data['id'],
            'nom_complet': user_data['nom_complet'],
            'role': user_data['role']
        }
        
        # Forcer la connexion de l'utilisateur avec remember=True
        login_user(user, remember=True, force=True)
        
        # Rediriger directement vers la page appropriée en fonction du rôle
        if user.role == 'Admin':
            return redirect(url_for('equipment.list_equipments'))
        elif user.role == 'Enseignant':
            return redirect(url_for('session.list_sessions'))
        else:  # Étudiant
            return redirect(url_for('main.dashboard'))
    else:
        flash(f'Aucun utilisateur avec le rôle {role} trouvé.', 'danger')
        return redirect(url_for('auth.login'))

@auth.route('/logout')
@login_required
def logout():
    logout_user()
    # Nettoyer la session
    session.pop('user_data', None)
    flash('Vous avez été déconnecté.', 'info')
    return redirect(url_for('auth.login'))

@auth.route('/test-users')
def test_users():
    """Crée et affiche les utilisateurs de test"""
    users = auth_service.create_test_users_file()
    return render_template('auth/test_users.html', users=users)
