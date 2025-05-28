# Journal de Développement - EquipTrack

## 2025-05-23
### Développement (Suite)
- [x] Configuration de l'interface d'administration avec Flask-Admin
- [x] Implémentation de l'authentification utilisateur
- [x] Amélioration des modèles de données (User, Equipment, Usage)
- [x] Configuration de la base de données avec SQLAlchemy
- [x] Mise en place du système de migrations avec Flask-Migrate
- [x] Configuration de la structure du projet pour le déploiement

### Documentation
- [x] Mise à jour du fichier README.md avec les instructions d'installation
- [x] Documentation des modèles de données
- [x] Mise à jour des dépendances dans requirements.txt

### Problèmes rencontrés et solutions
- Résolution des problèmes d'initialisation de l'application
- Correction des erreurs de configuration des chemins d'import
- Amélioration de la gestion des dépendances

## 2025-05-22
### Développement
- [x] Configuration initiale de Flask avec Blueprints
- [x] Création des modèles de base pour les équipements et les utilisations
- [x] Mise en place de la structure du projet
- [x] Configuration de la base de données SQLite
- [x] Création des premières vues de base

## 2025-05-21
### Mise en place de l'environnement
- [x] Configuration de l'environnement Python 3.9
- [x] Installation des dépendances (Flask, SQLAlchemy, etc.)
- [x] Configuration de la base de données SQLite
- [x] Mise en place du serveur de développement

### Développement initial
- [x] Création des modèles de données
- [x] Initialisation de la base de données avec des données de test
- [x] Configuration du serveur Flask
- [x] Création des vues de base (accueil, scan)

### Documentation
- [x] Mise à jour du journal de développement
- [x] Création du diagramme de Gantt (project_gantt.csv)
- [x] Mise à jour de la documentation technique

### Problèmes rencontrés et solutions
- Conflit de port 5000 (résolu en utilisant le port 5001)
- Problèmes de compatibilité avec pandas/numpy (résolus en utilisant des versions spécifiques)

## 2025-05-20
### Refonte du Projet
- [x] Simplification de la portée du projet pour se concentrer sur le MVP
- [x] Mise à jour de la documentation (README, CHANGELOG, MVP_REQUIREMENTS)
- [x] Restructuration des tâches et du planning
- [x] Définition des sprints jusqu'au déploiement de Septembre 2025

### Décisions Clés
- Recentrage sur le suivi des équipements fixes uniquement
- Utilisation de SQLite pour la base de données
- Interface web légère avec Flask
- Déploiement sur Raspberry Pi/PC existant

## 2025-05-20
### Mise en Place Initiale
- [x] Initialisation du dépôt Git
- [x] Configuration de l'environnement de développement
- [x] Création de la structure de base du projet
- [x] Configuration du suivi des tâches

## Prochaines Étapes
1. Développer l'interface utilisateur complète (T103-T105)
   - Formulaire d'ajout/modification d'équipement
   - Interface de scan des QR codes
   - Tableau de bord de suivi
2. Implémenter l'API REST (T106-T108)
   - Endpoints pour la gestion des équipements
   - Endpoints pour le suivi des utilisations
   - Documentation de l'API
3. Tests et validation (T109-T111)
   - Tests unitaires
   - Tests d'intégration
   - Tests utilisateur

## Notes
- Le développement est en cours avec une approche itérative
- Les fonctionnalités sont développées par ordre de priorité
- La documentation est mise à jour au fur et à mesure du développement
- Les retours utilisateurs guident les améliorations futures
