from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required, current_user
from app.models import Equipment
from app import db
import qrcode
from io import BytesIO
import base64

equipment = Blueprint('equipment', __name__)

@equipment.route('/equipments')
@login_required
def list_equipments():
    if current_user.role not in ['Admin', 'Enseignant']:
        flash('Accès non autorisé.', 'danger')
        return redirect(url_for('main.dashboard'))
    
    equipments = Equipment.query.all()
    return render_template('equipment/list.html', equipments=equipments)

@equipment.route('/equipments/add', methods=['GET', 'POST'])
@login_required
def add_equipment():
    if current_user.role != 'Admin':
        flash('Seuls les administrateurs peuvent ajouter des équipements.', 'danger')
        return redirect(url_for('equipment.list_equipments'))
    
    if request.method == 'POST':
        equipment_id = request.form.get('equipment_id')
        nom_salle = request.form.get('nom_salle')
        type_equipement = request.form.get('type_equipement')
        
        # Générer une donnée unique pour le QR code statique
        ecole = "EAFC-TIC"  # Nom de l'école à inclure dans le QR code
        qr_code_data = f"{ecole}_{equipment_id}_{type_equipement}_{nom_salle}"
        
        # Vérifier si l'ID est déjà utilisé
        existing_equipment = Equipment.query.get(equipment_id)
        if existing_equipment:
            flash('Cet ID d\'équipement existe déjà.', 'danger')
            return render_template('equipment/add.html')
        
        # Créer le nouvel équipement
        new_equipment = Equipment(
            id=equipment_id,
            nom_salle=nom_salle,
            type_equipement=type_equipement,
            qr_code_statique_data=qr_code_data
        )
        
        db.session.add(new_equipment)
        db.session.commit()
        
        flash('Équipement ajouté avec succès.', 'success')
        return redirect(url_for('equipment.list_equipments'))
    
    return render_template('equipment/add.html')

@equipment.route('/equipments/<equipment_id>')
@login_required
def view_equipment(equipment_id):
    if current_user.role not in ['Admin', 'Enseignant']:
        flash('Accès non autorisé.', 'danger')
        return redirect(url_for('main.dashboard'))
    
    equipment = Equipment.query.get_or_404(equipment_id)
    
    # Générer le QR code pour l'affichage
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(equipment.qr_code_statique_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convertir l'image en base64 pour l'affichage HTML
    buffered = BytesIO()
    img.save(buffered)
    qr_code_img = base64.b64encode(buffered.getvalue()).decode()
    
    return render_template('equipment/view.html', equipment=equipment, qr_code_img=qr_code_img)

@equipment.route('/equipments/<equipment_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_equipment(equipment_id):
    if current_user.role != 'Admin':
        flash('Seuls les administrateurs peuvent modifier des équipements.', 'danger')
        return redirect(url_for('equipment.list_equipments'))
    
    equipment = Equipment.query.get_or_404(equipment_id)
    
    if request.method == 'POST':
        equipment.nom_salle = request.form.get('nom_salle')
        equipment.type_equipement = request.form.get('type_equipement')
        
        # Mettre à jour la donnée du QR code statique
        ecole = "EAFC-TIC"  # Nom de l'école à inclure dans le QR code
        equipment.qr_code_statique_data = f"{ecole}_{equipment.id}_{equipment.type_equipement}_{equipment.nom_salle}"
        
        db.session.commit()
        
        flash('Équipement mis à jour avec succès.', 'success')
        return redirect(url_for('equipment.view_equipment', equipment_id=equipment.id))
    
    return render_template('equipment/edit.html', equipment=equipment)

@equipment.route('/equipments/<equipment_id>/delete', methods=['POST'])
@login_required
def delete_equipment(equipment_id):
    if current_user.role != 'Admin':
        flash('Seuls les administrateurs peuvent supprimer des équipements.', 'danger')
        return redirect(url_for('equipment.list_equipments'))
    
    equipment = Equipment.query.get_or_404(equipment_id)
    
    # Vérifier si l'équipement est utilisé dans des sessions
    if equipment.sessions:
        flash('Impossible de supprimer cet équipement car il est utilisé dans des sessions.', 'danger')
        return redirect(url_for('equipment.view_equipment', equipment_id=equipment.id))
    
    db.session.delete(equipment)
    db.session.commit()
    
    flash('Équipement supprimé avec succès.', 'success')
    return redirect(url_for('equipment.list_equipments'))

@equipment.route('/api/equipments')
@login_required
def api_list_equipments():
    equipments = Equipment.query.all()
    result = []
    
    for eq in equipments:
        result.append({
            'id': eq.id,
            'nom_salle': eq.nom_salle,
            'type_equipement': eq.type_equipement,
            'qr_code_data': eq.qr_code_statique_data
        })
    
    return jsonify(result)
