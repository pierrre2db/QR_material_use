from flask import Blueprint, render_template, jsonify, request, redirect, url_for, flash
from flask_login import login_required, current_user
from extensions import db
from models_sqlalchemy import Equipment, Usage
from datetime import datetime

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    # Récupérer les statistiques
    stats = {
        'total_equipments': Equipment.query.count(),
        'available_equipments': Equipment.query.filter_by(status='disponible').count(),
        'in_use_equipments': Equipment.query.filter(Equipment.status.in_(['emprunté', 'en_maintenance'])).count(),
        'total_usages': Usage.query.count()
    }
    
    # Derniers équipements ajoutés
    recent_equipments = Equipment.query.order_by(Equipment.created_at.desc()).limit(5).all()
    
    # Dernières utilisations
    recent_usages = Usage.query.order_by(Usage.timestamp.desc()).limit(5).all()
    
    return render_template('index.html', 
                         stats=stats, 
                         recent_equipments=recent_equipments,
                         recent_usages=recent_usages)

@main_bp.route('/equipment/<qr_code>')
def view_equipment(qr_code):
    equipment = Equipment.query.filter_by(qr_code=qr_code).first_or_404()
    usages = Usage.query.filter_by(equipment_id=equipment.id).order_by(Usage.timestamp.desc()).all()
    return render_template('equipment/view.html', equipment=equipment, usages=usages)

@main_bp.route('/scan', methods=['GET', 'POST'])
def scan():
    if request.method == 'POST':
        qr_code = request.form.get('qr_code')
        if not qr_code:
            flash('Veuillez saisir ou scanner un code QR', 'error')
            return redirect(url_for('main.scan'))
            
        equipment = Equipment.query.filter_by(qr_code=qr_code).first()
        if not equipment:
            flash('Équipement non trouvé', 'error')
            return redirect(url_for('main.scan'))
            
        # Enregistrer l'utilisation
        usage = Usage(
            equipment_id=equipment.id,
            usage_type='scan',
            user=current_user.get_id() if current_user.is_authenticated else 'Anonyme',
            notes=f'Scan effectué à {datetime.utcnow()}'
        )
        db.session.add(usage)
        db.session.commit()
        
        return redirect(url_for('main.view_equipment', qr_code=qr_code))
    
    return render_template('scan/scan.html')
