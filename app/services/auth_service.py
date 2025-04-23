import json
import os
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

load_dotenv()

class AuthService:
    """Service pour gérer l'authentification des utilisateurs via un fichier JSON local"""
    
    def __init__(self):
        self._users_cache = None
        self._cache_expiry = None
        self.test_users_file = 'data/test_users.json'
        
        # Créer le répertoire data s'il n'existe pas
        if not os.path.exists('data'):
            os.makedirs('data')
            
        # Créer le fichier d'utilisateurs de test s'il n'existe pas
        if not os.path.exists(self.test_users_file):
            self.create_test_users_file()
    
    def get_users(self, force_refresh=False):
        """Récupère la liste des utilisateurs depuis le fichier JSON local"""
        import time
        
        # Durée de validité du cache en secondes (5 minutes par défaut)
        cache_duration = int(os.environ.get('USERS_CACHE_DURATION', 300))
        
        current_time = time.time()
        
        # Si le cache est expiré ou si on force le rafraîchissement
        if force_refresh or self._users_cache is None or self._cache_expiry is None or current_time > self._cache_expiry:
            try:
                # Charger les utilisateurs depuis le fichier JSON
                if os.path.exists(self.test_users_file):
                    with open(self.test_users_file, 'r') as f:
                        self._users_cache = json.load(f)
                else:
                    # Si le fichier n'existe pas, créer des utilisateurs de test
                    self._users_cache = self.create_test_users_file()
                
                self._cache_expiry = current_time + cache_duration
            except Exception as e:
                print(f"Erreur lors de la récupération des utilisateurs: {e}")
                return []
        
        return self._users_cache
    
    def authenticate_user(self, email, password):
        """Authentifie un utilisateur avec son email et son mot de passe"""
        users = self.get_users()
        
        for user in users:
            if user['id'].lower() == email.lower():
                # Si le mot de passe est '1234' (par défaut), on le compare directement
                if user['password'] == '1234' and password == '1234':
                    return user
                # Sinon, on vérifie si le mot de passe est correct
                elif 'password_hash' in user and check_password_hash(user['password_hash'], password):
                    return user
                # Si le mot de passe est stocké en clair dans le fichier (non recommandé)
                elif user['password'] == password:
                    return user
                
                return None  # Mot de passe incorrect
        
        return None  # Utilisateur non trouvé
    
    def get_user_by_id(self, user_id):
        """Récupère un utilisateur par son ID"""
        users = self.get_users()
        
        for user in users:
            if user['id'].lower() == user_id.lower():
                return user
        
        return None  # Utilisateur non trouvé
    
    def create_user(self, email, nom_complet, role, password):
        """Crée un nouvel utilisateur"""
        # Vérifier si l'utilisateur existe déjà
        if self.get_user_by_id(email):
            return False, "Un utilisateur avec cet email existe déjà"
        
        # Vérifier si le rôle est valide
        valid_roles = ["Admin", "Enseignant", "Etudiant"]
        if role not in valid_roles:
            return False, f"Le rôle doit être l'un des suivants : {', '.join(valid_roles)}"
        
        # Créer le nouvel utilisateur
        new_user = {
            "id": email,
            "nom_complet": nom_complet,
            "role": role,
            "password": password,
            "password_hash": generate_password_hash(password)
        }
        
        # Ajouter l'utilisateur à la liste
        users = self.get_users(force_refresh=True)
        users.append(new_user)
        
        # Enregistrer la liste mise à jour
        try:
            with open(self.test_users_file, 'w') as f:
                json.dump(users, f, indent=4)
            
            # Rafraîchir le cache
            self._users_cache = users
            
            return True, "Utilisateur créé avec succès"
        except Exception as e:
            return False, f"Erreur lors de la création de l'utilisateur : {str(e)}"
    
    def update_user(self, email, nom_complet=None, role=None, password=None):
        """Met à jour un utilisateur existant"""
        # Récupérer tous les utilisateurs
        users = self.get_users(force_refresh=True)
        
        # Chercher l'utilisateur à mettre à jour
        for i, user in enumerate(users):
            if user['id'].lower() == email.lower():
                # Mettre à jour les champs fournis
                if nom_complet:
                    user['nom_complet'] = nom_complet
                
                if role:
                    valid_roles = ["Admin", "Enseignant", "Etudiant"]
                    if role not in valid_roles:
                        return False, f"Le rôle doit être l'un des suivants : {', '.join(valid_roles)}"
                    user['role'] = role
                
                if password:
                    user['password'] = password
                    user['password_hash'] = generate_password_hash(password)
                
                # Enregistrer les modifications
                try:
                    with open(self.test_users_file, 'w') as f:
                        json.dump(users, f, indent=4)
                    
                    # Rafraîchir le cache
                    self._users_cache = users
                    
                    return True, "Utilisateur mis à jour avec succès"
                except Exception as e:
                    return False, f"Erreur lors de la mise à jour de l'utilisateur : {str(e)}"
        
        return False, "Utilisateur non trouvé"
    
    def delete_user(self, email):
        """Supprime un utilisateur"""
        # Récupérer tous les utilisateurs
        users = self.get_users(force_refresh=True)
        
        # Chercher l'utilisateur à supprimer
        for i, user in enumerate(users):
            if user['id'].lower() == email.lower():
                # Vérifier si c'est le dernier administrateur
                if user['role'] == 'Admin' and len([u for u in users if u['role'] == 'Admin']) <= 1:
                    return False, "Impossible de supprimer le dernier administrateur"
                
                # Supprimer l'utilisateur
                users.pop(i)
                
                # Enregistrer les modifications
                try:
                    with open(self.test_users_file, 'w') as f:
                        json.dump(users, f, indent=4)
                    
                    # Rafraîchir le cache
                    self._users_cache = users
                    
                    return True, "Utilisateur supprimé avec succès"
                except Exception as e:
                    return False, f"Erreur lors de la suppression de l'utilisateur : {str(e)}"
        
        return False, "Utilisateur non trouvé"
    
    def get_users_by_role(self, role):
        """Récupère tous les utilisateurs ayant un rôle spécifique"""
        users = self.get_users()
        return [user for user in users if user['role'] == role]
    
    def create_test_users_file(self):
        """Crée un fichier de test pour les utilisateurs"""
        test_users = [
            {"id": "admin@ecole.be", "nom_complet": "Administrateur", "role": "Admin", "password": "1234", "password_hash": generate_password_hash("1234")},
            {"id": "prof1@ecole.be", "nom_complet": "Jean Dupont", "role": "Enseignant", "password": "1234", "password_hash": generate_password_hash("1234")},
            {"id": "prof2@ecole.be", "nom_complet": "Marie Curie", "role": "Enseignant", "password": "1234", "password_hash": generate_password_hash("1234")},
            {"id": "prof3@ecole.be", "nom_complet": "Albert Einstein", "role": "Enseignant", "password": "1234", "password_hash": generate_password_hash("1234")},
            {"id": "etudiant1@ecole.be", "nom_complet": "Pierre Martin", "role": "Etudiant", "password": "1234", "password_hash": generate_password_hash("1234")},
            {"id": "etudiant2@ecole.be", "nom_complet": "Sophie Dubois", "role": "Etudiant", "password": "1234", "password_hash": generate_password_hash("1234")},
            {"id": "etudiant3@ecole.be", "nom_complet": "Lucas Bernard", "role": "Etudiant", "password": "1234", "password_hash": generate_password_hash("1234")}
        ]
        
        # Écrire les utilisateurs dans un fichier JSON
        with open(self.test_users_file, 'w') as f:
            json.dump(test_users, f, indent=4)
        
        return test_users
