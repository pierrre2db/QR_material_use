from flask import Blueprint, jsonify
from werkzeug.http import HTTP_STATUS_CODES

# Création du Blueprint pour l'API
bp = Blueprint('api', __name__)

def error_response(status_code, message=None):
    """Crée une réponse d'erreur au format JSON."""
    payload = {'error': HTTP_STATUS_CODES.get(status_code, 'Unknown error')}
    if message:
        payload['message'] = message
    response = jsonify(payload)
    response.status_code = status_code
    return response

# Définition des gestionnaires d'erreurs
@bp.errorhandler(400)
def bad_request_error(error):
    return error_response(400, str(error))

@bp.errorhandler(401)
def unauthorized_error(error):
    return error_response(401, 'Authentification requise')

@bp.errorhandler(403)
def forbidden_error(error):
    return error_response(403, 'Accès refusé')

@bp.errorhandler(404)
def not_found_error(error):
    return error_response(404, 'Ressource non trouvée')

@bp.errorhandler(405)
def method_not_allowed_error(error):
    return error_response(405, 'Méthode non autorisée')

@bp.errorhandler(500)
def internal_error_handler(error):
    return error_response(500, 'Une erreur interne est survenue')

# Import des routes pour les enregistrer avec le Blueprint
from . import routes
