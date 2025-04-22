from app import db
from datetime import datetime
import uuid

class Session(db.Model):
    __tablename__ = 'sessions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))  # SessionID
    nom_session = db.Column(db.String(100), nullable=True)
    timestamp_debut = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    timestamp_fin = db.Column(db.DateTime, nullable=True)  # Timestamp de fin de session
    user_id_enseignant = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False)
    equipment_id = db.Column(db.String(20), db.ForeignKey('equipments.id'), nullable=False)
    qr_code_dynamique_data = db.Column(db.String(100), unique=True, nullable=False)
    actif = db.Column(db.Boolean, default=True)
    
    # Relations
    logs = db.relationship('LogScan', backref='session', lazy=True)
    
    def __repr__(self):
        return f'<Session {self.id}: {self.equipment_id} by {self.user_id_enseignant}>'
