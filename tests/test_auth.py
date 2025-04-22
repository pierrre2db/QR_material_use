import unittest
import os
import sys
import json
from flask import session

# Ajouter le répertoire parent au chemin pour pouvoir importer l'application
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.services.auth_service import AuthService

class AuthTestCase(unittest.TestCase):
    """Tests pour le système d'authentification"""

    def setUp(self):
        """Configuration avant chaque test"""
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False  # Désactiver la protection CSRF pour les tests
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        
        # S'assurer que le fichier des utilisateurs de test existe
        self.auth_service = AuthService()
        self.auth_service.create_test_users_file()
        
        # Charger les utilisateurs de test pour les utiliser dans les tests
        with open('data/test_users.json', 'r') as f:
            self.test_users = json.load(f)

    def tearDown(self):
        """Nettoyage après chaque test"""
        self.app_context.pop()

    def test_auth_service_initialization(self):
        """Tester que le service d'authentification est correctement initialisé"""
        auth_service = AuthService()
        users = auth_service.get_users()
        self.assertTrue(len(users) > 0, "Le service d'authentification devrait retourner des utilisateurs")
        
        # Vérifier que les utilisateurs attendus sont présents
        user_ids = [user['id'] for user in users]
        self.assertIn('admin@ecole.be', user_ids)
        self.assertIn('prof1@ecole.be', user_ids)
        self.assertIn('etudiant1@ecole.be', user_ids)

    def test_authenticate_user_success(self):
        """Tester l'authentification réussie d'un utilisateur"""
        auth_service = AuthService()
        
        # Tester l'authentification pour chaque type d'utilisateur
        for user in self.test_users:
            authenticated_user = auth_service.authenticate_user(user['id'], '1234')
            self.assertIsNotNone(authenticated_user, f"L'authentification a échoué pour {user['id']}")
            self.assertEqual(authenticated_user['id'], user['id'])
            self.assertEqual(authenticated_user['role'], user['role'])

    def test_authenticate_user_failure(self):
        """Tester l'échec d'authentification avec un mot de passe incorrect"""
        auth_service = AuthService()
        
        # Tester avec un mot de passe incorrect
        for user in self.test_users:
            authenticated_user = auth_service.authenticate_user(user['id'], 'wrong_password')
            self.assertIsNone(authenticated_user, f"L'authentification devrait échouer pour {user['id']} avec un mot de passe incorrect")
        
        # Tester avec un utilisateur inexistant
        authenticated_user = auth_service.authenticate_user('nonexistent@ecole.be', '1234')
        self.assertIsNone(authenticated_user, "L'authentification devrait échouer pour un utilisateur inexistant")

    def test_login_page_loads(self):
        """Tester que la page de connexion se charge correctement"""
        response = self.client.get('/login')
        self.assertEqual(response.status_code, 200)
        self.assertIn('Connexion', response.data.decode())

    def test_login_success_admin(self):
        """Tester la connexion réussie d'un administrateur"""
        response = self.client.post('/login', data={
            'email': 'admin@ecole.be',
            'password': '1234'
        }, follow_redirects=True)
        
        self.assertEqual(response.status_code, 200)
        # Vérifier que nous sommes redirigés vers une page après la connexion
        # Pas besoin de vérifier le contenu exact, juste que la connexion a réussi
        self.assertNotIn('Identifiants incorrects', response.data.decode())

    def test_login_success_teacher(self):
        """Tester la connexion réussie d'un enseignant"""
        response = self.client.post('/login', data={
            'email': 'prof1@ecole.be',
            'password': '1234'
        }, follow_redirects=True)
        
        self.assertEqual(response.status_code, 200)
        # Vérifier que nous sommes redirigés vers une page après la connexion
        self.assertNotIn('Identifiants incorrects', response.data.decode())

    def test_login_success_student(self):
        """Tester la connexion réussie d'un étudiant"""
        response = self.client.post('/login', data={
            'email': 'etudiant1@ecole.be',
            'password': '1234'
        }, follow_redirects=True)
        
        self.assertEqual(response.status_code, 200)
        # Vérifier que nous sommes redirigés vers une page après la connexion
        self.assertNotIn('Identifiants incorrects', response.data.decode())

    def test_login_failure(self):
        """Tester l'échec de connexion avec des identifiants incorrects"""
        response = self.client.post('/login', data={
            'email': 'admin@ecole.be',
            'password': 'wrong_password'
        }, follow_redirects=True)
        
        self.assertEqual(response.status_code, 200)
        # Vérifier que nous restons sur la page de connexion avec un message d'erreur
        self.assertIn('Identifiants incorrects', response.data.decode())

    def test_auto_login(self):
        """Tester la fonctionnalité de connexion automatique par rôle"""
        # Tester la connexion automatique en tant qu'administrateur
        response = self.client.get('/auto-login/admin', follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        
        # Déconnexion
        self.client.get('/logout', follow_redirects=True)
        
        # Tester la connexion automatique en tant qu'enseignant
        response = self.client.get('/auto-login/teacher', follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        
        # Déconnexion
        self.client.get('/logout', follow_redirects=True)
        
        # Tester la connexion automatique en tant qu'étudiant
        response = self.client.get('/auto-login/student', follow_redirects=True)
        self.assertEqual(response.status_code, 200)

    def test_logout(self):
        """Tester la déconnexion"""
        # D'abord se connecter
        self.client.post('/login', data={
            'email': 'admin@ecole.be',
            'password': '1234'
        }, follow_redirects=True)
        
        # Puis se déconnecter
        response = self.client.get('/logout', follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        # Vérifier que nous sommes redirigés vers la page de connexion
        self.assertIn('login', response.request.path)

if __name__ == '__main__':
    unittest.main()
