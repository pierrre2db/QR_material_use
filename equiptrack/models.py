import json
import os
import re
from datetime import datetime
from typing import Dict, Any, Optional, List, Set
from dataclasses import dataclass, asdict, field

# Constantes pour les valeurs autorisées
VALID_STATUSES = {'disponible', 'maintenance', 'hors_service'}
VALID_USAGE_TYPES = {'scan', 'maintenance', 'inventaire'}

# Modèles de validation
@dataclass
class ValidationError(Exception):
    """Exception levée lors de la validation des données."""
    field: str
    message: str
    value: Any = None
    
    def __str__(self):
        return f"Erreur de validation pour le champ '{self.field}': {self.message} (valeur: {self.value!r})"

def validate_string(value: Any, field_name: str, min_length: int = 1, max_length: int = 255) -> str:
    """Valide une chaîne de caractères."""
    if not isinstance(value, str):
        raise ValidationError(field_name, "doit être une chaîne de caractères", value)
    
    value = value.strip()
    if len(value) < min_length:
        raise ValidationError(
            field_name, 
            f"doit contenir au moins {min_length} caractère(s)",
            value
        )
    if len(value) > max_length:
        raise ValidationError(
            field_name,
            f"ne doit pas dépasser {max_length} caractères",
            value
        )
    return value

def validate_choice(value: Any, field_name: str, valid_choices: Set[str]) -> str:
    """Valide qu'une valeur fait partie d'un ensemble de choix valides."""
    value = validate_string(value, field_name)
    if value not in valid_choices:
        raise ValidationError(
            field_name,
            f"doit être l'un des choix suivants: {', '.join(sorted(valid_choices))}",
            value
        )
    return value

def validate_qr_code_format(qr_code: str) -> str:
    """Valide le format d'un QR code."""
    if not isinstance(qr_code, str):
        raise ValidationError('qr_code', 'doit être une chaîne de caractères')
    
    qr_code = qr_code.upper().strip()
    if len(qr_code) != 6:
        raise ValidationError('qr_code', 'doit contenir exactement 6 caractères', qr_code)
    
    if not qr_code.isalnum():
        raise ValidationError('qr_code', 'ne doit contenir que des caractères alphanumériques', qr_code)
    
    return qr_code

class DataStore:
    """Classe de base pour le stockage des données avec validation."""
    
    def __init__(self, filename: str):
        """Initialise le stockage avec le fichier spécifié."""
        self.filename = os.path.abspath(filename)
        self._ensure_file_exists()
        
    def _validate_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Valide les données avant leur enregistrement.
        
        À surcharger dans les classes filles pour une validation spécifique.
        """
        return data
    
    def _ensure_file_exists(self):
        """Crée le fichier avec un tableau vide s'il n'existe pas."""
        os.makedirs(os.path.dirname(self.filename), exist_ok=True)
        if not os.path.exists(self.filename):
            self.save([])
    
    def load(self):
        """Charge les données depuis le fichier JSON."""
        with open(self.filename, 'r') as f:
            return json.load(f)
    
    def save(self, data):
        """Sauvegarde les données dans le fichier JSON."""
        with open(self.filename, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def add(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Ajoute un nouvel élément après validation.
        
        Args:
            item: Dictionnaire contenant les données à ajouter
            
        Returns:
            L'élément ajouté avec les valeurs validées
            
        Raises:
            ValidationError: Si les données ne sont pas valides
        """
        item = self._validate_data(item)
        data = self.load()
        data.append(item)
        self.save(data)
        return item

class EquipmentStore(DataStore):
    """Gestion du stockage des équipements avec validation."""
    
    def __init__(self, filename: str = 'data/equipments.json'):
        """Initialise le stockage des équipements."""
        super().__init__(filename)
    
    def _validate_data(self, equipment: Dict[str, Any]) -> Dict[str, Any]:
        """Valide les données d'un équipement."""
        validated = {}
        
        # Validation du QR code
        try:
            validated['qr_code'] = validate_qr_code_format(equipment['qr_code'])
        except KeyError:
            raise ValidationError('qr_code', 'est obligatoire')
            
        # Validation du nom
        try:
            validated['name'] = validate_string(equipment['name'], 'name', min_length=2, max_length=100)
        except KeyError:
            raise ValidationError('name', 'est obligatoire')
            
        # Description optionnelle
        if 'description' in equipment:
            validated['description'] = validate_string(
                equipment['description'], 
                'description', 
                min_length=0, 
                max_length=500
            )
            
        # Statut avec valeur par défaut
        validated['status'] = validate_choice(
            equipment.get('status', 'disponible'),
            'status',
            VALID_STATUSES
        )
        
        # Date de création
        if 'created_at' in equipment:
            try:
                # Vérifie que c'est une date ISO valide
                datetime.fromisoformat(equipment['created_at'].replace('Z', '+00:00'))
                validated['created_at'] = equipment['created_at']
            except (ValueError, TypeError):
                raise ValidationError('created_at', 'doit être une date ISO valide', equipment.get('created_at'))
        else:
            validated['created_at'] = datetime.now().isoformat()
            
        return validated
    
    def _generate_qr_code(self):
        """Génère un code QR aléatoire de 6 caractères alphanumériques."""
        import random
        import string
        chars = string.ascii_uppercase + string.digits  # A-Z et 0-9
        return ''.join(random.choices(chars, k=6))

    def validate_qr_code(self, qr_code):
        """Valide le format du QR code."""
        if not isinstance(qr_code, str) or len(qr_code) != 6 or not qr_code.isalnum():
            raise ValueError("Le QR code doit contenir exactement 6 caractères alphanumériques")
        return qr_code.upper()  # Convertit en majuscules pour la cohérence

    def qr_code_exists(self, qr_code):
        """Vérifie si un QR code existe déjà."""
        return any(e.get('qr_code', '').upper() == qr_code.upper() 
                 for e in self.load())

    def add_equipment(self, name, description="", qr_code=None):
        """Ajoute un nouvel équipement avec un QR code unique.
        
        Args:
            name: Nom de l'équipement
            description: Description optionnelle
            qr_code: Code QR personnalisé (6 caractères alphanumériques).
                   Si non fourni, un code sera généré automatiquement.
                   
        Returns:
            dict: L'équipement créé avec son QR code
        """
        if qr_code:
            qr_code = self.validate_qr_code(qr_code)
            if self.qr_code_exists(qr_code):
                raise ValueError(f"Le QR code {qr_code} est déjà utilisé")
        else:
            # Génère un QR code unique
            qr_code = self._generate_qr_code()
            while self.qr_code_exists(qr_code):
                qr_code = self._generate_qr_code()

        equipment = {
            'qr_code': qr_code,  # Utilisé comme identifiant unique
            'name': name,
            'description': description,
            'created_at': datetime.now().isoformat(),
            'status': 'disponible'  # Nouveau champ pour suivre l'état
        }
        return self.add(equipment)

