from flask import render_template, redirect, url_for, flash, request, current_app
from flask_login import login_required, current_user
from app import db
from app.models import Equipment, Usage
from datetime import datetime
from . import bp

@bp.route('/')
@login_required
def index():
    """Affiche la liste des équipements."""
    try:
        print("Accès à la liste des équipements...")
        page = request.args.get('page', 1, type=int)
        per_page = current_app.config.get('ITEMS_PER_PAGE', 10)
        
        # Récupérer les paramètres de tri et de filtre
        sort_by = request.args.get('sort', 'name')
        status_filter = request.args.get('status', 'all')
        search_query = request.args.get('q', '')
        
        # Construction de la requête de base
        query = Equipment.query
        
        # Application des filtres
        if status_filter != 'all':
            query = query.filter_by(status=status_filter)
        
        if search_query:
            search = f"%{search_query}%"
            query = query.filter(
                (Equipment.name.ilike(search)) |
                (Equipment.description.ilike(search)) |
                (Equipment.qr_code.ilike(search))
            )
        
        # Application du tri
        if sort_by == 'name':
            query = query.order_by(Equipment.name.asc())
        elif sort_by == 'status':
            query = query.order_by(Equipment.status.asc())
        elif sort_by == 'recent':
            query = query.order_by(Equipment.created_at.desc())
        
        # Pagination
        equipment = query.paginate(page=page, per_page=per_page, error_out=False)
        
        print(f"{equipment.total} équipements trouvés")
        return render_template('equipment/list.html',
                            equipment=equipment,
                            sort_by=sort_by,
                            status_filter=status_filter,
                            search_query=search_query)
    except Exception as e:
        print(f"Erreur dans la vue index: {e}")
        flash('Une erreur est survenue lors du chargement des équipements.', 'danger')
        return redirect(url_for('main.index'))

@bp.route('/<qr_code>')
@login_required
def detail(qr_code):
    """Affiche les détails d'un équipement spécifique."""
    try:
        print(f"Accès aux détails de l'équipement {qr_code}...")
        equipment = Equipment.query.filter_by(qr_code=qr_code).first_or_404()
        
        # Récupérer l'historique des utilisations
        usages = Usage.query.filter_by(equipment_id=equipment.id)\
                           .order_by(Usage.timestamp.desc())\
                           .limit(10).all()
        
        return render_template('equipment/detail.html',
                             equipment=equipment,
                             usages=usages)
    except Exception as e:
        print(f"Erreur dans la vue detail: {e}")
        flash('Équipement non trouvé.', 'danger')
        return redirect(url_for('equipment.index'))

@bp.route('/scan', methods=['GET', 'POST'])
@login_required
def scan():
    """Gère le scan d'un code QR d'équipement."""
    try:
        if request.method == 'POST':
            print("Traitement du formulaire de scan...")
            qr_code = request.form.get('qr_code')
            action = request.form.get('action')
            notes = request.form.get('notes', '')
            
            if not qr_code:
                flash('Veuillez saisir un code QR.', 'danger')
                return redirect(url_for('equipment.scan'))
            
            equipment = Equipment.query.filter_by(qr_code=qr_code).first()
            
            if not equipment:
                flash('Équipement non trouvé.', 'danger')
                return redirect(url_for('equipment.scan'))
            
            # Créer une nouvelle entrée d'utilisation
            usage = Usage(
                equipment_id=equipment.id,
                user_id=current_user.id,
                usage_type=action,
                notes=notes,
                timestamp=datetime.utcnow()
            )
            
            # Mettre à jour le statut de l'équipement si nécessaire
            if action in ['borrow', 'return', 'maintenance']:
                equipment.status = action
            
            db.session.add(usage)
            db.session.commit()
            
            flash(f'Action "{action}" enregistrée avec succès pour l\'équipement {equipment.name}.', 'success')
            return redirect(url_for('equipment.detail', qr_code=qr_code))
        
        # Méthode GET - Afficher le formulaire de scan
        return render_template('equipment/scan.html')
    except Exception as e:
        print(f"Erreur dans la vue scan: {e}")
        db.session.rollback()
        flash('Une erreur est survenue lors du traitement de votre demande.', 'danger')
        return redirect(url_for('equipment.index'))
