from app import create_app
from app.models import User, Equipment, Session, LogScan
from app import db
import os
from datetime import datetime

app = create_app()

@app.context_processor
def inject_now():
    return {'now': datetime.utcnow()}

@app.cli.command("init-db")
def init_db():
    """Initialiser la base de données avec des données de test."""
    db.drop_all()
    db.create_all()
    
    # Ajouter des utilisateurs de test
    admin = User(id="admin@ecole.be", nom_complet="Administrateur", role="Admin")
    prof = User(id="prof1@ecole.be", nom_complet="Jean Dupont", role="Enseignant")
    etudiant = User(id="etudiant1@ecole.be", nom_complet="Marie Martin", role="Etudiant")
    
    # Ajouter des équipements de test
    eq1 = Equipment(id="EQ001", nom_salle="Labo 101", type_equipement="Microscope", qr_code_statique_data="MS101")
    eq2 = Equipment(id="EQ002", nom_salle="Labo 102", type_equipement="Balance", qr_code_statique_data="BA102")
    
    db.session.add_all([admin, prof, etudiant, eq1, eq2])
    db.session.commit()
    
    print("Base de données initialisée avec succès!")

if __name__ == "__main__":
    app.run(debug=True, port=5005)
