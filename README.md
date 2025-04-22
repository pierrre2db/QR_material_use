# Système de Gestion d'Équipements avec QR Codes

Développé par Pierre De Dobbeleer - EAFC-TIC.BE

Application Flask pour la gestion d'équipements via QR codes, avec stockage dans une base de données SQLite locale.

## Structure du Système

- **Backend** : Flask (Python)
- **Base de données** : SQLite
- **Authentification** : Flask-Login
- **Interface utilisateur** : Bootstrap 5

## Fonctionnalités

1. **Gestion des équipements**
   - Inventaire des équipements avec QR codes statiques
   - Suivi de l'utilisation des équipements

2. **Gestion des sessions**
   - Création automatique de sessions via scan QR code
   - Génération de QR codes dynamiques pour les sessions
   - Suivi des présences des étudiants
   - Fermeture manuelle ou automatique des sessions après une heure

3. **Scan mobile**
   - Interface mobile-friendly pour scanner les QR codes
   - Fonctionne directement dans le navigateur, sans application à installer
   - Compatible avec tous les smartphones modernes

4. **Tableau de bord**
   - Interface différente selon le rôle (Admin, Enseignant, Étudiant)
   - Visualisation des sessions et des présences
   - Statistiques d'utilisation des équipements

## Installation depuis GitHub

1. Cloner le dépôt
```bash
git clone https://github.com/votre-username/QR_material_use.git
cd QR_material_use
```

2. Créer un environnement virtuel et installer les dépendances
```bash
python -m venv .venv
source .venv/bin/activate  # Sur Windows : .venv\Scripts\activate
pip install -r requirements.txt
```

3. Configurer les variables d'environnement
```bash
cp .env.example .env
# Modifier le fichier .env avec vos paramètres
```

4. Initialiser la base de données
```bash
python update_db.py
```

5. Lancer l'application
```bash
flask run
```

## Déploiement

L'application peut être déployée sur diverses plateformes :

1. **Serveur local**
```bash
flask run --host=0.0.0.0
```

2. **Serveur de production**
```bash
gunicorn app:app
```

3. **GitHub Pages avec backend serverless**
L'application peut être déployée sur GitHub Pages en utilisant des fonctions serverless pour le backend.
Consultez le guide de déploiement dans `docs/github_pages_deployment.md` pour plus de détails.

## Contribuer au projet

1. Forker le dépôt
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/ma-fonctionnalite`)
3. Commiter vos changements (`git commit -am 'Ajout de ma fonctionnalité'`)
4. Pousser vers la branche (`git push origin feature/ma-fonctionnalite`)
5. Créer une Pull Request

## Utilisateurs de test

Pour tester l'application, vous pouvez utiliser les identifiants suivants :

- **Admin** : admin@ecole.be / 1234
- **Enseignant** : prof1@ecole.be, prof2@ecole.be, prof3@ecole.be / 1234
- **Étudiant** : etudiant1@ecole.be, etudiant2@ecole.be, etudiant3@ecole.be / 1234

## Licence et Copyright

 2025 Pierre De Dobbeleer - EAFC-TIC.BE

Ce logiciel est fourni à des fins éducatives. Tous droits réservés.
