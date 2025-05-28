"""
Script pour tester les contraintes de la base de données.

Ce script permet de :
1. Ajouter des données de test
2. Tester les contraintes de clés étrangères
3. Vérifier le comportement des suppressions
"""

from datetime import datetime, timedelta
from app.extensions import db
from app.models import User, Equipment, Usage
from sqlalchemy import text

# Configuration minimale de l'application
from flask import Flask
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instance/equiptrack.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'dev-key-123'

db.init_app(app)

def create_test_data():
    """Crée des données de test dans la base de données."""
    print("\n=== Création des données de test ===")
    
    # Création d'utilisateurs
    user1 = User(
        username='test_user1',
        email='user1@example.com',
        first_name='Test',
        last_name='User1',
        role='user',
        is_active=True,
        password_hash='dummy_hash',
        last_password_change=datetime.utcnow()
    )
    
    user2 = User(
        username='test_user2',
        email='user2@example.com',
        first_name='Test',
        last_name='User2',
        role='admin',
        is_active=True,
        password_hash='dummy_hash',
        last_password_change=datetime.utcnow()
    )
    
    db.session.add_all([user1, user2])
    db.session.commit()
    print(f"Utilisateurs créés: {user1.username}, {user2.username}")
    
    # Création d'équipements
    equip1 = Equipment(
        qr_code='EQ1234',
        name='Ordinateur portable',
        description='PC portable HP EliteBook',
        status='available',
        category='Informatique',
        location='Bureau 101',
        purchase_date=datetime.utcnow().date(),
        serial_number='SN12345678'
    )
    
    equip2 = Equipment(
        qr_code='EQ5678',
        name='Projecteur',
        description='Projecteur Epson EB-U42',
        status='available',
        category='Audiovisuel',
        location='Salle de réunion A',
        purchase_date=datetime.utcnow().date(),
        serial_number='SN87654321'
    )
    
    db.session.add_all([equip1, equip2])
    db.session.commit()
    print(f"Équipements créés: {equip1.name}, {equip2.name}")
    
    # Création d'utilisations
    usage1 = Usage(
        equipment_id=equip1.id,
        user_id=user1.id,
        user_name=f"{user1.first_name} {user1.last_name}",
        usage_type='checkout',
        notes='Prêt pour formation',
        timestamp=datetime.utcnow()
    )
    
    usage2 = Usage(
        equipment_id=equip2.id,
        user_id=user2.id,
        user_name=f"{user2.first_name} {user2.last_name}",
        usage_type='checkout',
        notes='Pour réunion client',
        timestamp=datetime.utcnow()
    )
    
    db.session.add_all([usage1, usage2])
    db.session.commit()
    print(f"Utilisations créées: {usage1.id}, {usage2.id}")
    
    return user1.id, user2.id, equip1.id, equip2.id, usage1.id, usage2.id

def test_foreign_key_constraints():
    """Teste les contraintes de clés étrangères."""
    print("\n=== Test des contraintes de clés étrangères ===")
    
    # 1. Vérifier que les données sont bien insérées
    users = User.query.all()
    equipments = Equipment.query.all()
    usages = Usage.query.all()
    
    print(f"Utilisateurs: {len(users)}")
    print(f"Équipements: {len(equipments)}")
    print(f"Utilisations: {len(usages)}")
    
    # 2. Tester la suppression d'un utilisateur (devrait mettre user_id à NULL dans usages)
    print("\nTest 1: Suppression d'un utilisateur avec des usages")
    user_to_delete = User.query.filter_by(username='test_user1').first()
    if user_to_delete:
        user_id = user_to_delete.id
        print(f"Suppression de l'utilisateur {user_to_delete.username} (ID: {user_id})")
        db.session.delete(user_to_delete)
        db.session.commit()
        
        # Vérifier que l'usage associé a bien user_id = NULL
        usage = Usage.query.filter_by(user_name='Test User1').first()
        print(f"Après suppression - user_id dans l'usage: {usage.user_id} (devrait être None)")
    
    # 3. Tester la suppression d'un équipement (devrait supprimer les usages associés)
    print("\nTest 2: Suppression d'un équipement avec des usages")
    equip_to_delete = Equipment.query.filter_by(qr_code='EQ5678').first()
    if equip_to_delete:
        equip_id = equip_to_delete.id
        print(f"Suppression de l'équipement {equip_to_delete.name} (ID: {equip_id})")
        db.session.delete(equip_to_delete)
        db.session.commit()
        
        # Vérifier que l'usage associé a bien été supprimé
        usage = Usage.query.filter_by(equipment_id=equip_id).first()
        print(f"Après suppression - Nombre d'usages pour l'équipement {equip_id}: {0 if usage is None else 1} (devrait être 0)")

def main():
    # Créer un contexte d'application
    with app.app_context():
        # Activer les contraintes de clés étrangères
        db.session.execute(text('PRAGMA foreign_keys = ON'))
        db.create_all()  # Créer les tables si elles n'existent pas
        db.session.commit()  # Valider les changements
    
    # Nettoyer les anciennes données de test
    print("Nettoyage des anciennes données de test...")
    Usage.query.delete()
    User.query.filter(User.username.in_(['test_user1', 'test_user2'])).delete(synchronize_session=False)
    Equipment.query.filter(Equipment.qr_code.in_(['EQ1234', 'EQ5678'])).delete(synchronize_session=False)
    db.session.commit()
    
    try:
        # Créer et tester les données
        ids = create_test_data()
        test_foreign_key_constraints()
        print("\n=== Tous les tests ont été exécutés avec succès ===")
    except Exception as e:
        print(f"\n!!! Une erreur s'est produite: {str(e)}")
        db.session.rollback()
    finally:
        # Nettoyer après les tests
        print("\nNettoyage après les tests...")
        Usage.query.delete()
        User.query.filter(User.username.in_(['test_user1', 'test_user2'])).delete(synchronize_session=False)
        Equipment.query.filter(Equipment.qr_code.in_(['EQ1234', 'EQ5678'])).delete(synchronize_session=False)
        db.session.commit()

if __name__ == '__main__':
    main()
