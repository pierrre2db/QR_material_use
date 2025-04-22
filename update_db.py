from app import create_app, db
from app.models import Session, Equipment, User, LogScan
import sqlite3

app = create_app()

def add_columns():
    """Ajoute les colonnes manquantes à la base de données"""
    print("Mise à jour de la structure de la base de données...")
    
    # Connexion à la base de données SQLite
    conn = sqlite3.connect('instance/app.db')
    cursor = conn.cursor()
    
    # Vérifier si la colonne nom_session existe déjà
    cursor.execute("PRAGMA table_info(sessions)")
    columns = [column[1] for column in cursor.fetchall()]
    
    # Ajouter la colonne nom_session si elle n'existe pas
    if 'nom_session' not in columns:
        print("Ajout de la colonne 'nom_session' à la table 'sessions'...")
        cursor.execute("ALTER TABLE sessions ADD COLUMN nom_session TEXT")
    
    # Vérifier si la colonne actif existe déjà
    if 'actif' not in columns:
        print("Ajout de la colonne 'actif' à la table 'sessions'...")
        cursor.execute("ALTER TABLE sessions ADD COLUMN actif BOOLEAN DEFAULT 1")
    
    # Vérifier si la colonne timestamp_fin existe déjà
    if 'timestamp_fin' not in columns:
        print("Ajout de la colonne 'timestamp_fin' à la table 'sessions'...")
        cursor.execute("ALTER TABLE sessions ADD COLUMN timestamp_fin TIMESTAMP")
    
    # Valider les modifications
    conn.commit()
    conn.close()
    
    print("Mise à jour terminée avec succès!")

if __name__ == '__main__':
    with app.app_context():
        add_columns()
