from app import db, login_manager
from flask_login import UserMixin
from datetime import datetime

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(50), primary_key=True)  # UserID (email)
    nom_complet = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # Enseignant, Etudiant, Admin
    
    # Relations
    sessions = db.relationship('Session', backref='enseignant', lazy=True, foreign_keys='Session.user_id_enseignant')
    logs = db.relationship('LogScan', backref='etudiant', lazy=True)
    
    def __init__(self, id, nom_complet, role):
        self.id = id
        self.nom_complet = nom_complet
        self.role = role
    
    def __repr__(self):
        return f'<User {self.nom_complet}>'

# Note: La fonction load_user est maintenant définie dans le contrôleur auth.py
# pour utiliser le service d'authentification Google Sheets
