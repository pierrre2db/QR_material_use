"""
Démonstration du MVP (Minimum Viable Product) d'EquipTrack
"""
import os
import sys
from datetime import datetime

# Ajoute le répertoire parent au PYTHONPATH pour importer les modèles
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import EquipmentStore, UsageStore, ValidationError

def print_equipment(equipment):
    """Affiche les informations d'un équipement."""
    print(f"\n=== Équipement {equipment['qr_code']} ===")
    print(f"Nom: {equipment['name']}")
    print(f"Description: {equipment.get('description', 'Aucune')}")
    print(f"Statut: {equipment.get('status', 'inconnu')}")
    print(f"Créé le: {equipment['created_at']}")

def print_usage(usage):
    """Affiche les informations d'une utilisation."""
    print(f"\n=== Utilisation ===")
    print(f"QR Code: {usage['qr_code']}")
    print(f"Type: {usage['type']}")
    if 'user' in usage:
        print(f"Utilisateur: {usage['user']}")
    if 'notes' in usage:
        print(f"Notes: {usage['notes']}")
    print(f"Date: {usage['timestamp']}")

def main():
    # Initialisation des stores
    os.makedirs('data', exist_ok=True)
    equipment_store = EquipmentStore('data/mvp_equipments.json')
    usage_store = UsageStore('data/mvp_usages.json')
    
    print("=== MVP d'EquipTrack ===\n")
    
    # 1. Ajout d'un équipement
    print("1. Ajout d'un équipement")
    try:
        equip = equipment_store.add_equipment(
            name="Ordinateur portable",
            description="Dell XPS 15, 16GB RAM, 512GB SSD"
        )
        print_equipment(equip)
        
        # 2. Scan de l'équipement
        print("\n2. Enregistrement d'un scan")
        scan = usage_store.add({
            'qr_code': equip['qr_code'],
            'type': 'scan',
            'user': 'utilisateur1',
            'notes': 'Scan de test pour le MVP'
        })
        print_usage(scan)
        
        # 3. Mise en maintenance
        print("\n3. Mise en maintenance")
        maintenance = usage_store.add({
            'qr_code': equip['qr_code'],
            'type': 'maintenance',
            'user': 'technicien1',
            'notes': 'Nettoyage et vérification'
        })
        print_usage(maintenance)
        
        # 4. Inventaire
        print("\n4. Inventaire")
        inventory = usage_store.add({
            'qr_code': equip['qr_code'],
            'type': 'inventaire',
            'user': 'inventaire1',
            'notes': 'Vérification trimestrielle'
        })
        print_usage(inventory)
        
        # 5. Tentative avec des données invalides
        print("\n5. Test de validation")
        try:
            equipment_store.add_equipment(
                name="X",  # Trop court
                description="Test"
            )
        except ValidationError as e:
            print(f"Erreur de validation: {e}")
            
    except Exception as e:
        print(f"\nErreur: {e}")
    
    print("\n=== Fin du MVP ===")

if __name__ == "__main__":
    main()
