# Guide Technique - QR Material Use

Ce document fournit des informations techniques sur l'architecture, la structure du code et les processus de développement pour le projet QR Material Use.

## Architecture du système

### Structure du projet

```
QR_material_use/
├── app/                      # Application principale
│   ├── controllers/          # Contrôleurs Flask
│   ├── models/               # Modèles de données
│   ├── services/             # Services métier
│   ├── static/               # Fichiers statiques (CSS, JS)
│   └── templates/            # Templates HTML
├── docs/                     # Documentation
├── instance/                 # Base de données SQLite (ignorée par Git)
├── tests/                    # Tests unitaires
├── .env                      # Variables d'environnement (ignoré par Git)
├── .env.example              # Exemple de fichier .env
├── app.py                    # Point d'entrée de l'application
├── auto_close_sessions.py    # Script pour fermer les sessions inactives
├── requirements.txt          # Dépendances Python
└── update_db.py              # Script de mise à jour de la base de données
```

### Flux de données

1. **Scan d'équipement**:
   - L'enseignant scanne un QR code d'équipement
   - Le contrôleur `scan.py` traite la requête
   - Une nouvelle session est créée dans la base de données
   - Un QR code dynamique est généré pour la session

2. **Enregistrement de présence**:
   - L'étudiant scanne le QR code de la session
   - Le contrôleur `scan.py` vérifie si la session est active
   - Si l'étudiant est authentifié, sa présence est enregistrée
   - Un message de confirmation est affiché

## Modèles de données

### User
```python
class User(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    nom_complet = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # Admin, Enseignant, Étudiant
```

### Equipment
```python
class Equipment(db.Model):
    id = db.Column(db.String(20), primary_key=True)
    type_equipement = db.Column(db.String(100), nullable=False)
    nom_salle = db.Column(db.String(50), nullable=False)
    qr_code_statique_data = db.Column(db.String(100), unique=True, nullable=False)
```

### Session
```python
class Session(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    nom_session = db.Column(db.String(100), nullable=True)
    timestamp_debut = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    timestamp_fin = db.Column(db.DateTime, nullable=True)
    user_id_enseignant = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False)
    equipment_id = db.Column(db.String(20), db.ForeignKey('equipments.id'), nullable=False)
    qr_code_dynamique_data = db.Column(db.String(100), unique=True, nullable=False)
    actif = db.Column(db.Boolean, default=True)
```

### LogScan
```python
class LogScan(db.Model):
    id = db.Column(db.String(36), primary_key=True)
    session_id = db.Column(db.String(36), db.ForeignKey('sessions.id'), nullable=False)
    user_id_etudiant = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False)
    timestamp_scan = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
```

## API et routes principales

### Routes d'authentification
- `/login` : Connexion utilisateur
- `/logout` : Déconnexion utilisateur

### Routes de scan
- `/teacher-scan` : Interface de scan pour les enseignants
- `/mobile-scan` : Interface de scan pour les étudiants
- `/api/scan` : Endpoint API pour traiter les scans
- `/api/scan-equipment` : Endpoint API pour scanner un équipement

### Routes de session
- `/sessions/create` : Création manuelle de session
- `/sessions/<session_id>` : Détails d'une session
- `/sessions/<session_id>/qr-code` : Affichage du QR code d'une session
- `/sessions/<session_id>/close` : Fermeture d'une session

## Sécurité

- Authentification via Flask-Login
- Contrôle d'accès basé sur les rôles
- Protection CSRF sur les formulaires
- Validation des entrées utilisateur

## Fermeture automatique des sessions

Un script `auto_close_sessions.py` est fourni pour fermer automatiquement les sessions actives depuis plus d'une heure. Ce script peut être exécuté manuellement ou configuré pour s'exécuter périodiquement via un planificateur de tâches (cron).

### Configuration cron (exemple)
```bash
# Exécuter toutes les heures
0 * * * * cd /chemin/vers/QR_material_use && /chemin/vers/python auto_close_sessions.py >> /var/log/auto_close_sessions.log 2>&1
```

## Développement et déploiement

### Installation pour le développement
```bash
git clone https://github.com/pierrre2db/QR_material_use.git
cd QR_material_use
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python update_db.py
flask run
```

### Déploiement en production
Pour un déploiement en production, il est recommandé d'utiliser un serveur WSGI comme Gunicorn ou uWSGI, derrière un serveur web comme Nginx ou Apache.

```bash
# Exemple avec Gunicorn
pip install gunicorn
gunicorn app:app -w 4 -b 0.0.0.0:8000
```

## Tests

Des tests unitaires sont disponibles dans le dossier `tests/`. Pour les exécuter :

```bash
python -m pytest
```
