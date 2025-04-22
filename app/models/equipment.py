from app import db
from datetime import datetime

class Equipment(db.Model):
    __tablename__ = 'equipments'
    
    id = db.Column(db.String(20), primary_key=True)  # EquipementID
    nom_salle = db.Column(db.String(50), nullable=False)
    type_equipement = db.Column(db.String(50), nullable=False)
    qr_code_statique_data = db.Column(db.String(100), unique=True, nullable=False)
    
    # Relations
    sessions = db.relationship('Session', backref='equipement', lazy=True)
    
    def __repr__(self):
        return f'<Equipment {self.id}: {self.type_equipement} in {self.nom_salle}>'
