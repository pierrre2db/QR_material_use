import json
import pytest
from app.models import Equipment, Usage, User

def test_get_equipment_list(client, auth_client, equipment):
    """Test de récupération de la liste des équipements."""
    # Test sans authentification
    response = client.get('/api/v1/equipment')
    assert response.status_code == 401  # Non autorisé
    
    # Test avec authentification
    response = auth_client.get('/api/v1/equipment')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'items' in data
    assert len(data['items']) == 1
    assert data['items'][0]['qr_code'] == 'TEST01'

def test_get_equipment_detail(client, auth_client, equipment):
    """Test de récupération des détails d'un équipement."""
    # Test avec un équipement qui n'existe pas
    response = auth_client.get('/api/v1/equipment/INVALID')
    assert response.status_code == 404
    
    # Test avec un équipement existant
    response = auth_client.get(f'/api/v1/equipment/{equipment.qr_code}')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['qr_code'] == equipment.qr_code
    assert data['name'] == equipment.name

def test_scan_equipment(client, auth_client, equipment, user):
    """Test de scan d'un équipement."""
    # Test sans données
    response = auth_client.post('/api/v1/equipment/scan', json={})
    assert response.status_code == 400
    
    # Test avec un code QR invalide
    response = auth_client.post('/api/v1/equipment/scan', json={
        'qr_code': 'INVALID',
        'action': 'scan'
    })
    assert response.status_code == 404
    
    # Test avec une action invalide
    response = auth_client.post('/api/v1/equipment/scan', json={
        'qr_code': equipment.qr_code,
        'action': 'invalid_action'
    })
    assert response.status_code == 400
    
    # Test avec un scan simple
    response = auth_client.post('/api/v1/equipment/scan', json={
        'qr_code': equipment.qr_code,
        'action': 'scan',
        'notes': 'Test de scan simple'
    })
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'message' in data
    assert 'equipment' in data
    assert data['equipment']['qr_code'] == equipment.qr_code
    assert data['equipment']['status'] == 'disponible'  # Le statut ne change pas pour un scan simple
    
    # Test de début de maintenance
    response = auth_client.post('/api/v1/equipment/scan', json={
        'qr_code': equipment.qr_code,
        'action': 'debut_maintenance',
        'notes': 'Début maintenance préventive'
    })
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['equipment']['status'] == 'maintenance'
    
    # Test de fin de maintenance
    response = auth_client.post('/api/v1/equipment/scan', json={
        'qr_code': equipment.qr_code,
        'action': 'fin_maintenance',
        'notes': 'Fin maintenance'
    })
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['equipment']['status'] == 'disponible'
    
    # Vérifier que l'utilisation a été enregistrée
    usage = Usage.query.filter_by(equipment_id=equipment.id).first()
    assert usage is not None
    assert usage.usage_type == 'borrow'
    assert usage.notes == 'Test d\'emprunt'
    assert usage.user_id == user.id

def test_equipment_filters(client, auth_client, app):
    """Test des filtres de recherche d'équipements."""
    # Ajouter des équipements de test
    with app.app_context():
        eq1 = Equipment(
            qr_code='FILT01',
            name='Équipement Filtre 1',
            description='Pour test de filtre',
            status=Equipment.STATUS_AVAILABLE,
            category='test'
        )
        eq2 = Equipment(
            qr_code='FILT02',
            name='Autre équipement',
            description='Un autre équipement',
            status=Equipment.STATUS_MAINTENANCE,
            category='autre'
        )
        db.session.add_all([eq1, eq2])
        db.session.commit()
    
    # Tester le filtre par statut
    response = auth_client.get('/api/v1/equipment?status=maintenance')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data['items']) == 1
    assert data['items'][0]['status'] == 'maintenance'
    
    # Tester la recherche par texte
    response = auth_client.get('/api/v1/equipment?search=filtre')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert any(eq['qr_code'] == 'FILT01' for eq in data['items'])
    
    # Tester la pagination
    response = auth_client.get('/api/v1/equipment?per_page=1&page=2')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['_meta']['per_page'] == 1
    assert data['_meta']['page'] == 2
