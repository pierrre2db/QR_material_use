from app import create_app, db
from app.models import Equipment, Session
from datetime import datetime

app = create_app()

def migrate_equipment_qr_codes():
    """Met à jour les QR codes statiques des équipements pour inclure le nom de l'école"""
    print("Migration des QR codes statiques des équipements...")
    
    with app.app_context():
        equipments = Equipment.query.all()
        ecole = "EAFC-TIC"  # Nom de l'école
        
        count = 0
        for equipment in equipments:
            # Vérifier si le QR code contient déjà le nom de l'école
            if not equipment.qr_code_statique_data.startswith(ecole):
                # Ancien format: "{equipment_id}_{type_equipement}_{nom_salle}"
                # Nouveau format: "{ecole}_{equipment_id}_{type_equipement}_{nom_salle}"
                equipment.qr_code_statique_data = f"{ecole}_{equipment.id}_{equipment.type_equipement}_{equipment.nom_salle}"
                count += 1
        
        if count > 0:
            db.session.commit()
            print(f"{count} QR codes d'équipements mis à jour avec succès.")
        else:
            print("Aucun QR code d'équipement à mettre à jour.")

def migrate_session_qr_codes():
    """Met à jour les QR codes dynamiques des sessions pour inclure le nom de l'école, le local et l'équipement"""
    print("Migration des QR codes dynamiques des sessions...")
    
    with app.app_context():
        sessions = Session.query.all()
        ecole = "EAFC-TIC"  # Nom de l'école
        
        count = 0
        for session in sessions:
            # Vérifier si le QR code commence par "SESSION_" mais ne contient pas le nom de l'école
            if session.qr_code_dynamique_data.startswith("SESSION_") and ecole not in session.qr_code_dynamique_data:
                # Récupérer l'équipement associé à la session
                equipment = session.equipement
                
                # Extraire l'ID de session et le timestamp de l'ancien format
                # Ancien format: "SESSION_{session_id}_{timestamp}"
                parts = session.qr_code_dynamique_data.split('_')
                if len(parts) >= 3:
                    session_id = parts[1]
                    timestamp = parts[2]
                    
                    # Nouveau format: "SESSION_{ecole}_{nom_salle}_{type_equipement}_{session_id}_{timestamp}"
                    session.qr_code_dynamique_data = f"SESSION_{ecole}_{equipment.nom_salle}_{equipment.type_equipement}_{session_id}_{timestamp}"
                    count += 1
        
        if count > 0:
            db.session.commit()
            print(f"{count} QR codes de sessions mis à jour avec succès.")
        else:
            print("Aucun QR code de session à mettre à jour.")

if __name__ == "__main__":
    migrate_equipment_qr_codes()
    migrate_session_qr_codes()
    print("Migration des QR codes terminée.")
