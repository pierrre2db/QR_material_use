"""
Script d'initialisation de la base de données avec des exemples d'équipements.
"""
import os
import json
from datetime import datetime, timedelta
import random

# Créer le dossier data s'il n'existe pas
os.makedirs('data', exist_ok=True)

# Données des équipements (exemples)
equipments = [
    {
        'id': 'EQ0001',
        'name': 'Vidéoprojecteur EPSON',
        'description': 'Vidéoprojecteur HD, salle 101',
        'qr_code': 'EQ0001',
        'created_at': '2024-01-15T09:00:00',
        'location': 'Salle 101',
        'category': 'Vidéoprojecteur'
    },
    {
        'id': 'EQ0002',
        'name': 'Ordinateur portable HP',
        'description': 'HP EliteBook 840 G5, 16GB RAM',
        'qr_code': 'EQ0002',
        'created_at': '2024-01-20T10:30:00',
        'location': 'Bureau des professeurs',
        'category': 'Ordinateur'
    },
    {
        'id': 'EQ0003',
        'name': 'Tablette Samsung',
        'description': 'Tablette Galaxy Tab S7, écran 11\"',
        'qr_code': 'EQ0003',
        'created_at': '2024-02-01T14:15:00',
        'location': 'Salle multimédia',
        'category': 'Tablette'
    },
    {
        'id': 'EQ0004',
        'name': 'Enceinte Bluetooth',
        'description': 'Enceinte JBL Charge 4',
        'qr_code': 'EQ0004',
        'created_at': '2024-02-10T11:20:00',
        'location': 'Salle de conférence',
        'category': 'Audio'
    },
    {
        'id': 'EQ0005',
        'name': 'Appareil photo Canon',
        'description': 'Canon EOS 2000D avec objectif 18-55mm',
        'qr_code': 'EQ0005',
        'created_at': '2024-02-15T13:45:00',
        'location': 'Club photo',
        'category': 'Photo'
    }
]

# Générer des données d'utilisation aléatoires
def generate_usage_data():
    usages = []
    start_date = datetime.now() - timedelta(days=30)  # Derniers 30 jours
    
    for i in range(150):  # 150 enregistrements d'utilisation
        # Choisir un équipement au hasard
        equipment = random.choice(equipments)
        
        # Générer une date aléatoire dans les 30 derniers jours
        random_days = random.randint(0, 30)
        random_hours = random.randint(8, 18)  # Heures de travail
        random_minutes = random.randint(0, 59)
        
        timestamp = (start_date + timedelta(days=random_days, hours=random_hours, minutes=random_minutes)).isoformat()
        
        usages.append({
            'id': f'USG{1000 + i}',
            'equipment_id': equipment['id'],
            'timestamp': timestamp,
            'type': random.choice(['scan', 'manual']),
            'location': equipment.get('location', 'Non spécifié')
        })
    
    # Trier par date
    return sorted(usages, key=lambda x: x['timestamp'])

# Sauvegarder les données
def save_data():
    # Sauvegarder les équipements
    with open('data/equipments.json', 'w', encoding='utf-8') as f:
        json.dump(equipments, f, ensure_ascii=False, indent=2)
    
    # Générer et sauvegarder les usages
    usages = generate_usage_data()
    with open('data/usages.json', 'w', encoding='utf-8') as f:
        json.dump(usages, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Base de données initialisée avec succès !")
    print(f"📋 {len(equipments)} équipements créés")
    print(f"📊 {len(usages)} enregistrements d'utilisation générés")

if __name__ == '__main__':
    save_data()
