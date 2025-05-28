import pytest
from datetime import datetime, timedelta
from app.models import User, Equipment, Usage, db

def test_user_model(app):
    """Test du modèle User avec plus de détails."""
    with app.app_context():
        # Test de création d'utilisateur
        user = User(
            username='testuser2',
            email='test2@example.com',
            is_admin=False
        )
        user.set_password('testpass')
        db.session.add(user)
        db.session.commit()
        
        # Vérifier que l'utilisateur existe
        assert user.id is not None
        assert user.check_password('testpass')
        assert not user.check_password('wrongpass')
        
        # Vérifier le jeton de réinitialisation
        token = user.get_reset_token()
        assert token is not None
        assert User.verify_reset_token(token) == user
        
        # Vérifier le format de sortie
        user_dict = user.to_dict()
        assert user_dict['username'] == 'testuser2'
        assert 'password_hash' not in user_dict

def test_equipment_model(app):
    """Test du modèle Equipment avec plus de détails."""
    with app.app_context():
        # Créer un équipement
        equipment = Equipment(
            qr_code='EQPTEST',
            name='Équipement de test',
            description='Description de test',
            status=Equipment.STATUS_AVAILABLE,
            category='test',
            purchase_date=datetime.utcnow().date(),
            purchase_price=100.50
        )
        db.session.add(equipment)
        db.session.commit()
        
        # Vérifier les propriétés
        assert equipment.is_available
        assert equipment.current_usage is None
        
        # Tester la sérialisation
        eq_dict = equipment.to_dict()
        assert eq_dict['qr_code'] == 'EQPTEST'
        assert eq_dict['is_available'] is True
        
        # Tester la sérialisation avec les usages
        eq_dict_with_usages = equipment.to_dict(include_usages=True)
        assert 'usages' in eq_dict_with_usages
        assert isinstance(eq_dict_with_usages['usages'], list)

def test_usage_model(app, user, equipment):
    """Test du modèle Usage avec plus de détails."""
    with app.app_context():
        # Créer une utilisation
        usage = Usage(
            equipment_id=equipment.id,
            user_id=user.id,
            usage_type=Usage.TYPE_BORROW,
            notes='Test d\'emprunt',
            timestamp=datetime.utcnow()
        )
        db.session.add(usage)
        db.session.commit()
        
        # Vérifier les relations
        assert usage.equipment_ref.id == equipment.id
        assert usage.user_ref.id == user.id
        assert equipment.usages[0].id == usage.id
        assert user.usages[0].id == usage.id
        
        # Tester la sérialisation
        usage_dict = usage.to_dict()
        assert usage_dict['usage_type'] == Usage.TYPE_BORROW
        assert usage_dict['user'] == user.username
        assert 'timestamp' in usage_dict

def test_equipment_current_usage(app, user, equipment):
    """Test de la propriété current_usage de l'équipement."""
    with app.app_context():
        # Vérifier qu'il n'y a pas d'utilisation en cours
        assert equipment.current_usage is None
        
        # Ajouter une utilisation
        usage = Usage(
            equipment_id=equipment.id,
            user_id=user.id,
            usage_type=Usage.TYPE_BORROW,
            notes='Test d\'emprunt',
            timestamp=datetime.utcnow()
        )
        db.session.add(usage)
        equipment.status = Equipment.STATUS_BORROWED
        db.session.commit()
        
        # Vérifier que l'utilisation en cours est bien retournée
        current = equipment.current_usage
        assert current is not None
        assert current.usage_type == Usage.TYPE_BORROW
        assert current.user_id == user.id
