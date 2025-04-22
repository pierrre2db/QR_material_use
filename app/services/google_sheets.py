import os
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build
from dotenv import load_dotenv

load_dotenv()

class GoogleSheetsService:
    """Service pour interagir avec Google Sheets API"""
    
    def __init__(self):
        self.credentials = None
        self.sheet_id = os.environ.get('GOOGLE_SHEET_ID')
        self.setup_credentials()
        
    def setup_credentials(self):
        """Configure les identifiants pour l'API Google Sheets"""
        try:
            # Vérifier si les identifiants sont stockés dans un fichier
            creds_file = os.environ.get('GOOGLE_CREDENTIALS_FILE')
            if creds_file and os.path.exists(creds_file):
                self.credentials = service_account.Credentials.from_service_account_file(
                    creds_file, 
                    scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']
                )
            # Sinon, utiliser les identifiants JSON stockés dans une variable d'environnement
            elif os.environ.get('GOOGLE_CREDENTIALS_JSON'):
                creds_info = json.loads(os.environ.get('GOOGLE_CREDENTIALS_JSON'))
                self.credentials = service_account.Credentials.from_service_account_info(
                    creds_info,
                    scopes=['https://www.googleapis.com/auth/spreadsheets.readonly']
                )
        except Exception as e:
            print(f"Erreur lors de la configuration des identifiants Google: {e}")
    
    def get_service(self):
        """Retourne un service Google Sheets API"""
        if not self.credentials:
            raise Exception("Les identifiants Google n'ont pas été configurés correctement")
        
        return build('sheets', 'v4', credentials=self.credentials)
    
    def get_users(self):
        """Récupère la liste des utilisateurs depuis Google Sheets"""
        try:
            service = self.get_service()
            result = service.spreadsheets().values().get(
                spreadsheetId=self.sheet_id,
                range='Utilisateurs!A2:E'  # Supposant que la première ligne contient des en-têtes
            ).execute()
            
            users = []
            values = result.get('values', [])
            
            for row in values:
                if len(row) >= 4:  # S'assurer qu'il y a suffisamment de colonnes
                    user = {
                        'id': row[0],  # Email comme ID
                        'nom_complet': row[1],
                        'role': row[2],
                        'password': row[3] if len(row) > 3 else '1234'  # Mot de passe par défaut si non spécifié
                    }
                    users.append(user)
            
            return users
        except Exception as e:
            print(f"Erreur lors de la récupération des utilisateurs: {e}")
            return []
    
    def get_equipment(self):
        """Récupère la liste des équipements depuis Google Sheets"""
        try:
            service = self.get_service()
            result = service.spreadsheets().values().get(
                spreadsheetId=self.sheet_id,
                range='Equipements!A2:D'  # Supposant que la première ligne contient des en-têtes
            ).execute()
            
            equipment_list = []
            values = result.get('values', [])
            
            for row in values:
                if len(row) >= 4:  # S'assurer qu'il y a suffisamment de colonnes
                    equipment = {
                        'id': row[0],
                        'nom_salle': row[1],
                        'type_equipement': row[2],
                        'qr_code_statique_data': row[3]
                    }
                    equipment_list.append(equipment)
            
            return equipment_list
        except Exception as e:
            print(f"Erreur lors de la récupération des équipements: {e}")
            return []
