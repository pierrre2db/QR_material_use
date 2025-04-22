# Déploiement sur GitHub Pages

Ce guide explique comment déployer l'application QR Material Use sur GitHub Pages en utilisant des fonctions serverless pour le backend.

## Prérequis

- Un compte GitHub
- Git installé sur votre machine
- Node.js et npm installés pour les fonctions serverless

## Étapes de déploiement

### 1. Préparation du dépôt GitHub

1. Créez un nouveau dépôt sur GitHub
2. Initialisez Git dans votre projet local et liez-le au dépôt distant :

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/votre-username/QR_material_use.git
git push -u origin main
```

### 2. Configuration de GitHub Pages

1. Allez dans les paramètres de votre dépôt GitHub
2. Naviguez jusqu'à la section "Pages"
3. Sélectionnez la branche `main` comme source
4. Choisissez le dossier `/docs` comme dossier racine (ou créez une branche `gh-pages`)
5. Cliquez sur "Save"

### 3. Adaptation de l'application pour GitHub Pages

Notre application Flask doit être adaptée pour fonctionner avec GitHub Pages, qui ne prend en charge que les sites statiques. Nous allons utiliser une approche hybride :

1. Le frontend sera servi comme site statique
2. Le backend sera géré par des fonctions serverless

#### Création des fichiers statiques

Utilisez Frozen-Flask pour générer les fichiers statiques :

```bash
python -c "from app import create_app; from flask_frozen import Freezer; app = create_app(); freezer = Freezer(app); freezer.freeze()"
```

Cela créera un dossier `build` avec les fichiers statiques.

#### Configuration des fonctions serverless

1. Créez un dossier `api` à la racine du projet :

```bash
mkdir -p api
```

2. Créez un fichier de configuration pour les fonctions serverless :

```bash
# api/vercel.json
{
  "version": 2,
  "functions": {
    "api/*.py": { "runtime": "python3.9" }
  },
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" }
  ]
}
```

3. Adaptez les endpoints de l'API pour fonctionner comme des fonctions serverless :

```python
# api/auth.py
from http.server import BaseHTTPRequestHandler
import json
from app.services.auth_service import AuthService

auth_service = AuthService()

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        
        email = data.get('email')
        password = data.get('password')
        
        user = auth_service.authenticate_user(email, password)
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        response = {
            'success': user is not None,
            'user': user if user else None
        }
        
        self.wfile.write(json.dumps(response).encode())
        return
```

4. Modifiez le frontend pour utiliser ces endpoints API au lieu des routes Flask :

```javascript
// static/js/api.js
const API_BASE_URL = 'https://votre-username.github.io/QR_material_use/api';

async function login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });
    
    return await response.json();
}

// Autres fonctions API...
```

### 4. Déploiement des fonctions serverless

Pour les fonctions serverless, vous pouvez utiliser Vercel ou Netlify :

#### Avec Vercel

1. Installez Vercel CLI :
```bash
npm install -g vercel
```

2. Déployez les fonctions :
```bash
cd api
vercel
```

3. Liez votre domaine GitHub Pages au domaine Vercel dans les paramètres.

#### Avec Netlify

1. Créez un fichier `netlify.toml` à la racine du projet :
```toml
[build]
  publish = "build"
  command = "python -c \"from app import create_app; from flask_frozen import Freezer; app = create_app(); freezer = Freezer(app); freezer.freeze()\""

[functions]
  directory = "api"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

2. Installez Netlify CLI :
```bash
npm install -g netlify-cli
```

3. Déployez sur Netlify :
```bash
netlify deploy
```

### 5. Mise à jour du frontend pour utiliser les fonctions serverless

Modifiez les formulaires et les appels AJAX dans votre application pour pointer vers les nouveaux endpoints API serverless au lieu des routes Flask.

### 6. Gestion de la base de données

Comme GitHub Pages ne prend pas en charge les bases de données, vous avez plusieurs options :

1. **Option 1**: Utiliser une base de données en ligne comme Firebase ou MongoDB Atlas
2. **Option 2**: Stocker les données dans le localStorage du navigateur (limité mais simple)
3. **Option 3**: Utiliser un service de base de données serverless comme FaunaDB

Pour l'option 1, vous devrez modifier le code de l'application pour utiliser ces services au lieu de SQLite.

## Limitations

- Les fonctionnalités en temps réel seront limitées
- La persistance des données dépendra du service de base de données choisi
- Certaines fonctionnalités comme la génération de QR codes devront être adaptées pour fonctionner côté client

## Ressources supplémentaires

- [Documentation GitHub Pages](https://docs.github.com/en/pages)
- [Documentation Vercel Serverless Functions](https://vercel.com/docs/serverless-functions/introduction)
- [Documentation Netlify Functions](https://docs.netlify.com/functions/overview/)
- [FaunaDB - Base de données serverless](https://fauna.com/)
