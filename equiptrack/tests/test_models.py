import os
import pytest
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta

# Créer une application de test minimale
@pytest.fixture(scope='module')
def app():
    app = Flask(__name__)
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialiser SQLAlchemy
    from app.extensions import db
    db.init_app(app)
    
    # Créer les tables
    with app.app_context():
        db.create_all()
    
    yield app
    
    # Nettoyer
    with app.app_context():
        db.drop_all()

# Base de données de test
@pytest.fixture(scope='module')
def _db(app):
    from app.extensions import db
    with app.app_context():
        yield db

# Client de test
@pytest.fixture(scope='module')
def client(app):
    return app.test_client()

# Session de base de données pour les tests
@pytest.fixture(scope='function')
def session(app, _db):
    with app.app_context():
        _db.session.begin_nested()
        yield _db.session
        _db.session.rollback()
        _db.session.remove()

def test_new_user(app, session):
    """Teste la création d'un nouvel utilisateur"""
    from app.models import User, UserRole
    
    # Créer un utilisateur avec un rôle valide
    user = User(
        username='testuser',
        email='test@example.com',
        first_name='Test',
        last_name='User',
        role='USER',
        is_active=True  # Activer explicitement le compte
    )
    user.set_password('testpass')
    
    # Vérifier que le mot de passe est bien défini
    assert user.password_hash is not None
    assert user.password_hash != 'testpass'
    
    # Vérifier la méthode check_password
    assert user.check_password('testpass') is True
    assert user.check_password('mauvais_mot_de_passe') is False
    
    # Vérifier les propriétés de base
    assert user.username == 'testuser'
    assert user.email == 'test@example.com'
    assert user.is_active is True  # Vérifier que le compte est actif
    assert user.is_admin() is False  # Par défaut, l'utilisateur n'est pas admin
    assert user.role == 'USER'  # Vérifier le rôle
    assert user.full_name == 'Test User'  # Vérifier le nom complet
    assert user.has_role('USER') is True  # Vérifier le rôle avec la méthode has_role
    assert user.has_permission('scan_equipment') is True  # Vérifier une permission de base
    
    # Sauvegarder l'utilisateur
    session.add(user)
    session.commit()
    
    # Vérifier que le mot de passe est correctement vérifié
    assert user.check_password('testpass') is True
    assert user.check_password('WrongPassword') is False
    
    # Vérifier les valeurs par défaut
    assert user.is_active is True
    assert user.is_admin() is False  # Appel de la méthode is_admin()
    
    # Vérifier que le mot de passe est bien haché
    assert user.password_hash is not None
    assert user.password_hash != 'testpass'
    assert len(user.password_hash) > 0

def test_new_equipment(app, session):
    """Teste la création d'un nouvel équipement"""
    from app.models import Equipment
    
    # Utiliser un qr_code unique pour ce test
    equipment = Equipment(
        qr_code='EQ001',
        name='Équipement de test',
        description='Description de test',
        status=Equipment.STATUS_AVAILABLE
    )
    
    # Sauvegarder l'équipement
    session.add(equipment)
    session.commit()
    
    # Vérifier les propriétés de base
    assert equipment.qr_code == 'EQ001'
    assert equipment.name == 'Équipement de test'
    assert equipment.description == 'Description de test'
    assert equipment.status == Equipment.STATUS_AVAILABLE
    assert equipment.status == 'disponible'  # Vérifier la valeur littérale
    
    # Vérifier les valeurs par défaut
    assert equipment.created_at is not None
    assert equipment.updated_at is not None

def test_equipment_status_transitions(app, session):
    """Teste les transitions de statut des équipements"""
    from app.models import Equipment
    
    # Créer un équipement avec un statut initial
    equipment = Equipment(
        qr_code='EQ002',  # Utiliser un qr_code unique
        name='Test Equipment',
        status=Equipment.STATUS_AVAILABLE
    )
    
    # Sauvegarder l'équipement
    session.add(equipment)
    session.commit()
    
    # Vérifier le statut initial
    assert equipment.status == 'disponible'
    assert equipment.status == Equipment.STATUS_AVAILABLE
    
    # Tester le passage en maintenance
    equipment.status = Equipment.STATUS_MAINTENANCE
    session.commit()
    assert equipment.status == 'maintenance'
    
    # Tester le retour en service
    equipment.status = Equipment.STATUS_AVAILABLE
    session.commit()
    assert equipment.status == 'disponible'
    
    # Tester le passage en hors service
    equipment.status = Equipment.STATUS_OUT_OF_ORDER
    session.commit()
    assert equipment.status == 'hors_service'
    
    # Vérifier que seuls les statuts valides sont acceptés
    try:
        equipment.status = 'statut_invalide'
        session.commit()
        assert False, "Un statut invalide ne devrait pas être accepté"
    except ValueError:
        session.rollback()
        assert True  # Comportement attendu

def test_usage_creation(app, session):
    """Teste la création d'une entrée d'utilisation"""
    from app.models import User, Equipment, Usage
    
    # Créer d'abord l'utilisateur et l'équipement
    user = User(
        username='testuser_usage',  # Nom d'utilisateur unique
        email='usage@example.com',  # Email unique
        first_name='Test',
        last_name='Usage',
        role='USER',
        is_active=True
    )
    user.set_password('testpass')
    
    equipment = Equipment(
        qr_code='EQTEST001',  # Utiliser un qr_code unique
        name='Équipement de test pour usage',
        status=Equipment.STATUS_AVAILABLE
    )

    # Ajouter à la session et sauvegarder pour obtenir les IDs
    session.add_all([user, equipment])
    session.commit()

    # Créer une entrée d'utilisation
    usage = Usage(
        equipment_id=equipment.id,
        user_id=user.id,
        usage_type=Usage.TYPE_SCAN,
        notes='Test scan',
        user_name=user.username  # S'assurer que le nom d'utilisateur est défini
    )
    session.add(usage)
    session.commit()

    # Vérifier que l'utilisation a été correctement créée
    assert usage.id is not None
    assert usage.equipment_id == equipment.id
    assert usage.user_id == user.id
    assert usage.usage_type == Usage.TYPE_SCAN
    assert usage.notes == 'Test scan'
    assert usage.user_name == user.username
    assert isinstance(usage.timestamp, datetime)
    
    # Recharger les objets depuis la base de données pour tester les relations
    usage_from_db = session.get(Usage, usage.id)
    
    # Vérifier la relation avec l'équipement
    assert usage_from_db.equipment_ref.id == equipment.id
    assert usage_from_db in equipment.usages
    
    # Vérifier la relation avec l'utilisateur
    assert usage_from_db.user_ref.id == user.id
    assert usage_from_db in user.usages
    
    # Vérifier que le nom d'utilisateur est bien copié
    assert usage_from_db.user_name == user.username
