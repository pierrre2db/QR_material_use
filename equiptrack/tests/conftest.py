import os
import tempfile
import pytest
from app import create_app, db
from app.models import User, Equipment
from config import TestingConfig as TestConfig

@pytest.fixture(scope='module')
def app():
    """Crée et configure une nouvelle instance d'application pour les tests."""
    # Crée un fichier temporaire pour isoler la base de données
    db_fd, db_path = tempfile.mkstemp()
    
    # Configuration de test
    test_config = {
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}',
        'WTF_CSRF_ENABLED': False,
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'SECRET_KEY': 'test-secret-key'
    }
    
    # Crée l'application avec la configuration de test
    app = create_app(test_config)
    
    # Crée la base de données et charge les données de test
    with app.app_context():
        db.create_all()
        # Ajoute un utilisateur de test
        user = User(
            username='testuser', 
            email='test@example.com',
            is_admin=True
        )
        user.set_password('testpass')
        db.session.add(user)
        
        # Ajoute un équipement de test
        equipment = Equipment(
            qr_code='TEST01',
            name='Équipement de test',
            description='Un équipement pour les tests',
            status=Equipment.STATUS_AVAILABLE
        )
        db.session.add(equipment)
        
        db.session.commit()

    yield app

    # Nettoie la base de données
    os.close(db_fd)
    try:
        os.unlink(db_path)
    except Exception:
        pass

@pytest.fixture
def client(app):
    """Un client de test pour l'application."""
    with app.test_client() as client:
        with app.app_context():
            yield client

@pytest.fixture
def auth_client(client):
    """Un client de test avec un utilisateur authentifié."""
    client.post('/auth/login', data={
        'username': 'testuser',
        'password': 'testpass'
    }, follow_redirects=True)
    return client

@pytest.fixture
def runner(app):
    """Un test runner pour les commandes CLI."""
    return app.test_cli_runner()

@pytest.fixture
def user(app):
    """Un utilisateur de test."""
    return User.query.filter_by(username='testuser').first()

@pytest.fixture
def equipment(app):
    """Un équipement de test."""
    return Equipment.query.filter_by(qr_code='TEST01').first()
