# ÉquipTrack

Application web pour la gestion et le suivi des équipements électroniques via scan ou saisie manuelle de codes uniques.

## 📋 Table des matières
- [Fonctionnalités](#-fonctionnalités)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [Développement](#-développement)
- [Structure du projet](#-structure-du-projet)
- [Licence](#-licence)

## ✨ Fonctionnalités

### 🔍 Identification des équipements
- Scan de QR Code (6 caractères alphanumériques)
- Saisie manuelle du code
- Validation automatique du format
- Génération de codes uniques

### 🛠️ Gestion des équipements
- Ajout avec génération automatique de QR code
- Suivi de l'état (disponible/en prêt/en maintenance)
- Historique des utilisations
- Interface d'administration complète

### 📊 Suivi d'utilisation
- Enregistrement des scans
- Types d'utilisation (emprunt, retour, maintenance)
- Statistiques d'utilisation
- Rapports d'activité

### 👥 Gestion des utilisateurs
- Système d'authentification sécurisé
- Rôles utilisateurs (Admin, Utilisateur standard)
- Tableau de bord personnalisé

## 🚀 Prérequis

- Python 3.8 ou supérieur
- pip (gestionnaire de paquets Python)
- SQLite (inclus avec Python)

## 📥 Installation

1. **Cloner le dépôt** :
   ```bash
   git clone [URL_DU_DEPOT]
   cd equiptrack
   ```

2. **Créer un environnement virtuel** (recommandé) :
   ```bash
   python -m venv venv
   source venv/bin/activate  # Sur Windows: venv\Scripts\activate
   ```

3. **Installer les dépendances** :
   ```bash
   pip install -r requirements.txt
   ```

## ⚙️ Configuration

1. **Variables d'environnement**
   Créez un fichier `.flaskenv` à la racine du projet :
   ```
   FLASK_APP=run.py
   FLASK_ENV=development
   FLASK_RUN_HOST=0.0.0.0
   FLASK_DEBUG=1
   ```

2. **Base de données**
   La base de données SQLite sera automatiquement créée lors du premier démarrage.

## 🚀 Utilisation

1. **Démarrer le serveur** :
   ```bash
   flask run
   ```

2. **Accéder à l'application** :
   - Interface utilisateur : http://127.0.0.1:5000/
   - Administration : http://127.0.0.1:5000/admin/

3. **Identifiants par défaut** :
   - Utilisateur : admin
   - Mot de passe : admin123

## 💻 Développement

### Structure du projet
```
equiptrack/
├── app/
│   ├── __init__.py       # Initialisation de l'application
│   ├── admin.py          # Configuration de l'interface d'administration
│   ├── models.py         # Modèles de données
│   ├── routes/           # Routes de l'application
│   ├── static/           # Fichiers statiques (CSS, JS, images)
│   └── templates/        # Templates HTML
├── data/                 # Fichiers de données
├── migrations/           # Migrations de la base de données
├── tests/                # Tests automatisés
├── .flaskenv             # Configuration Flask
├── config.py             # Configuration de l'application
└── requirements.txt      # Dépendances du projet
```

### Commandes utiles

**Lancer les tests** :
```bash
python -m pytest
```

**Créer une migration** :
```bash
flask db migrate -m "Description des modifications"
```

**Appliquer les migrations** :
```bash
flask db upgrade
```

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

Développé avec ❤️ par [Votre Nom] - [Votre Site Web]

1. **Variables d'environnement** :
   Créez un fichier `.env` à la racine du projet avec les variables suivantes :
   ```
   FLASK_APP=wsgi:app
   FLASK_ENV=development
   SECRET_KEY=votre_clé_secrète_très_longue_et_complexe
   DATABASE_URL=sqlite:///app.db
   ```

2. **Initialisation de la base de données** :
   ```bash
   flask db upgrade
   ```

3. **Création d'un compte administrateur** :
   Un compte administrateur est automatiquement créé au premier démarrage :
   - Identifiant : admin
   - Mot de passe : admin123
   
   **Important** : Changez ces identifiants immédiatement après la première connexion.

## Interface d'administration

L'application inclut une interface d'administration accessible à l'adresse `/admin`.

- **Accès** : Réservé aux utilisateurs avec le statut administrateur
- **Fonctionnalités** :
  - Gestion des équipements (CRUD)
  - Consultation de l'historique des utilisations
  - Gestion des utilisateurs

## Authentification

L'application utilise Flask-Login pour gérer l'authentification des utilisateurs.

### Création d'un nouvel utilisateur

1. Connectez-vous en tant qu'administrateur
2. Accédez à la section "Utilisateurs" dans l'interface d'administration
3. Cliquez sur "Créer" pour ajouter un nouvel utilisateur

### Rôles des utilisateurs

- **Administrateur** : Accès complet à toutes les fonctionnalités
- **Utilisateur standard** : Peut scanner les équipements et consulter l'historique

## Démarrage de l'application

```bash
# Mode développement
flask run --debug

# Ou en production avec gunicorn (à installer avec pip install gunicorn)
gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app
```

## Déploiement

Pour déployer l'application en production :

1. Configurez un serveur web comme Nginx ou Apache
2. Utilisez Gunicorn ou uWSGI comme serveur WSGI
3. Mettez à jour les variables d'environnement pour la production
4. Assurez-vous que la base de données est correctement configurée

## Sécurité

- Toujours utiliser HTTPS en production
- Modifier la clé secrète (`SECRET_KEY`) dans le fichier `.env`
- Ne pas utiliser les identifiants par défaut en production
- Mettre à jour régulièrement les dépendances

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## Auteur

Votre Nom - [votre@email.com](mailto:votre@email.com)

## Remerciements

- [Flask](https://flask.palletsprojects.com/)
- [Flask-Admin](https://flask-admin.readthedocs.io/)
- [SQLAlchemy](https://www.sqlalchemy.org/)
- Tous les contributeurs qui ont rendu ce projet possible

1. **Fichier de configuration** :
   Créez un fichier `.env` à la racine du projet avec les variables d'environnement nécessaires :
   ```
   FLASK_APP=app.py
   FLASK_ENV=development
   SECRET_KEY=votre_cle_secrete_ici
   ```

2. **Initialiser les données** :
   - Les fichiers de données seront automatiquement créés au premier lancement dans le dossier `data/`
   - Format des QR codes : 6 caractères alphanumériques (ex: A1B2C3)
   - Les codes sont insensibles à la casse (A1B2C3 = a1b2c3)

## Utilisation

1. **Démarrer le serveur** :
   ```bash
   flask run
   ```

2. **Accéder à l'application** :
   Ouvrez votre navigateur à l'adresse : http://localhost:5000

3. **Scanner un équipement** :
   - Allez dans l'onglet "Scanner"
   - Scannez le QR code de l'équipement
   - Ou entrez manuellement le code de l'équipement

4. **Exporter les données** :
   - Utilisez le bouton "Exporter" pour télécharger un rapport CSV

## Structure du projet

```
equiptrack/
├── app.py                 # Application principale
├── models.py              # Modèles de données
├── requirements.txt       # Dépendances Python
├── data/                  # Données de l'application
│   ├── equipments.json    # Liste des équipements
│   └── usages.json        # Historique des utilisations
├── static/                # Fichiers statiques (CSS, JS, images)
│   ├── app.js
│   └── style.css
└── templates/             # Templates HTML
    ├── base.html
    ├── index.html
    └── scan.html
```

## Développement

### Lancer en mode développement
```bash
export FLASK_APP=app.py
export FLASK_ENV=development
flask run
```

### Exécuter les tests
```bash
pytest
```

### Mettre à jour les dépendances
```bash
pip freeze > requirements.txt
```

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## Auteur
Pierre De Dobbeleer - pierreéd@g

---

Développé avec ❤️ pour simplifier le suivi des équipements.
