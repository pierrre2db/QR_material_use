"""
Script pour vérifier et corriger la configuration de la base de données.
"""
import os
import sys
from sqlalchemy import inspect, text
from app import create_app
from app.extensions import db
from app.models import User

def check_database():
    # Créer l'application avec le contexte
    app = create_app('development')
    
    with app.app_context():
        # Vérifier si la base de données existe
        db_uri = app.config['SQLALCHEMY_DATABASE_URI']
        db_path = db_uri.replace('sqlite:///', '')
        db_exists = os.path.exists(db_path)
        
        print(f"Configuration de la base de données : {db_uri}")
        print(f"Base de données existe : {db_exists}")
        print(f"Chemin de la base de données : {os.path.abspath(db_path)}")
        
        # Vérifier la connexion à la base de données
        try:
            with db.engine.connect() as conn:
                # Obtenir la liste des tables avec SQLAlchemy 2.0
                inspector = inspect(db.engine)
                tables = inspector.get_table_names()
                
                print("\nTables dans la base de données :")
                for table in tables:
                    print(f"- {table}")
                
                # Vérifier la table alembic_version
                if 'alembic_version' in tables:
                    print("\nTable alembic_version trouvée.")
                    # Vérifier la version actuelle
                    result = conn.execute(text("SELECT version_num FROM alembic_version"))
                    version = result.scalar()
                    print(f"Version de migration actuelle : {version}")
                else:
                    print("\nTable alembic_version non trouvée. Initialisation nécessaire.")
                
                # Vérifier la structure des tables
                for table_name in ['users', 'equipments', 'usages']:
                    if table_name in tables:
                        print(f"\nStructure de la table {table_name}:")
                        columns = inspector.get_columns(table_name)
                        for column in columns:
                            print(f"- {column['name']}: {column['type']}", 
                                  f"(nullable: {column['nullable']}, ",
                                  f"primary_key: {column.get('primary_key', False)})")
                
                # Vérifier l'utilisateur admin
                if 'users' in tables:
                    admin = db.session.execute(
                        db.select(User).filter_by(username='admin')
                    ).scalar_one_or_none()
                    
                    if admin:
                        print(f"\nUtilisateur admin trouvé (ID: {admin.id}, Email: {admin.email})")
                    else:
                        print("\nAucun utilisateur admin trouvé.")
                        
                        # Vérifier s'il y a des utilisateurs
                        user_count = db.session.execute(
                            db.select(db.func.count()).select_from(User)
                        ).scalar()
                        print(f"Nombre total d'utilisateurs : {user_count}")
                else:
                    print("\nLa table 'users' n'existe pas dans la base de données.")
                    
        except Exception as e:
            print(f"\nErreur lors de la vérification de la base de données : {str(e)}")
            print("Détails supplémentaires :", str(e.__class__.__name__))

if __name__ == '__main__':
    print("Vérification de la base de données...\n")
    check_database()
