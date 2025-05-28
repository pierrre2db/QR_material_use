from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

# Initialisation de l'extension SQLAlchemy
db = SQLAlchemy()

class Equipment(db.Model):
    """Modèle pour les équipements."""
    __tablename__ = 'equipments'
    
    id = db.Column(db.Integer, primary_key=True)
    qr_code = db.Column(db.String(6), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='disponible')  # disponible, maintenance, hors_service
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relation avec les usages
    usages = db.relationship('Usage', backref='equipment', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'qr_code': self.qr_code,
            'name': self.name,
            'description': self.description,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Usage(db.Model):
    """Modèle pour le suivi des utilisations."""
    __tablename__ = 'usages'
    
    id = db.Column(db.Integer, primary_key=True)
    equipment_id = db.Column(db.Integer, db.ForeignKey('equipments.id'), nullable=False)
    usage_type = db.Column(db.String(20), nullable=False)  # scan, emprunt, retour, maintenance
    user = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'equipment_id': self.equipment_id,
            'usage_type': self.usage_type,
            'user': self.user,
            'notes': self.notes,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
