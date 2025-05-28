"""
Fichier WSGI pour le déploiement de l'application EquipTrack.
"""
import os
from equiptrack import create_app

# Création de l'application avec la configuration appropriée
app = create_app(os.getenv('FLASK_ENV') or 'production')

if __name__ == "__main__":
    app.run()
