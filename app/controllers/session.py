from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, send_file, make_response
from flask_login import login_required, current_user
from app.models import Session, Equipment, LogScan, User
from app import db
import qrcode
from io import BytesIO
import base64
import uuid
from datetime import datetime

session = Blueprint('session', __name__)

@session.route('/sessions')
@login_required
def list_sessions():
    if current_user.role == 'Admin':
        # Les admins voient toutes les sessions
        sessions = Session.query.order_by(Session.timestamp_debut.desc()).all()
    elif current_user.role == 'Enseignant':
        # Les enseignants voient leurs propres sessions
        sessions = Session.query.filter_by(user_id_enseignant=current_user.id).order_by(Session.timestamp_debut.desc()).all()
    else:
        # Les étudiants voient les sessions auxquelles ils ont participé
        student_logs = LogScan.query.filter_by(user_id_etudiant=current_user.id).all()
        session_ids = [log.session_id for log in student_logs]
        sessions = Session.query.filter(Session.id.in_(session_ids)).order_by(Session.timestamp_debut.desc()).all()
    
    return render_template('session/list.html', sessions=sessions)

@session.route('/sessions/create', methods=['GET', 'POST'])
@login_required
def create_session():
    if current_user.role not in ['Admin', 'Enseignant']:
        flash('Seuls les enseignants et administrateurs peuvent créer des sessions.', 'danger')
        return redirect(url_for('main.dashboard'))
    
    if request.method == 'POST':
        equipment_id = request.form.get('equipment_id')
        
        # Vérifier si l'équipement existe
        equipment = Equipment.query.get(equipment_id)
        if not equipment:
            flash('Équipement non trouvé.', 'danger')
            return redirect(url_for('session.create_session'))
        
        # Générer un ID unique pour la session
        session_id = str(uuid.uuid4())
        
        # Générer une donnée unique pour le QR code dynamique
        qr_code_data = f"SESSION_{session_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        
        # Créer la nouvelle session
        new_session = Session(
            id=session_id,
            user_id_enseignant=current_user.id,
            equipment_id=equipment_id,
            qr_code_dynamique_data=qr_code_data
        )
        
        db.session.add(new_session)
        db.session.commit()
        
        flash('Session créée avec succès.', 'success')
        return redirect(url_for('session.view_session', session_id=session_id))
    
    # Récupérer la liste des équipements pour le formulaire
    equipments = Equipment.query.all()
    return render_template('session/create.html', equipments=equipments)

@session.route('/sessions/<session_id>')
@login_required
def view_session(session_id):
    session_obj = Session.query.get_or_404(session_id)
    
    # Vérifier les permissions
    if current_user.role == 'Etudiant' and not LogScan.query.filter_by(session_id=session_id, user_id_etudiant=current_user.id).first():
        flash('Vous n\'avez pas accès à cette session.', 'danger')
        return redirect(url_for('session.list_sessions'))
    
    # Récupérer les logs de scan pour cette session
    logs = LogScan.query.filter_by(session_id=session_id).order_by(LogScan.timestamp_scan).all()
    
    return render_template('session/view.html', 
                          session=session_obj, 
                          logs=logs,
                          equipment=session_obj.equipement,
                          teacher=session_obj.enseignant)

@session.route('/sessions/<session_id>/qr-code')
@login_required
def show_qr_code(session_id):
    """Afficher le QR code d'une session"""
    session_obj = Session.query.get_or_404(session_id)
    
    # Vérifier les permissions
    if current_user.role == 'Etudiant':
        flash("Vous n'avez pas accès à cette fonctionnalité.", 'danger')
        return redirect(url_for('main.dashboard'))
    
    # Générer le QR code pour la session
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(session_obj.qr_code_dynamique_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer)
    buffer.seek(0)
    
    qr_code_image = base64.b64encode(buffer.getvalue()).decode()
    
    return render_template('session/qr_code.html', 
                          session=session_obj,
                          qr_code_image=qr_code_image)

