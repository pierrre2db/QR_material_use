# QR Material Use - Documentation

> **Note importante** : Cette version est un MVP (Minimum Viable Product) de test, pas une version finale. Elle est destinée à des fins de démonstration et d'évaluation.

## Vue d'ensemble

QR Material Use est une application web développée par Pierre De Dobbeleer (EAFC-TIC.BE) pour la gestion d'équipements et le suivi de présence des étudiants via des QR codes.

## Statut du projet

- **Version actuelle** : v0.1.0-beta (MVP de test)
- **État** : En développement actif
- **Objectifs futurs** :
  - Amélioration de la sécurité
  - Interface utilisateur plus intuitive
  - Fonctionnalités de reporting avancées
  - Support multilingue

## Fonctionnalités principales

### Pour les enseignants

1. **Scan d'équipement automatisé**
   - Scannez le QR code d'un équipement pour créer automatiquement une session
   - Partagez le QR code de la session avec vos étudiants
   - Suivez les présences en temps réel

2. **Gestion des sessions**
   - Créez, modifiez et fermez des sessions
   - Les sessions inactives sont automatiquement fermées après une heure
   - Exportez la liste des présences

### Pour les étudiants

1. **Interface mobile**
   - Scannez le QR code de la session avec votre smartphone
   - Connectez-vous avec vos identifiants
   - Votre présence est enregistrée automatiquement

### Pour les administrateurs

1. **Gestion des utilisateurs**
   - Ajoutez, modifiez et supprimez des utilisateurs
   - Attribuez des rôles (Admin, Enseignant, Étudiant)

2. **Gestion des équipements**
   - Ajoutez, modifiez et supprimez des équipements
   - Générez des QR codes statiques pour les équipements

## Architecture technique

L'application est construite avec :
- **Backend** : Flask (Python)
- **Base de données** : SQLite
- **Frontend** : HTML, CSS (Bootstrap 5), JavaScript
- **Authentification** : Flask-Login

## Captures d'écran

*Des captures d'écran seront ajoutées prochainement*

## Guide d'installation

Consultez le [README](https://github.com/pierrre2db/QR_material_use) pour les instructions d'installation détaillées.

## Licence

© 2025 Pierre De Dobbeleer - EAFC-TIC.BE. Tous droits réservés.
