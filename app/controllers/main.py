from flask import Blueprint, render_template, redirect, url_for
from flask_login import login_required, current_user
from app.models import Equipment, Session, LogScan, User

main = Blueprint('main', __name__)

@main.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    return render_template('main/index.html')

@main.route('/dashboard')
@login_required
def dashboard():
    # Afficher différentes informations selon le rôle de l'utilisateur
    if current_user.role == 'Admin':
        equipments = Equipment.query.all()
        users = User.query.all()
        sessions = Session.query.all()
        return render_template('main/admin_dashboard.html', 
                              equipments=equipments, 
                              users=users, 
                              sessions=sessions)
    
    elif current_user.role == 'Enseignant':
        # Pour les enseignants, montrer leurs sessions et les équipements disponibles
        sessions = Session.query.filter_by(user_id_enseignant=current_user.id).all()
        equipments = Equipment.query.all()
        return render_template('main/teacher_dashboard.html', 
                              sessions=sessions, 
                              equipments=equipments)
    
    else:  # Étudiant
        # Pour les étudiants, montrer leurs scans récents
        logs = LogScan.query.filter_by(user_id_etudiant=current_user.id).order_by(LogScan.timestamp_scan.desc()).limit(10).all()
        return render_template('main/student_dashboard.html', logs=logs)

@main.route('/about')
def about():
    return render_template('main/about.html')

@main.route('/help')
def help():
    return render_template('main/help.html')
