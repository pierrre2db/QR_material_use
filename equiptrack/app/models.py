from datetime import datetime
import uuid
import time
from enum import Enum, auto
from flask import current_app
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer as Serializer
from sqlalchemy import event

from .extensions import db


class UserRole(Enum):
    """Énumération des rôles utilisateurs avec leurs permissions."""
    ADMIN = {
        'level': 100,
        'label': 'Administrateur',
        'description': 'Accès complet au système',
        'permissions': [
            'manage_users',
            'manage_equipment',
            'view_reports',
            'export_data',
            'system_settings'
        ]
    }
    MANAGER = {
        'level': 80,
        'label': 'Gestionnaire',
        'description': 'Gestion des équipements et des utilisateurs basique',
        'permissions': [
            'manage_equipment',
            'view_reports',
            'export_data'
        ]
    }
    TECHNICIAN = {
        'level': 50,
        'label': 'Technicien',
        'description': 'Gestion de la maintenance des équipements',
        'permissions': [
            'manage_equipment',
            'view_reports'
        ]
    }
    USER = {
        'level': 10,
        'label': 'Utilisateur',
        'description': 'Utilisateur standard avec des droits limités',
        'permissions': [
            'scan_equipment',
            'view_own_usage'
        ]
    }
    INACTIVE = {
        'level': 0,
        'label': 'Inactif',
        'description': 'Compte désactivé',
        'permissions': []
    }

    @classmethod
    def get_role_by_name(cls, name):
        """Retourne un rôle par son nom."""
        try:
            return cls[name.upper()]
        except KeyError:
            return cls.INACTIVE

class User(db.Model, UserMixin):
    """
    Modèle pour les utilisateurs avec gestion des rôles et permissions.
    
    Attributs:
        role (str): Rôle de l'utilisateur (parmi UserRole)
        department (str): Département/service de l'utilisateur
        phone (str): Numéro de téléphone
        last_password_change (DateTime): Date du dernier changement de mot de passe
        failed_login_attempts (int): Nombre de tentatives de connexion échouées
        account_locked_until (DateTime): Verrouillage du compte jusqu'à cette date
    """
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256))
    
    # Informations de profil
    first_name = db.Column(db.String(50), nullable=True)
    last_name = db.Column(db.String(50), nullable=True)
    department = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    
    # Sécurité et authentification
    role = db.Column(db.String(20), default='USER', nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)
    last_password_change = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    failed_login_attempts = db.Column(db.Integer, default=0, nullable=False)
    account_locked_until = db.Column(db.DateTime, nullable=True)
    
    # Métadonnées
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relations
    usages = db.relationship('Usage', backref='user_ref', lazy=True, cascade='all, delete-orphan')
    
    # Propriétés calculées
    @property
    def full_name(self):
        """Retourne le nom complet de l'utilisateur."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username
    
    @property
    def role_info(self):
        """Retourne les informations du rôle de l'utilisateur."""
        return UserRole.get_role_by_name(self.role).value
    
    @property
    def permissions(self):
        """Retourne la liste des permissions de l'utilisateur."""
        return self.role_info['permissions']
    
    def has_permission(self, permission):
        """Vérifie si l'utilisateur a une permission spécifique."""
        return permission in self.permissions
    
    def has_role(self, role_name):
        """Vérifie si l'utilisateur a un rôle spécifique."""
        try:
            role = UserRole[role_name.upper()]
            return self.role_info['level'] >= role.value['level']
        except (KeyError, AttributeError):
            return False
    
    def is_admin(self):
        """Vérifie si l'utilisateur est administrateur."""
        return self.has_role('ADMIN')
    
    def is_manager(self):
        """Vérifie si l'utilisateur est gestionnaire ou supérieur."""
        return self.role_info['level'] >= UserRole.MANAGER.value['level']
    
    def is_technician(self):
        """Vérifie si l'utilisateur est technicien ou supérieur."""
        return self.role_info['level'] >= UserRole.TECHNICIAN.value['level']
    
    def is_account_locked(self):
        """Vérifie si le compte est verrouillé."""
        if not self.account_locked_until:
            return False
        return datetime.utcnow() < self.account_locked_until
    
    def __init__(self, **kwargs):
        # Définir le rôle par défaut si non spécifié
        if 'role' not in kwargs:
            kwargs['role'] = 'USER'
            
        super(User, self).__init__(**kwargs)
        
        # Définir le mot de passe si fourni
        if 'password' in kwargs:
            self.set_password(kwargs['password'])
            
        # S'assurer que le rôle est valide
        try:
            UserRole.get_role_by_name(self.role)
        except ValueError:
            self.role = 'USER'  # Rôle par défaut si invalide
    
    def set_password(self, password, require_change=False):
        """
        Hache et définit le mot de passe de l'utilisateur.
        
        Args:
            password (str): Le nouveau mot de passe
            require_change (bool): Si True, marque le mot de passe comme à changer
        """
        self.password_hash = generate_password_hash(password)
        self.last_password_change = datetime.utcnow()
        
        # Réinitialiser les tentatives de connexion échouées
        self.failed_login_attempts = 0
        self.account_locked_until = None
        
        if require_change:
            # Implémenter la logique pour forcer le changement de mot de passe
            pass
    
    def check_password(self, password):
        """
        Vérifie si le mot de passe fourni correspond au hachage stocké.
        
        Args:
            password (str): Le mot de passe à vérifier
            
        Returns:
            bool: True si le mot de passe est valide, False sinon
        """
        # Vérifier d'abord si le compte est verrouillé
        if self.account_locked_until and datetime.utcnow() < self.account_locked_until:
            return False
            
        # Vérifier le mot de passe
        is_valid = check_password_hash(self.password_hash, password)
        
        # Gérer les tentatives de connexion échouées
        if is_valid:
            self.failed_login_attempts = 0
            self.account_locked_until = None
            return True
        else:
            self.failed_login_attempts += 1
            
            # Verrouiller le compte après 5 tentatives échouées
            if self.failed_login_attempts >= 5:
                lockout_minutes = 2 ** (self.failed_login_attempts - 5)  # Augmentation exponentielle
                self.account_locked_until = datetime.utcnow() + timedelta(minutes=lockout_minutes)
            
            return False
    
    def get_reset_token(self, expires_sec=1800):
        """Génère un jeton de réinitialisation de mot de passe."""
        s = Serializer(current_app.config['SECRET_KEY'], salt='password-reset')
        return s.dumps(self.id)

    @staticmethod
    def verify_reset_token(token, max_age=1800):
        """Vérifie le jeton de réinitialisation de mot de passe."""
        s = Serializer(current_app.config['SECRET_KEY'], salt='password-reset')
        try:
            user_id = s.loads(token, max_age=max_age)
        except:
            return None
        return User.query.get(user_id)
    
    def to_dict(self, include_sensitive=False):
        """
        Retourne une représentation en dictionnaire de l'utilisateur.
        
        Args:
            include_sensitive (bool): Inclure les informations sensibles
            
        Returns:
            dict: Représentation de l'utilisateur
        """
        data = {
            'id': self.id,
            'public_id': self.public_id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'department': self.department,
            'phone': self.phone,
            'role': self.role,
            'role_label': self.role_info.get('label', ''),
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'last_password_change': self.last_password_change.isoformat() if self.last_password_change else None,
            'is_locked': self.is_account_locked(),
            'permissions': self.permissions
        }
        
        if include_sensitive:
            data.update({
                'failed_login_attempts': self.failed_login_attempts,
                'account_locked_until': self.account_locked_until.isoformat() if self.account_locked_until else None
            })
            
        return data
    
    def __repr__(self):
        return f'<User {self.username} ({self.role})>'


