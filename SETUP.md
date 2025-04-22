# Guide de Configuration et Déploiement

## 1. Création et Configuration du Google Sheets

1. **Créer une nouvelle feuille Google Sheets**
   - Aller sur https://sheets.new
   - Renommer le fichier en "Suivi_Equipements_Ecole_Backend"

2. **Configurer les onglets**
   - Renommer "Feuille 1" en "Utilisateurs"
   - Créer et nommer les autres onglets :
     - "Equipements"
     - "Sessions"
     - "Logs_Scans_Etudiants"

3. **Ajouter les en-têtes**
   - Dans "Utilisateurs" (A1:C1) :
     - UserID | NomComplet | Role
   - Dans "Equipements" (A1:D1) :
     - EquipementID | NomSalle | TypeEquipement | QRCodeStatiqueData
   - Dans "Sessions" (A1:E1) :
     - SessionID | TimestampDebut | UserID_Enseignant | EquipementID | QRCodeDynamiqueData
   - Dans "Logs_Scans_Etudiants" (A1:D1) :
     - LogID | TimestampScan | SessionID_Scannée | UserID_Etudiant

## 2. Configuration du Google Apps Script

1. **Ouvrir l'éditeur de script**
   - Dans Google Sheets : Extensions > Apps Script
   - Renommer le projet : "Gestion Equipements Ecole - Script Complet"

2. **Ajouter les fichiers de code**
   - Code.gs : Contient la logique principale
   - Index.html : Interface utilisateur web

3. **Configurer les autorisations**
   - Exécuter la fonction de test `testCreateSession`
   - Autoriser les permissions requises
   - Vérifier les logs d'exécution

## 3. Déploiement

1. **Déployer l'application web**
   - Cliquer sur "Déployer" > "Nouveau déploiement"
   - Choisir "Application Web"
   - Configuration :
     - Description : "Gestion QR Codes École"
     - Exécuter en tant que : Vous-même
     - Qui a accès : Membres de votre organisation

2. **Test initial**
   - Accéder à l'URL de déploiement
   - Vérifier l'affichage des équipements
   - Tester la génération de QR codes

## 4. Données de Test

Ajouter ces exemples de données pour tester :

### Utilisateurs
```
UserID                  | NomComplet      | Role
prof1@ecole.be         | Jean Dupont     | Enseignant
etudiant1@ecole.be     | Marie Martin    | Etudiant
```

### Equipements
```
EquipementID | NomSalle    | TypeEquipement | QRCodeStatiqueData
EQ001        | Labo 101    | Microscope     | MS101
EQ002        | Labo 102    | Balance        | BA102
```

## 5. Sécurité et Maintenance

- Restreindre l'accès au fichier Google Sheets
- Sauvegarder régulièrement les données
- Vérifier les logs d'utilisation
- Mettre à jour les autorisations si nécessaire
