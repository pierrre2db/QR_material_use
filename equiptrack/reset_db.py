"""
Script pour réinitialiser complètement la base de données.
"""
import os
from app import create_app, db

def reset_database():
    # Créer l'application avec le contexte
    app = create_app('development')
    
    with app.app_context():
        # Supprimer toutes les tables
        db.drop_all()
        
        # Recréer toutes les tables
        db.create_all()
        
        # Supprimer le fichier de base de données s'il existe
        if os.path.exists('instance/equiptrack.db'):
            os.remove('instance/equiptrack.db')
        
        print("Base de données réinitialisée avec succès!")

if __name__ == '__main__':
    reset_database()
