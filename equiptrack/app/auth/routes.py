from flask import render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash

from app import db
from app.models import User
from . import bp

@bp.route('/login', methods=['GET', 'POST'])
def login():
    """Gère la connexion des utilisateurs."""
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = True if request.form.get('remember') else False
        
        user = User.query.filter_by(username=username).first()
        
        # Vérifier si l'utilisateur existe et que le mot de passe est correct
        if not user or not check_password_hash(user.password_hash, password):
            flash('Veuillez vérifier vos identifiants et réessayer.', 'danger')
            return redirect(url_for('auth.login'))
        
        # Connecter l'utilisateur
        login_user(user, remember=remember)
        
        # Rediriger vers la page demandée ou la page d'accueil
        next_page = request.args.get('next')
        return redirect(next_page or url_for('main.index'))
    
    return render_template('auth/login.html')

@bp.route('/logout')
@login_required
def logout():
    """Déconnecte l'utilisateur actuel."""
    logout_user()
    return redirect(url_for('main.index'))

@bp.route('/register', methods=['GET', 'POST'])
def register():
    """Gère l'inscription des nouveaux utilisateurs."""
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        # Vérifier si l'utilisateur existe déjà
        user = User.query.filter((User.username == username) | 
                               (User.email == email)).first()
        
        if user:
            flash('Un utilisateur avec ce nom d\'utilisateur ou cet email existe déjà.', 'warning')
            return redirect(url_for('auth.register'))
        
        # Créer un nouvel utilisateur
        new_user = User(
            username=username,
            email=email,
            is_admin=False
        )
        new_user.set_password(password)
        
        # Ajouter à la base de données
        db.session.add(new_user)
        db.session.commit()
        
        flash('Votre compte a été créé avec succès ! Vous pouvez maintenant vous connecter.', 'success')
        return redirect(url_for('auth.login'))
    
    return render_template('auth/register.html')