@session.route('/sessions/<session_id>/qr-code/download')
@login_required
def download_qr_code(session_id):
    """Télécharger le QR code d'une session"""
    session_obj = Session.query.get_or_404(session_id)
    
    # Vérifier les permissions
    if current_user.role == 'Etudiant':
        flash("Vous n'avez pas accès à cette fonctionnalité.", 'danger')
        return redirect(url_for('main.dashboard'))
    
    # Générer le QR code pour la session
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(session_obj.qr_code_dynamique_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    response = make_response(send_file(
        buffer,
        mimetype='image/png',
        as_attachment=True,
        download_name=f'qr_code_session_{session_obj.nom_session or session_obj.id}.png'
    ))
    
    return response

@session.route('/sessions/<session_id>/close', methods=['POST'])
@login_required
def close_session(session_id):
    """Fermer une session manuellement"""
    if current_user.role not in ['Admin', 'Enseignant']:
        flash("Vous n'avez pas les droits pour fermer cette session.", 'danger')
        return redirect(url_for('main.dashboard'))
    
    session_obj = Session.query.get_or_404(session_id)
    
    # Vérifier que l'enseignant est bien le propriétaire de la session
    if current_user.role == 'Enseignant' and session_obj.user_id_enseignant != current_user.id:
        flash("Vous ne pouvez pas fermer une session que vous n'avez pas créée.", 'danger')
        return redirect(url_for('session.list_sessions'))
    
    # Fermer la session
    session_obj.actif = False
    session_obj.timestamp_fin = datetime.utcnow()
    db.session.commit()
    
    flash(f'La session "{session_obj.nom_session}" a été fermée avec succès.', 'success')
    return redirect(url_for('session.view_session', session_id=session_id))

@session.route('/api/scan', methods=['POST'])
def api_scan():
    """API endpoint pour enregistrer un scan de QR code"""
    qr_data = request.json.get('qr_data')
    user_id = request.json.get('user_id')
    
    if not qr_data or not user_id:
        return jsonify({'success': False, 'message': 'Données manquantes'}), 400
    
    # Vérifier si l'utilisateur existe
    user = User.query.get(user_id)
    if not user:
        return jsonify({'success': False, 'message': 'Utilisateur non trouvé'}), 404
    
    # Déterminer si c'est un QR code statique (équipement) ou dynamique (session)
    if qr_data.startswith('SESSION_'):
        # C'est un scan de session par un étudiant
        session = Session.query.filter_by(qr_code_dynamique_data=qr_data).first()
        if not session:
            return jsonify({'success': False, 'message': 'Session non trouvée'}), 404
        
        # Vérifier si l'étudiant a déjà scanné cette session
        existing_log = LogScan.query.filter_by(session_id=session.id, user_id_etudiant=user_id).first()
        if existing_log:
            return jsonify({'success': False, 'message': 'Vous avez déjà scanné cette session'}), 400
        
        # Enregistrer le scan
        log = LogScan(
            session_id=session.id,
            user_id_etudiant=user_id
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': 'Scan enregistré avec succès',
            'session_info': {
                'id': session.id,
                'equipment': session.equipement.type_equipement,
                'room': session.equipement.nom_salle,
                'teacher': session.enseignant.nom_complet
            }
        })
    else:
        # C'est un scan d'équipement par un enseignant
        if user.role not in ['Admin', 'Enseignant']:
            return jsonify({'success': False, 'message': 'Seuls les enseignants peuvent scanner des équipements'}), 403
        
        equipment = Equipment.query.filter_by(qr_code_statique_data=qr_data).first()
        if not equipment:
            return jsonify({'success': False, 'message': 'Équipement non trouvé'}), 404
        
        # Créer une nouvelle session
        session_id = str(uuid.uuid4())
        qr_code_data = f"SESSION_{session_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        
        new_session = Session(
            id=session_id,
            user_id_enseignant=user_id,
            equipment_id=equipment.id,
            qr_code_dynamique_data=qr_code_data
        )
        
        db.session.add(new_session)
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': 'Session créée avec succès',
            'session_id': session_id,
            'qr_code_data': qr_code_data
        })
