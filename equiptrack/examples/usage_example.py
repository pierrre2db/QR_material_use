"""
Exemple d'utilisation des modèles EquipmentStore et UsageStore
"""
import os
import sys
from datetime import datetime, timedelta

# Ajoute le répertoire parent au PYTHONPATH pour importer les modèles
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import EquipmentStore, UsageStore

def print_equipment(equipment):
    """Affiche les informations d'un équipement de manière lisible."""
    print(f"\n=== Équipement {equipment['qr_code']} ===")
    print(f"Nom: {equipment['name']}")
    print(f"Description: {equipment.get('description', 'Aucune')}")
    print(f"Statut: {equipment.get('status', 'inconnu')}")
    print(f"Créé le: {equipment['created_at']}")

def print_usage_stats(stats):
    """Affiche les statistiques d'utilisation."""
    print("\n=== Statistiques d'utilisation ===")
    print(f"Total d'utilisations: {stats['total']}")
    print("\nUtilisations par type:")
    for usage_type, count in stats['by_type'].items():
        print(f"- {usage_type}: {count}")
    
    if stats['recent']:
        print("\nDernières utilisations:")
        for usage in stats['recent']:
            print(f"- {usage['timestamp']}: {usage['type']} "
                  f"(par: {usage.get('user', 'anonyme')})")

def main():
    # Initialisation des stores
    os.makedirs('data', exist_ok=True)
    equipment_store = EquipmentStore('data/example_equipments.json')
    usage_store = UsageStore('data/example_usages.json')
    
    print("=== Création d'équipements ===")
    
    # Ajout d'équipements
    equip1 = equipment_store.add_equipment(
        name="Ordinateur portable",
        description="Dell XPS 15, 16GB RAM, 512GB SSD"
    )
    print(f"Créé: {equip1['name']} (QR: {equip1['qr_code']})")
    
    equip2 = equipment_store.add_equipment(
        name="Projecteur EPSON",
        description="Projecteur HD 1080p, 3500 lumens"
    )
    print(f"Créé: {equip2['name']} (QR: {equip2['qr_code']})")
    
    # Ajout d'un troisième équipement avec QR code généré automatiquement
    equip3 = equipment_store.add_equipment(
        name="Tablette graphique",
        description="Wacom Intuos Pro"
    )
    print(f"Créé: {equip3['name']} (QR: {equip3['qr_code']})")
    
    print("\n=== Enregistrement d'utilisations ===")
    
    # Enregistrement de quelques utilisations
    usage = {
        'qr_code': equip1['qr_code'],
        'type': 'emprunt',
        'user': 'john.doe',
        'notes': 'Prêt pour réunion client',
        'timestamp': datetime.now().isoformat()
    }
    usage_store.add(usage)
    print(f"Enregistré: Emprunt de {equip1['qr_code']} par john.doe")
    
    usage = {
        'qr_code': equip2['qr_code'],
        'type': 'scan',
        'user': 'scanner',
        'timestamp': datetime.now().isoformat()
    }
    usage_store.add(usage)
    print(f"Enregistré: Scan de {equip2['qr_code']}")
    
    # Affichage des statistiques
    print("\n=== Affichage des statistiques ===")
    
    # Stats globales
    print("\nStatistiques globales:")
    stats = usage_store.get_usage_stats()
    print_usage_stats(stats)
    
    # Stats pour un équipement spécifique
    print(f"\nStatistiques pour {equip1['name']} (QR: {equip1['qr_code']}):")
    stats_equip1 = usage_store.get_usage_stats(qr_code=equip1['qr_code'])
    print_usage_stats(stats_equip1)
    
    # Récupération d'un équipement par son QR code
    qr_to_find = equip1['qr_code']
    # Recherche manuelle dans la liste des équipements
    equipments = equipment_store.load()
    found_equip = next((e for e in equipments if e.get('qr_code') == qr_to_find), None)
    if found_equip:
        print(f"\n=== Détails de l'équipement {qr_to_find} ===")
        print_equipment(found_equip)
    else:
        print(f"\nAucun équipement trouvé avec le QR code {qr_to_find}")

if __name__ == "__main__":
    # Création du dossier data s'il n'existe pas
    os.makedirs('data', exist_ok=True)
    main()
