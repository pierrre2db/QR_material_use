from flask import Blueprint

# Création du Blueprint
bp = Blueprint('auth', __name__)

# Import des routes pour les enregistrer avec le Blueprint
from . import routes
