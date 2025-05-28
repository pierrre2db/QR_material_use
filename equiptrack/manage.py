#!/usr/bin/env python
import os
from flask import Flask
from flask_migrate import Migrate

# Création d'une application minimale pour les migrations
app = Flask(__name__)


# Configuration de base
app.config.update(
    SQLALCHEMY_DATABASE_URI=os.getenv('DATABASE_URL', 'sqlite:///' + os.path.join(os.path.abspath(os.path.dirname(__file__)), 'instance/equiptrack.db')),
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
    SECRET_KEY=os.getenv('SECRET_KEY', 'dev-key-123')
)

# Initialisation de SQLAlchemy et Migrate
from app.extensions import db
db.init_app(app)
migrate = Migrate(app, db)

# Import des modèles pour les migrations
from app.models import User, Equipment, Usage  # noqa

if __name__ == '__main__':
    app.run(debug=True)
