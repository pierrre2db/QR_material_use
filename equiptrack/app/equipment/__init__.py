from flask import Blueprint

print("Création du blueprint 'equipment'...")
bp = Blueprint('equipment', __name__, template_folder='templates')
print(f"Blueprint créé: {bp.name}")

# Import des routes après la création du blueprint pour éviter les importations circulaires
print("Importation des routes du blueprint equipment...")
try:
    from . import routes
    print("Routes importées avec succès")
    print(f"Routes disponibles dans le blueprint: {bp.deferred_functions}")
except Exception as e:
    print(f"Erreur lors de l'import des routes: {e}")
