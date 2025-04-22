from app import db
from datetime import datetime
import uuid

class LogScan(db.Model):
    __tablename__ = 'logs_scans_etudiants'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))  # LogID
    timestamp_scan = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    session_id = db.Column(db.String(36), db.ForeignKey('sessions.id'), nullable=False)
    user_id_etudiant = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False)
    
    def __repr__(self):
        return f'<LogScan {self.id}: Student {self.user_id_etudiant} in Session {self.session_id}>'
