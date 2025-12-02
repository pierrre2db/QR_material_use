# Spécifications fonctionnelles et techniques (rétro-ingénierie)

Ce document décrit le comportement attendu de l'application de gestion d'équipements par QR codes tel qu'il ressort du code source actuel.

## Vue d'ensemble du système

- Application Flask avec authentification par rôles (Admin, Enseignant, Étudiant) et persistance SQLite via SQLAlchemy.
- Les QR codes statiques identifient les équipements, les QR codes dynamiques identifient les sessions créées par les enseignants.
- Les parcours utilisateur sont adaptés selon le rôle (dashboards, droits d'accès, redirections après connexion).

## Modèle de données

### Utilisateurs
- Identifiant = email (`id`), nom complet et rôle obligatoire.
- Relations :
  - `sessions` (sessions créées pour les enseignants/admins)
  - `logs` (scans effectués pour les étudiants)

### Équipements
- Identifiant propre `id`, salle `nom_salle`, type `type_equipement`.
- Donnée de QR code statique générée au format `EAFC-TIC_<id>_<type>_<salle>`.
- Relation : `sessions` (sessions associées à l'équipement).

### Sessions
- UUID comme identifiant, nom facultatif, timestamps de début/fin et indicateur `actif`.
- Références vers l'enseignant créateur et l'équipement concerné.
- Donnée de QR code dynamique unique incluant école, salle, type, session et timestamp.
- Relation : `logs` (scans étudiants).

### Logs de scan
- UUID, horodatage du scan, références vers session et étudiant.

## Authentification et gestion des utilisateurs

- Les utilisateurs sont chargés via `AuthService`, qui lit/écrit `data/test_users.json` (cache mémoire, hashage des mots de passe) et offre des opérations CRUD pour les admins.
- Connexion : vérifie email/mot de passe, stocke les données minimales en session puis redirige selon le rôle (Admin → équipements, Enseignant → sessions, Étudiant → dashboard).
- Connexion auto pour le développement : route `/auto-login/<role>` force la session pour le premier utilisateur correspondant.
- Déconnexion : supprime l'état de session et renvoie vers `/login`.

## Gestion des équipements (Admin/Enseignant)

- Liste des équipements : `/equipments` (Admin et Enseignant).
- Ajout (Admin) : form POST crée un équipement et génère automatiquement la donnée de QR statique.
- Consultation (Admin/Enseignant) : affiche les détails et rend une image QR code en base64 à partir de la donnée statique.
- Édition (Admin) : met à jour salle/type et régénère la donnée de QR statique.
- Suppression (Admin) : refusée si l'équipement est lié à des sessions existantes.
- API : `/api/equipments` retourne la liste des équipements avec leurs données QR.

## Gestion des sessions

### Vue et création manuelle
- Listing :
  - Admin voit toutes les sessions.
  - Enseignant voit celles qu'il a créées.
  - Étudiant voit celles où il a scanné sa présence.
- Création (Admin/Enseignant) : formulaire prenant un équipement, génère un ID de session et un QR dynamique `SESSION_<école>_<salle>_<type>_<session_id>_<timestamp>`.
- Détails : consultation autorisée pour les admins/enseignants et pour les étudiants ayant au moins un log associé ; inclut les logs triés par horodatage.
- QR code de session :
  - Affichage HTML (`/sessions/<id>/qr-code`).
  - Téléchargement PNG (`/sessions/<id>/qr-code/download`).
  - Réservé aux admins/enseignants.
- Fermeture manuelle : admins et enseignants peuvent clôturer une session (vérification de propriété pour les enseignants) en la marquant inactive et en renseignant `timestamp_fin`.

### Création via scan enseignant
- Route API `/api/scan-equipment` (authentifiée) :
  - Vérifie que le QR scanné correspond à un équipement.
  - Si une session active existe déjà pour cet enseignant et cet équipement, la retourne.
  - Sinon crée une nouvelle session active avec nom généré, timestamps et QR dynamique encodant école, salle, type, id et timestamp.

### Enregistrement des scans étudiants/enseignants
- Endpoint public `/api/scan` (controllers/session) :
  - Avec `qr_data` et `user_id` (enseignant ou étudiant) dans le corps JSON.
  - Si `qr_data` commence par `SESSION_` : enregistre la présence de l'étudiant (une seule fois par session) et retourne les métadonnées de session ; erreur si session inconnue ou scan déjà enregistré.
  - Sinon : traite un scan d'équipement par un enseignant/admin, crée une session minimale avec QR dynamique `SESSION_<uuid>_<timestamp>` et renvoie ses identifiants.

- Endpoint `/api/scan` (controllers/scan) destiné au client mobile :
  - Si le QR correspond à une session active :
    - Utilisateur connecté → enregistre ou ignore un doublon de présence.
    - Utilisateur non connecté → stocke le QR en session et demande la connexion.
  - Si le QR correspond à un équipement statique : renvoie l'équipement détecté.
  - Sinon : message d'échec.

- Confirmation après connexion (`/confirm-scan`) : si un QR de session était en attente, enregistre le scan pour l'étudiant connecté (avec prévention des doublons) ou affiche une erreur si la session est invalide/inactive.

## Dashboards et navigation

- Page d'accueil `/` : redirige les utilisateurs connectés vers `/dashboard`.
- Dashboard `/dashboard` : contenu dépendant du rôle (liste d'équipements/utilisateurs/sessions pour Admin, sessions et équipements pour Enseignant, derniers scans pour Étudiant).
- Pages d'aide : `/about` et `/help`.

## Gestion des utilisateurs (Admin)

- Listing `/users` : récupère les utilisateurs via `AuthService` et les trie par rôle puis nom.
- Création `/users/create` : valide les champs, crée l'utilisateur via `AuthService` (password par défaut 1234 si fourni). Retourne messages de succès/erreur.
- Édition `/users/<id>/edit` : met à jour nom, rôle et mot de passe (avec rehash), après validation et récupération via `AuthService`.
- Suppression `/users/<id>/delete` : impossible de supprimer son propre compte ; délègue la suppression au service (protège le dernier admin).
- APIs :
  - `/api/users` (Admin) renvoie la liste des utilisateurs sans mots de passe.
  - `/api/users/<role>` (Admin/Enseignant) renvoie les utilisateurs filtrés par rôle après validation du rôle demandé.

## Scripts d'administration

- `auto_close_sessions.py` : ferme automatiquement les sessions actives ouvertes depuis plus d'une heure (marque `actif=False`, renseigne `timestamp_fin`).

## Contraintes et messages d'erreur clés

- De nombreuses routes sont protégées par `login_required` et par vérification de rôle.
- Les opérations de création/édition/suppression d'équipement et d'utilisateur sont réservées aux admins.
- Les scans refusent :
  - Données JSON manquantes.
  - Utilisateur inexistant.
  - Rôles non autorisés (ex. étudiant essayant de créer une session via scan d'équipement).
  - Doublons de scan de session pour un étudiant.
