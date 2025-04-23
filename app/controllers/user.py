from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required, current_user
from app.models import User
from app import db
from app.services.auth_service import AuthService

user = Blueprint('user', __name__)
auth_service = AuthService()

@user.route('/users')
@login_required
def list_users():
    """Liste tous les utilisateurs (accessible uniquement aux administrateurs)"""
    if current_user.role != 'Admin':
        flash("Vous n'avez pas les droits pour accéder à cette page.", 'danger')
        return redirect(url_for('main.dashboard'))
    
    # Récupérer tous les utilisateurs
    users = auth_service.get_users(force_refresh=True)
    
    # Trier les utilisateurs par rôle puis par nom
    users.sort(key=lambda x: (x['role'] != 'Admin', x['role'] != 'Enseignant', x['role'] != 'Etudiant', x['nom_complet']))
    
    return render_template('user/list.html', users=users)

@user.route('/users/create', methods=['GET', 'POST'])
@login_required
def create_user():
    """Crée un nouvel utilisateur (accessible uniquement aux administrateurs)"""
    if current_user.role != 'Admin':
        flash("Vous n'avez pas les droits pour accéder à cette page.", 'danger')
        return redirect(url_for('main.dashboard'))
    
    if request.method == 'POST':
        # Récupérer les données du formulaire
        email = request.form.get('email')
        nom_complet = request.form.get('nom_complet')
        role = request.form.get('role')
        password = request.form.get('password', '1234')  # Mot de passe par défaut : 1234
        
        # Valider les données
        if not email or not nom_complet or not role:
            flash("Tous les champs sont obligatoires.", 'danger')
            return render_template('user/create.html')
        
        # Créer l'utilisateur
        success, message = auth_service.create_user(email, nom_complet, role, password)
        
        if success:
            flash(message, 'success')
            return redirect(url_for('user.list_users'))
        else:
            flash(message, 'danger')
            return render_template('user/create.html')
    
    return render_template('user/create.html')

@user.route('/users/<user_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_user(user_id):
    """Modifie un utilisateur existant (accessible uniquement aux administrateurs)"""
    if current_user.role != 'Admin':
        flash("Vous n'avez pas les droits pour accéder à cette page.", 'danger')
        return redirect(url_for('main.dashboard'))
    
    # Récupérer l'utilisateur
    user_data = auth_service.get_user_by_id(user_id)
    
    if not user_data:
        flash("Utilisateur non trouvé.", 'danger')
        return redirect(url_for('user.list_users'))
    
    if request.method == 'POST':
        # Récupérer les données du formulaire
        nom_complet = request.form.get('nom_complet')
        role = request.form.get('role')
        password = request.form.get('password')
        
        # Valider les données
        if not nom_complet or not role:
            flash("Le nom complet et le rôle sont obligatoires.", 'danger')
            return render_template('user/edit.html', user=user_data)
        
        # Mettre à jour l'utilisateur
        success, message = auth_service.update_user(
            user_id,
            nom_complet=nom_complet,
            role=role,
            password=password if password else None
        )
        
        if success:
            flash(message, 'success')
            return redirect(url_for('user.list_users'))
        else:
            flash(message, 'danger')
            return render_template('user/edit.html', user=user_data)
    
    return render_template('user/edit.html', user=user_data)

@user.route('/users/<user_id>/delete', methods=['POST'])
@login_required
def delete_user(user_id):
    """Supprime un utilisateur (accessible uniquement aux administrateurs)"""
    if current_user.role != 'Admin':
        flash("Vous n'avez pas les droits pour accéder à cette page.", 'danger')
        return redirect(url_for('main.dashboard'))
    
    # Empêcher la suppression de son propre compte
    if user_id == current_user.id:
        flash("Vous ne pouvez pas supprimer votre propre compte.", 'danger')
        return redirect(url_for('user.list_users'))
    
    # Supprimer l'utilisateur
    success, message = auth_service.delete_user(user_id)
    
    if success:
        flash(message, 'success')
    else:
        flash(message, 'danger')
    
    return redirect(url_for('user.list_users'))

@user.route('/api/users', methods=['GET'])
@login_required
def api_list_users():
    """API pour récupérer la liste des utilisateurs (accessible uniquement aux administrateurs)"""
    if current_user.role != 'Admin':
        return jsonify({'success': False, 'message': "Accès non autorisé"}), 403
    
    # Récupérer tous les utilisateurs
    users = auth_service.get_users(force_refresh=True)
    
    # Supprimer les mots de passe des données renvoyées
    for user in users:
        if 'password' in user:
            del user['password']
        if 'password_hash' in user:
            del user['password_hash']
    
    return jsonify({'success': True, 'users': users})

@user.route('/api/users/<role>', methods=['GET'])
@login_required
def api_list_users_by_role(role):
    """API pour récupérer la liste des utilisateurs par rôle (accessible aux administrateurs et enseignants)"""
    if current_user.role not in ['Admin', 'Enseignant']:
        return jsonify({'success': False, 'message': "Accès non autorisé"}), 403
    
    # Vérifier si le rôle est valide
    valid_roles = ["Admin", "Enseignant", "Etudiant"]
    if role not in valid_roles:
        return jsonify({'success': False, 'message': f"Rôle invalide. Doit être l'un des suivants : {', '.join(valid_roles)}"}), 400
    
    # Récupérer les utilisateurs par rôle
    users = auth_service.get_users_by_role(role)
    
    # Supprimer les mots de passe des données renvoyées
    for user in users:
        if 'password' in user:
            del user['password']
        if 'password_hash' in user:
            del user['password_hash']
    
    return jsonify({'success': True, 'users': users})
