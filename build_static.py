import os
import shutil
import json
from app import create_app
from app.services.auth_service import AuthService
from flask_frozen import Freezer

# Créer le répertoire de build s'il n'existe pas
build_dir = 'build'
if os.path.exists(build_dir):
    shutil.rmtree(build_dir)
os.makedirs(build_dir)

# Créer le répertoire data dans le répertoire build
build_data_dir = os.path.join(build_dir, 'data')
os.makedirs(build_data_dir, exist_ok=True)

# Créer le répertoire data s'il n'existe pas
data_dir = 'data'
if not os.path.exists(data_dir):
    os.makedirs(data_dir)

# Générer les utilisateurs de test
auth_service = AuthService()
test_users = auth_service.create_test_users_file()

# Créer l'application Flask
app = create_app()
app.config['FREEZER_DESTINATION'] = build_dir
app.config['FREEZER_RELATIVE_URLS'] = True
app.config['FREEZER_IGNORE_MIMETYPE_WARNINGS'] = True

# Créer le freezer
freezer = Freezer(app)

# Définir les routes pour le freezer
@freezer.register_generator
def url_generator():
    # Page d'accueil
    yield {'endpoint': 'main.index'}
    
    # Pages d'authentification
    yield {'endpoint': 'auth.login'}
    yield {'endpoint': 'auth.test_users'}
    
    # Pages pour chaque rôle
    yield {'endpoint': 'auth.auto_login', 'role': 'admin'}
    yield {'endpoint': 'auth.auto_login', 'role': 'teacher'}
    yield {'endpoint': 'auth.auto_login', 'role': 'student'}
    
    # Pages d'équipement
    yield {'endpoint': 'equipment.list_equipments'}
    
    # Pages de session
    yield {'endpoint': 'session.list_sessions'}
    
    # Pages principales
    yield {'endpoint': 'main.dashboard'}

# Créer un fichier de configuration pour le déploiement
config = {
    'API_BASE_URL': '',  # URL de base de l'API (vide pour l'instant)
    'GOOGLE_SHEET_ID': os.environ.get('GOOGLE_SHEET_ID', ''),
    'USE_LOCAL_DATA': True  # Utiliser les données locales par défaut
}

# Écrire la configuration dans un fichier JSON
with open(os.path.join(build_dir, 'config.json'), 'w') as f:
    json.dump(config, f, indent=2)

# Copier les données de test dans le répertoire de build
if os.path.exists('data/test_users.json'):
    shutil.copy('data/test_users.json', os.path.join(build_data_dir, 'test_users.json'))

# Créer un fichier index.js pour charger les données
js_content = """
// Chargement des données depuis les fichiers JSON
async function loadData() {
    try {
        const configResponse = await fetch('config.json');
        const config = await configResponse.json();
        
        // Stocker la configuration dans le localStorage
        localStorage.setItem('app_config', JSON.stringify(config));
        
        // Charger les utilisateurs de test
        if (config.USE_LOCAL_DATA) {
            const usersResponse = await fetch('data/test_users.json');
            const users = await usersResponse.json();
            localStorage.setItem('users', JSON.stringify(users));
        }
        
        console.log('Données chargées avec succès');
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
    }
}

// Initialiser l'application
document.addEventListener('DOMContentLoaded', function() {
    loadData();
});
"""

# Écrire le fichier index.js
with open(os.path.join(build_dir, 'index.js'), 'w') as f:
    f.write(js_content)

# Créer un fichier index.html simple
html_content = """
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Système de Gestion d'Équipements avec QR Codes</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
</head>
<body>
    <div class="container py-5">
        <div class="row justify-content-center">
            <div class="col-md-8 text-center">
                <h1 class="display-4 mb-4">Système de Gestion d'Équipements avec QR Codes</h1>
                <div class="card shadow">
                    <div class="card-body">
                        <p class="lead">Cette application est déployée sur GitHub Pages.</p>
                        <p>Pour accéder à l'application complète, veuillez consulter le README pour les instructions d'installation et d'utilisation.</p>
                        
                        <div class="d-grid gap-3 col-md-6 mx-auto mt-4">
                            <a href="auth/login.html" class="btn btn-primary btn-lg">
                                <i class="fas fa-sign-in-alt me-2"></i>Accéder à la démo
                            </a>
                            <a href="https://github.com/votre-username/QR_material_use" class="btn btn-outline-secondary">
                                <i class="fab fa-github me-2"></i>Voir sur GitHub
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="index.js"></script>
</body>
</html>
"""

# Écrire le fichier index.html
with open(os.path.join(build_dir, 'index.html'), 'w') as f:
    f.write(html_content)

if __name__ == '__main__':
    # Générer les fichiers statiques
    freezer.freeze()
    print(f"Site statique généré dans le répertoire '{build_dir}'")
