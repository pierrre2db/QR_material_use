import os
import json
from datetime import datetime
from flask import current_app
from models_sqlalchemy import Equipment, Usage
from extensions import db

def migrate_data():
    """Migre les données des fichiers JSON vers la base de données."""
    # Vérifier si la migration a déjà été faite
    if not os.path.exists(current_app.config['EQUIPMENTS_JSON']) or \
       not os.path.exists(current_app.config['USAGES_JSON']):
        return False
        
    try:
        # Charger les données existantes
        with open(current_app.config['EQUIPMENTS_JSON'], 'r') as f:
            equipments_data = json.load(f)
        
        with open(current_app.config['USAGES_JSON'], 'r') as f:
            usages_data = json.load(f)
        
        # Migrer les équipements
        for eq in equipments_data:
            equipment = Equipment.query.filter_by(qr_code=eq.get('qr_code')).first()
            if not equipment:
                equipment = Equipment(
                    qr_code=eq.get('qr_code'),
                    name=eq.get('name'),
                    description=eq.get('description', ''),
                    status=eq.get('status', 'disponible')
                )
                db.session.add(equipment)
        
        db.session.commit()  # Premier commit pour les équipements
        
        # Migrer les usages
        for usage in usages_data:
            # Vérifier si l'équipement existe
            equipment = Equipment.query.filter_by(qr_code=usage.get('equipment_id')).first()
            if equipment:
                new_usage = Usage(
                    equipment_id=equipment.id,
                    usage_type=usage.get('type', 'scan'),
                    user=usage.get('user'),
                    notes=usage.get('notes'),
                    timestamp=datetime.fromisoformat(usage['timestamp']) if 'timestamp' in usage else datetime.utcnow()
                )
                db.session.add(new_usage)
        
        db.session.commit()  # Deuxième commit pour les usages
        
        # Renommer les anciens fichiers pour éviter une nouvelle migration
        os.rename(current_app.config['EQUIPMENTS_JSON'], f"{current_app.config['EQUIPMENTS_JSON']}.bak")
        os.rename(current_app.config['USAGES_JSON'], f"{current_app.config['USAGES_JSON']}.bak")
        
        current_app.logger.info("Migration des données terminée avec succès")
        return True
        
    except Exception as e:
        current_app.logger.error(f"Erreur lors de la migration des données: {e}")
        db.session.rollback()
        return False
