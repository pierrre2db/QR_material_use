# EduTrack Mini - Suivi des Équipements

Application de suivi d'utilisation des équipements technologiques pour les établissements scolaires.

## ✨ Fonctionnalités (MVP)

- Suivi des équipements fixes
- Enregistrement des utilisations via QR code ou saisie manuelle
- Tableau de bord d'utilisation
- Export des données en CSV
- Interface d'administration basique

## 🚀 Démarrage Rapide

### Prérequis
- Python 3.9+
- SQLite3
- Navigateur web moderne (Chrome, Firefox, Edge)

### Installation

1. **Cloner le dépôt**
   ```bash
   git clone [URL_DU_DEPOT]
   cd NomDuDepot
   ```

2. **Créer et activer un environnement virtuel**
   ```bash
   # Sur Linux/Mac
   python -m venv venv
   source venv/bin/activate
   
   # Sur Windows
   # python -m venv venv
   # .\venv\Scripts\activate
   ```

3. **Installer les dépendances**
   ```bash
   cd equiptrack
   pip install -r requirements.txt
   ```

4. **Configurer l'application**
   ```bash
   cp .env.example .env
   # Modifier les variables si nécessaire
   ```

5. **Initialiser la base de données**
   ```bash
   python init_db.py
   ```

6. **Lancer l'application**
   ```bash
   flask run --port=5001
   ```

7. **Accéder à l'application**
   Ouvrez votre navigateur à l'adresse : http://localhost:5001

## 🛠 Développement

### Structure du projet
```
equiptrack/
├── app.py              # Point d'entrée de l'application
├── models.py           # Modèles de données
├── init_db.py         # Script d'initialisation de la base
├── requirements.txt    # Dépendances
└── static/            # Fichiers statiques (CSS, JS, images)
└── templates/         # Templates HTML
```

### Variables d'environnement
Copiez `.env.example` vers `.env` et ajustez les valeurs :
```
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=votre_cle_secrete
DATABASE_URI=sqlite:///equiptrack.db
```

## 📅 Planning

Consultez [project_gantt.csv](project_gantt.csv) pour le détail du planning et l'avancement du projet.

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📋 Documentation

- [Cahier des Charges](MVP_REQUIREMENTS.md) - Vue d'ensemble du projet
- [Journal de Développement](JOURNAL.md) - Suivi des tâches et évolutions
- [Journal des Changements](CHANGELOG.md) - Historique des versions

## 🛠️ Développement

### Structure du Projet
- `equiptrack/` - Code source de l'application
  - `static/` - Fichiers statiques (CSS, JS)
  - `templates/` - Templates HTML
  - `app.py` - Application principale
  - `models.py` - Modèles de données
  - `init_db.py` - Initialisation de la base de données

### Workflow Git
- `main` - Branche de production
- `develop` - Branche d'intégration
- `feature/*` - Nouvelles fonctionnalités
- `hotfix/*` - Corrections critiques

## 📝 Licence

Ce projet est un logiciel privé développé pour un usage interne.

## 🤝 Contact

Pierre De Dobbeleer  
pierre@eafc-tic.be
