from flask import render_template, redirect, url_for, flash, request, current_app
from flask_login import login_required, current_user
from app import db
from app.models import User, Equipment, Usage
from datetime import datetime

from . import bp

@bp.route('/')
@bp.route('/index')
@login_required
def index():
    """Page d'accueil de l'application."""
    # Récupérer les statistiques de base
    stats = {
        'total_equipment': Equipment.query.count(),
        'available_equipment': Equipment.query.filter_by(status='disponible').count(),
        'borrowed_equipment': Equipment.query.filter_by(status='emprunté').count(),
        'maintenance_equipment': Equipment.query.filter_by(status='maintenance').count()
    }
    
    # Dernières activités
    recent_usages = Usage.query.order_by(Usage.timestamp.desc()).limit(5).all()
    
    return render_template('index.html', 
                         title='Tableau de bord',
                         stats=stats,
                         recent_usages=recent_usages)
