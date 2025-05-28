from flask import jsonify, request, url_for, current_app
from flask_login import login_required, current_user
from app import db
from app.models import User, Equipment, Usage
from . import bp
from datetime import datetime

@bp.route('/equipment', methods=['GET'])
@login_required
def get_equipment():
    """Récupère la liste des équipements avec pagination."""
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 10, type=int), 100)
    
    # Filtres
    status = request.args.get('status')
    search = request.args.get('search')
    
    query = Equipment.query
    
    if status:
        query = query.filter_by(status=status)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Equipment.name.ilike(search_term)) |
            (Equipment.description.ilike(search_term)) |
            (Equipment.qr_code.ilike(search_term))
        )
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    equipment = pagination.items
    
    return jsonify({
        'items': [item.to_dict() for item in equipment],
        '_meta': {
            'page': page,
            'per_page': per_page,
            'total_pages': pagination.pages,
            'total_items': pagination.total
        }
    })

@bp.route('/equipment/<qr_code>', methods=['GET'])
@login_required
def get_equipment_item(qr_code):
    """Récupère les détails d'un équipement spécifique."""
    equipment = Equipment.query.filter_by(qr_code=qr_code).first_or_404()
    return jsonify(equipment.to_dict(include_usages=True))

@bp.route('/equipment/scan', methods=['POST'])
@login_required
def scan_equipment():
    """
    Enregistre une action sur un équipement.
    
    Actions possibles (V1.0):
    - scan: Enregistre un scan simple
    - debut_maintenance: Marque l'équipement comme en maintenance
    - fin_maintenance: Remet l'équipement comme disponible
    """
    data = request.get_json() or {}
    
    if 'qr_code' not in data or 'action' not in data:
        return jsonify({'error': 'Code équipement et action sont requis'}), 400
    
    # Vérifier que l'action est valide pour la V1.0
    valid_actions = ['scan', 'debut_maintenance', 'fin_maintenance']
    if data['action'] not in valid_actions:
        return jsonify({'error': f'Action non valide. Actions autorisées: {valid_actions}'}), 400
    
    equipment = Equipment.query.filter_by(qr_code=data['qr_code']).first()
    if not equipment:
        return jsonify({'error': 'Équipement non trouvé'}), 404
    
    # Mettre à jour le statut de l'équipement si nécessaire
    if data['action'] == 'debut_maintenance':
        equipment.status = Equipment.STATUS_MAINTENANCE
    elif data['action'] == 'fin_maintenance':
        equipment.status = Equipment.STATUS_AVAILABLE
    
    # Créer une nouvelle entrée d'utilisation
    usage = Usage(
        equipment_id=equipment.id,
        user_id=current_user.id,
        usage_type=data['action'],
        notes=data.get('notes', ''),
        timestamp=datetime.utcnow()
    )
    
    db.session.add(usage)
    db.session.commit()
    
    return jsonify({
        'message': f'Action "{data["action"]}" enregistrée avec succès',
        'equipment': equipment.to_dict()
    }), 201
