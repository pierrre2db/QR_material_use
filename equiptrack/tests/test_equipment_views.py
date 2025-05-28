# -*- coding: utf-8 -*-
import pytest
from flask import url_for, get_flashed_messages
from app.models import Equipment, Usage, db

def test_equipment_list_page(auth_client, equipment):
    """Test de la page de liste des équipements."""
    response = auth_client.get('/equipment/equipment')
    assert response.status_code == 200
    assert b'Liste des equipements' in response.data
    assert equipment.qr_code.encode('utf-8') in response.data
    assert equipment.name.encode('utf-8') in response.data

def test_equipment_detail_page(auth_client, equipment, user):
    """Test de la page de détail d'un équipement."""
    # Tester avec un QR code invalide
    response = auth_client.get('/equipment/equipment/invalid_qr_code')
    assert response.status_code == 404
    
    # Tester avec un équipement existant
    response = auth_client.get(f'/equipment/equipment/{equipment.qr_code}')
    assert response.status_code == 200
    assert equipment.name.encode('utf-8') in response.data
    assert equipment.description.encode('utf-8') in response.data

def test_scan_equipment(auth_client, equipment, user):
    """Test de la fonctionnalité de scan d'équipement."""
    # Tester l'affichage du formulaire de scan
    response = auth_client.get('/equipment/equipment/scan')
    assert response.status_code == 200
    assert b'Scanner un equipement' in response.data
    
    # Tester avec un code QR invalide
    response = auth_client.post('/equipment/equipment/scan', data={
        'qr_code': 'invalid_qr_code',
        'action': 'scan',
        'notes': 'Test de scan'
    }, follow_redirects=True)
    
    assert response.status_code == 200
    assert b'Equipement non trouve' in response.data
    
    # Tester avec une action invalide
    response = auth_client.post('/equipment/equipment/scan', data={
        'qr_code': equipment.qr_code,
        'action': 'invalid_action',
        'notes': 'Test action invalide'
    }, follow_redirects=True)
    
    assert response.status_code == 200
    assert b'Action non valide' in response.data
    
    # Tester avec un scan simple
    response = auth_client.post('/equipment/equipment/scan', data={
        'qr_code': equipment.qr_code,
        'action': 'scan',
        'notes': 'Test de scan simple'
    }, follow_redirects=True)
    
    assert response.status_code == 200
    assert b'Action enregistree avec succes' in response.data
    
    # Tester le début de maintenance
    response = auth_client.post('/equipment/equipment/scan', data={
        'qr_code': equipment.qr_code,
        'action': 'debut_maintenance',
        'notes': 'Début maintenance préventive'
    }, follow_redirects=True)
    
    assert response.status_code == 200
    assert b'Action enregistree avec succes' in response.data
    
    # Vérifier que le statut a été mis à jour
    response = auth_client.get(f'/equipment/equipment/{equipment.qr_code}')
    assert b'En maintenance' in response.data
    
    # Tester la fin de maintenance
    response = auth_client.post('/equipment/equipment/scan', data={
        'qr_code': equipment.qr_code,
        'action': 'fin_maintenance',
        'notes': 'Fin maintenance'
    }, follow_redirects=True)
    
    assert response.status_code == 200
    assert b'Action enregistree avec succes' in response.data
    
    # Vérifier que l'utilisation a été enregistrée
    usage = Usage.query.filter_by(equipment_id=equipment.id).first()
    assert usage is not None
    assert usage.usage_type == 'borrow'
    assert usage.notes == 'Test d\'emprunt'
    assert usage.user_id == user.id

def test_equipment_search(auth_client, app, user):
    """Test des fonctionnalités de recherche et de filtrage."""
    # Créer des équipements de test
    equipment1 = Equipment(
        qr_code='SEARCH123',
        name='Équipement de recherche',
        description='Pour tester la recherche',
        status='available'
    )
    equipment2 = Equipment(
        qr_code='MAINT456',
        name='Autre équipement',
        description='En maintenance',
        status='maintenance'
    )
    
    with app.app_context():
        db.session.add(equipment1)
        db.session.add(equipment2)
        db.session.commit()
    
    # Tester la recherche par nom
    response = auth_client.get('/equipment/equipment?q=recherche')
    assert response.status_code == 200
    assert b'Equipement de recherche' in response.data
    assert b'Autre equipement' not in response.data
    
    # Tester le filtre par statut
    response = auth_client.get('/equipment/equipment?status=maintenance')
    assert response.status_code == 200
    assert b'Equipement de recherche' not in response.data
    assert b'Autre equipement' in response.data
