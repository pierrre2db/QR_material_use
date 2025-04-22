from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for, flash
from flask_login import login_required, current_user
from app.models import Session, Equipment, LogScan, User
from app import db
from datetime import datetime
import uuid

scan = Blueprint('scan', __name__)

@scan.route('/mobile-scan')
def mobile_scan():
    """Page de scan mobile pour les étudiants"""
    return render_template('scan/mobile_scan.html')

@scan.route('/scan-guide')
def scan_guide():
    """Guide d'utilisation pour le scan QR code"""
    return render_template('scan/scan_guide.html')

@scan.route('/teacher-scan')
@login_required
def teacher_scan():
    """Page de scan pour les enseignants"""
    if current_user.role not in ['Admin', 'Enseignant']:
        flash("Vous n'avez pas accès à cette fonctionnalité.", 'danger')
        return redirect(url_for('main.dashboard'))
    
    return render_template('scan/teacher_scan.html')

@scan.route('/api/scan-equipment', methods=['POST'])
@login_required
def scan_equipment():
    """API pour traiter le scan d'un équipement par un enseignant et créer une session"""
    if current_user.role not in ['Admin', 'Enseignant']:
        return jsonify({
            'success': False,
            'message': "Vous n'avez pas les droits pour créer une session."
        })
    
    data = request.json
    qr_code = data.get('qr_code')
    
    if not qr_code:
        return jsonify({
            'success': False,
            'message': 'Aucun QR code détecté.'
        })
    
    # Vérifier si le QR code correspond à un équipement
    equipment = Equipment.query.filter_by(qr_code_statique_data=qr_code).first()
    
    if not equipment:
        return jsonify({
            'success': False,
            'message': 'Équipement non reconnu. Veuillez scanner un QR code valide.'
        })
    
    # Vérifier s'il existe déjà une session active pour cet équipement et cet enseignant
    existing_session = Session.query.filter_by(
        equipment_id=equipment.id,
        user_id_enseignant=current_user.id,
        actif=True
    ).first()
    
    if existing_session:
        # Utiliser la session existante
        return jsonify({
            'success': True,
            'message': f'Session existante trouvée pour {equipment.type_equipement} ({equipment.nom_salle}).',
            'session_id': existing_session.id
        })
    
    # Créer une nouvelle session
    session_id = str(uuid.uuid4())
    qr_code_data = f"SESSION_{session_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    
    new_session = Session(
        id=session_id,
        nom_session=f"Session {equipment.type_equipement} - {datetime.utcnow().strftime('%d/%m/%Y %H:%M')}",
        equipment_id=equipment.id,
        user_id_enseignant=current_user.id,
        timestamp_debut=datetime.utcnow(),
        actif=True,
        qr_code_dynamique_data=qr_code_data
    )
    
    db.session.add(new_session)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'Nouvelle session créée pour {equipment.type_equipement} ({equipment.nom_salle}).',
        'session_id': new_session.id
    })

@scan.route('/api/scan', methods=['POST'])
def process_scan():
    """API pour traiter les scans de QR codes"""
    data = request.json
    qr_code = data.get('qr_code')
    
    if not qr_code:
        return jsonify({
            'success': False,
            'message': 'Aucun QR code détecté.'
        })
    
    # Vérifier si le QR code correspond à une session active
    session_obj = Session.query.filter_by(qr_code_dynamique_data=qr_code, actif=True).first()
    
    if session_obj:
        # Si l'utilisateur est connecté, enregistrer le scan
        if current_user.is_authenticated:
            # Vérifier si l'utilisateur a déjà scanné cette session
            existing_scan = LogScan.query.filter_by(
                session_id=session_obj.id,
                user_id_etudiant=current_user.id
            ).first()
            
            if existing_scan:
                return jsonify({
                    'success': True,
                    'message': f'Vous avez déjà scanné cette session ({session_obj.nom_session}).'
                })
            
            # Enregistrer le nouveau scan
            log_scan = LogScan(
                session_id=session_obj.id,
                user_id_etudiant=current_user.id,
                timestamp=datetime.utcnow()
            )
            db.session.add(log_scan)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': f'Scan enregistré pour la session: {session_obj.nom_session}'
            })
        else:
            # Si l'utilisateur n'est pas connecté, stocker temporairement le QR code dans la session
            session['pending_scan'] = qr_code
            
            return jsonify({
                'success': True,
                'message': 'Session détectée. Veuillez vous connecter pour enregistrer votre présence.',
                'redirect': '/login?next=/confirm-scan'
            })
    
    # Vérifier si le QR code correspond à un équipement (QR code statique)
    equipment = Equipment.query.filter_by(qr_code_statique_data=qr_code).first()
    
    if equipment:
        return jsonify({
            'success': True,
            'message': f'Équipement détecté: {equipment.nom_salle} - {equipment.type_equipement}',
            'equipment_id': equipment.id
        })
    
    # Si le QR code ne correspond à rien
    return jsonify({
        'success': False,
        'message': 'QR code non reconnu. Veuillez scanner un QR code valide.'
    })

@scan.route('/confirm-scan')
@login_required
def confirm_scan():
    """Confirme un scan en attente après connexion"""
    if 'pending_scan' in session:
        qr_code = session.pop('pending_scan')
        
        # Vérifier si le QR code correspond à une session active
        session_obj = Session.query.filter_by(qr_code_dynamique_data=qr_code, actif=True).first()
        
        if session_obj:
            # Vérifier si l'utilisateur a déjà scanné cette session
            existing_scan = LogScan.query.filter_by(
                session_id=session_obj.id,
                user_id_etudiant=current_user.id
            ).first()
            
            if existing_scan:
                flash(f'Vous avez déjà scanné cette session ({session_obj.nom_session}).', 'info')
                return render_template('scan/scan_success.html', 
                                      message=f'Vous avez déjà scanné cette session ({session_obj.nom_session}).',
                                      session=session_obj)
            
            # Enregistrer le nouveau scan
            log_scan = LogScan(
                session_id=session_obj.id,
                user_id_etudiant=current_user.id,
                timestamp=datetime.utcnow()
            )
            db.session.add(log_scan)
            db.session.commit()
            
            flash(f'Scan enregistré pour la session: {session_obj.nom_session}', 'success')
            return render_template('scan/scan_success.html', 
                                  message=f'Scan enregistré pour la session: {session_obj.nom_session}',
                                  session=session_obj)
        
        # Si le QR code ne correspond pas à une session active
        flash('QR code non reconnu ou session inactive.', 'danger')
        return render_template('scan/scan_error.html', 
                              message='QR code non reconnu ou session inactive.')
    
    # Si aucun scan en attente
    flash('Aucun scan en attente.', 'warning')
    return redirect(url_for('scan.mobile_scan'))

@scan.route('/scan-success')
def scan_success():
    """Page de succès après un scan"""
    message = request.args.get('message', 'Scan réussi!')
    return render_template('scan/scan_success.html', message=message)

@scan.route('/scan-error')
def scan_error():
    """Page d'erreur après un scan"""
    message = request.args.get('message', 'Une erreur est survenue lors du scan.')
    return render_template('scan/scan_error.html', message=message)
