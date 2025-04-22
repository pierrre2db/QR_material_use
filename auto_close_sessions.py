from app import create_app, db
from app.models import Session
from datetime import datetime, timedelta

app = create_app()

def close_old_sessions():
    """Ferme automatiquement les sessions actives depuis plus d'une heure"""
    with app.app_context():
        # Calculer la date limite (1 heure dans le passé)
        time_limit = datetime.utcnow() - timedelta(hours=1)
        
        # Trouver toutes les sessions actives qui ont été créées il y a plus d'une heure
        old_sessions = Session.query.filter(
            Session.actif == True,
            Session.timestamp_debut < time_limit
        ).all()
        
        if not old_sessions:
            print("Aucune session à fermer automatiquement.")
            return
        
        # Fermer chaque session
        for session in old_sessions:
            session.actif = False
            session.timestamp_fin = datetime.utcnow()
            print(f"Fermeture automatique de la session '{session.nom_session}' (ID: {session.id}) - Créée le {session.timestamp_debut}")
        
        # Enregistrer les modifications
        db.session.commit()
        print(f"{len(old_sessions)} session(s) fermée(s) automatiquement.")

if __name__ == '__main__':
    close_old_sessions()