def validate_user_role(mapper, connection, target):
    """Valide que le rôle de l'utilisateur est valide avant la sauvegarde."""
    try:
        UserRole.get_role_by_name(target.role)
    except (ValueError, AttributeError):
        target.role = 'USER'  # Rôle par défaut si invalide

# Enregistrer les écouteurs d'événements
@event.listens_for(User, 'before_insert')
@event.listens_for(User, 'before_update')
def _validate_user_role_before_save(mapper, connection, target):
    validate_user_role(mapper, connection, target)

class Equipment(db.Model):
    """
    Modèle pour les équipements.
    
    Version 1.0 : Utilisation d'un code alphanumérique simple
    Version 1.1 : Migration vers QR codes prévue
    """
    __tablename__ = 'equipments'
    
    # État des équipements (V1.0 - Statuts simplifiés)
    STATUS_AVAILABLE = 'disponible'
    STATUS_MAINTENANCE = 'maintenance'
    STATUS_OUT_OF_ORDER = 'hors_service'
    
    # Pour la V2 : STATUS_BORROWED = 'emprunté'
    
    STATUS_CHOICES = [
        (STATUS_AVAILABLE, 'Disponible'),
        (STATUS_MAINTENANCE, 'En maintenance'),
        (STATUS_OUT_OF_ORDER, 'Hors service')
        # Pour la V2 : (STATUS_BORROWED, 'Emprunté')
    ]
    
    id = db.Column(db.Integer, primary_key=True)
    # Code alphanumérique simple pour la V1.0
    # Serra remplacé par un système de QR code en V1.1
    qr_code = db.Column(db.String(6), unique=True, nullable=False, index=True, 
                      comment='Code alphanumérique unique (V1.0) - Migration vers QR prévue en V1.1')
    name = db.Column(db.String(100), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(
        db.String(20), 
        nullable=False, 
        default=STATUS_AVAILABLE,
        index=True
    )
    location = db.Column(db.String(100), nullable=True, index=True)
    category = db.Column(db.String(50), nullable=True, index=True)
    purchase_date = db.Column(db.Date, nullable=True)
    purchase_price = db.Column(db.Float, nullable=True)
    serial_number = db.Column(db.String(100), nullable=True, unique=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relations
    usages = db.relationship('Usage', backref='equipment_ref', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, **kwargs):
        # Valider le statut s'il est fourni
        if 'status' in kwargs and kwargs['status'] not in dict(self.STATUS_CHOICES).keys():
            raise ValueError(f"Statut invalide. Doit être l'un des suivants: {', '.join(dict(self.STATUS_CHOICES).keys())}")
        super(Equipment, self).__init__(**kwargs)
    
    def __setattr__(self, name, value):
        # Valider le statut lors de la modification
        if name == 'status' and hasattr(self, 'STATUS_CHOICES'):
            if value not in dict(self.STATUS_CHOICES).keys():
                raise ValueError(f"Statut invalide. Doit être l'un des suivants: {', '.join(dict(self.STATUS_CHOICES).keys())}")
        super(Equipment, self).__setattr__(name, value)
    
    @property
    def is_available(self):
        """Vérifie si l'équipement est disponible à l'emprunt."""
        return self.status == self.STATUS_AVAILABLE
    
    @property
    def current_usage(self):
        """
        Retourne la dernière utilisation de l'équipement.
        
        Dans la V1.0, on retourne simplement la dernière utilisation enregistrée.
        La gestion des prêts sera implémentée dans la V2.0.
        """
        return Usage.query.filter_by(
            equipment_id=self.id
        ).order_by(Usage.timestamp.desc()).first()
    
    def to_dict(self, include_usages=False):
        """Retourne une représentation en dictionnaire de l'équipement."""
        data = {
            'id': self.id,
            'qr_code': self.qr_code,
            'name': self.name,
            'description': self.description,
            'status': self.status,
            'status_display': dict(self.STATUS_CHOICES).get(self.status, self.status),
            'location': self.location,
            'category': self.category,
            'purchase_date': self.purchase_date.isoformat() if self.purchase_date else None,
            'purchase_price': float(self.purchase_price) if self.purchase_price else None,
            'serial_number': self.serial_number,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_available': self.is_available,
            'current_usage': self.current_usage.to_dict() if self.current_usage else None
        }
        
        if include_usages:
            data['usages'] = [usage.to_dict() for usage in self.usages]
            
        return data

class Usage(db.Model):
    """
    Modèle pour le suivi des utilisations.
    
    Version 1.0 : Suivi simple des scans et actions de maintenance
    Version 2.0 : Gestion complète des prêts et retours
    """
    __tablename__ = 'usages'
    
    # Types d'usage pour la V1.0
    TYPE_SCAN = 'scan'
    TYPE_MAINTENANCE_START = 'debut_maintenance'
    TYPE_MAINTENANCE_END = 'fin_maintenance'
    
    # Pour la V2.0
    # TYPE_BORROW = 'emprunt'
    # TYPE_RETURN = 'retour'
    
    USAGE_TYPES = [
        (TYPE_SCAN, 'Scan'),
        (TYPE_MAINTENANCE_START, 'Début maintenance'),
        (TYPE_MAINTENANCE_END, 'Fin maintenance')
        # Pour la V2.0 :
        # (TYPE_BORROW, 'Emprunt'),
        # (TYPE_RETURN, 'Retour')
    ]
    
    id = db.Column(db.Integer, primary_key=True)
    equipment_id = db.Column(db.Integer, db.ForeignKey('equipments.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    usage_type = db.Column(db.String(20), nullable=False)  # scan, emprunt, retour, maintenance
    user_name = db.Column(db.String(100), nullable=True)  # Pour rétrocompatibilité et historique
    notes = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def __init__(self, **kwargs):
        super(Usage, self).__init__(**kwargs)
        # Mettre à jour le nom d'utilisateur si un utilisateur est associé
        if hasattr(self, 'user_ref') and self.user_ref and not self.user_name:
            self.user_name = self.user_ref.username
    
    def to_dict(self):
        return {
            'id': self.id,
            'equipment_id': self.equipment_id,
            'equipment': self.equipment.name if hasattr(self, 'equipment') and self.equipment else None,
            'usage_type': self.usage_type,
            'user_id': self.user_id,
            'user': self.user_ref.username if hasattr(self, 'user_ref') and self.user_ref else self.user_name,
            'notes': self.notes,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
        
    def __repr__(self):
        return f'<Usage {self.id} - {self.usage_type} - {self.timestamp}>'
