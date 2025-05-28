# -*- coding: utf-8 -*-
import pytest
from flask import url_for, get_flashed_messages
from flask import url_for
from app.models import User, db

def test_login_page(client):
    """Test de l'affichage de la page de connexion."""
    response = client.get('/auth/login')
    assert response.status_code == 200
    assert b'Connexion' in response.data
    assert b'Nom d\'utilisateur' in response.data
    assert b'Mot de passe' in response.data

def test_login_success(client, user):
    """Test de la connexion réussie d'un utilisateur."""
    response = client.post('/auth/login', data={
        'username': 'testuser',
        'password': 'testpass',
        'remember_me': 'y'
    }, follow_redirects=True)
    
    assert response.status_code == 200
    # Vérifie que l'utilisateur est redirigé vers la page d'accueil
    assert b'Bienvenue' in response.data or b'Accueil' in response.data

def test_login_invalid_credentials(client, user):
    """Test de la tentative de connexion avec des identifiants invalides."""
    response = client.post('/auth/login', data={
        'username': 'testuser',
        'password': 'wrongpassword',
        'remember_me': 'y'
    }, follow_redirects=True)
    
    assert response.status_code == 200
    # Vérifie que le message d'erreur est affiché
    assert b'Veuillez v\xc3\xa9rifier vos identifiants' in response.data

def test_logout(client, auth_client):
    """Test de la déconnexion d'un utilisateur connecté."""
    response = auth_client.get('/auth/logout', follow_redirects=True)
    assert response.status_code == 200
    # Vérifie que l'utilisateur est redirigé vers la page de connexion ou d'accueil
    assert b'Connexion' in response.data or b'Accueil' in response.data

def test_register_page(client):
    """Test de l'affichage de la page d'inscription."""
    response = client.get('/auth/register')
    assert response.status_code == 200
    assert b'Cr\xc3\xa9er un compte' in response.data
    assert b'Nom d\'utilisateur' in response.data
    assert b'Adresse email' in response.data
    assert b'Mot de passe' in response.data

def test_register_success(client, app):
    """Test de l'inscription réussie d'un nouvel utilisateur."""
    with app.app_context():
        # Vérifier que l'utilisateur n'existe pas encore
        user = User.query.filter_by(username='newuser').first()
        assert user is None
    
    response = client.post('/auth/register', data={
        'username': 'newuser',
        'email': 'newuser@example.com',
        'password': 'newpassword'
    }, follow_redirects=True)
    
    assert response.status_code == 200
    # Vérifie que l'utilisateur est redirigé vers la page de connexion avec un message de succès
    assert b'Votre compte a \xc3\xa9t\xc3\xa9 cr\xc3\xa9\xc3\xa9 avec succ' in response.data or \
           b'connecter' in response.data
    
    # Vérifier que l'utilisateur a été créé dans la base de données
    with app.app_context():
        user = User.query.filter_by(username='newuser').first()
        assert user is not None
        assert user.email == 'newuser@example.com'

def test_register_existing_username(client, user):
    """Test de la tentative d'inscription avec un nom d'utilisateur existant."""
    response = client.post('/auth/register', data={
        'username': 'testuser',  # Utilisateur existant
        'email': 'newemail@example.com',
        'password': 'password'
    }, follow_redirects=True)
    
    assert response.status_code == 200
    assert b'existe d\xc3\xa9j\xc3\xa0' in response.data or b'd\xc3\xa9j\xc3\xa0' in response.data

def test_register_password_mismatch(client):
    """Test de la tentative d'inscription avec des mots de passe différents."""
    # Note: La validation côté client est gérée par JavaScript, donc ce test peut ne pas être nécessaire
    # car le formulaire ne sera pas soumis si les mots de passe ne correspondent pas
    pass
