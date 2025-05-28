#!/usr/bin/env python3
"""
Point d'entrée principal pour exécuter l'application EquipTrack.
"""
from app import create_app

app = create_app('development')

if __name__ == '__main__':
    app.run(host=app.config['HOST'], port=app.config['PORT'])
