from app import create_app, db
from app.models import User, Equipment, Session, LogScan

app = create_app()

with app.app_context():
    # Supprimer toutes les tables existantes
    db.drop_all()
    
    # Créer toutes les tables
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