class UsageStore(DataStore):
    """Gestion du suivi des utilisations avec validation."""
    
    def __init__(self, filename: str = 'data/usages.json'):
        """Initialise le stockage des utilisations."""
        super().__init__(filename)
    
    def _validate_data(self, usage: Dict[str, Any]) -> Dict[str, Any]:
        """Valide les données d'une utilisation."""
        validated = {}
        
        # Validation du QR code
        try:
            validated['qr_code'] = validate_qr_code_format(usage['qr_code'])
        except KeyError:
            raise ValidationError('qr_code', 'est obligatoire')
        
        # Type d'utilisation
        validated['type'] = validate_choice(
            usage.get('type', 'scan'),
            'type',
            VALID_USAGE_TYPES
        )
        
        # Utilisateur optionnel
        if 'user' in usage:
            validated['user'] = validate_string(usage['user'], 'user', min_length=2, max_length=100)
            
        # Notes optionnelles
        if 'notes' in usage:
            validated['notes'] = validate_string(usage['notes'], 'notes', min_length=0, max_length=1000)
            
        # Horodatage
        if 'timestamp' in usage:
            try:
                # Vérifie que c'est une date ISO valide
                datetime.fromisoformat(usage['timestamp'].replace('Z', '+00:00'))
                validated['timestamp'] = usage['timestamp']
            except (ValueError, TypeError):
                raise ValidationError('timestamp', 'doit être une date ISO valide', usage.get('timestamp'))
        else:
            validated['timestamp'] = datetime.now().isoformat()
            
        return validated
        
    def validate_qr_code(self, qr_code):
        """Valide le format du QR code."""
        if not isinstance(qr_code, str) or len(qr_code) != 6 or not qr_code.isalnum():
            raise ValueError("Le QR code doit contenir exactement 6 caractères alphanumériques")
        return qr_code.upper()  # Convertit en majuscules pour la cohérence
        
    def qr_code_exists(self, qr_code):
        """Vérifie si un QR code existe déjà dans les usages."""
        qr_code = self.validate_qr_code(qr_code)
        return any(u.get('qr_code', '').upper() == qr_code 
                 for u in self.load())
    
    def get_equipment(self, qr_code):
        """Récupère un équipement par son QR code."""
        qr_code = self.validate_qr_code(qr_code)
        for eq in self.load():
            if eq.get('qr_code', '').upper() == qr_code:
                return eq
        return None

    def record_usage(self, qr_code, usage_type='scan', user=None, notes=None):
        """Enregistre une nouvelle utilisation d'équipement.
        
        Args:
            qr_code: Le QR code de l'équipement (6 caractères alphanumériques)
            usage_type: Type d'utilisation ('scan', 'emprunt', 'retour', 'maintenance')
            user: Identifiant de l'utilisateur (optionnel)
            notes: Notes supplémentaires (optionnel)
            
        Returns:
            dict: L'utilisation enregistrée
        """
        qr_code = self.validate_qr_code(qr_code)
        if not self.qr_code_exists(qr_code):
            raise ValueError(f"Aucun équipement trouvé avec le QR code {qr_code}")
            
        usage = {
            'qr_code': qr_code,
            'timestamp': datetime.now().isoformat(),
            'type': usage_type,
            'user': user,
            'notes': notes
        }
        return self.add(usage)
    
    def get_usage_stats(self, qr_code=None):
        """Retourne des statistiques d'utilisation.
        
        Args:
            qr_code: Filtre optionnel pour un équipement spécifique
            
        Returns:
            dict: Statistiques d'utilisation
        """
        usages = self.load()
        
        if qr_code:
            qr_code = self.validate_qr_code(qr_code)
            usages = [u for u in usages if u.get('qr_code', '').upper() == qr_code]
        
        # Compte les usages par type
        by_type = {}
        for u in usages:
            by_type[u.get('type', 'inconnu')] = by_type.get(u.get('type', 'inconnu'), 0) + 1
            
        return {
            'total': len(usages),
            'by_type': by_type,
            'recent': sorted(usages, key=lambda x: x.get('timestamp', ''), reverse=True)[:10]
        }
