"""
Script pour tester directement les contraintes de la base de données SQLite.
"""
import sqlite3
import os
from datetime import datetime

def setup_database():
    """Configure la base de données pour les tests."""
    # Chemin vers la base de données
    db_path = 'instance/equiptrack.db'
    
    # Créer le répertoire s'il n'existe pas
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    # Se connecter à la base de données
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Activer les contraintes de clés étrangères
    cursor.execute('PRAGMA foreign_keys = ON')
    
    return conn, cursor

def test_foreign_keys():
    """Teste les contraintes de clés étrangères."""
    print("=== Test des contraintes de clés étrangères ===")
    conn, cursor = setup_database()
    
    try:
        # 1. Créer des tables de test si elles n'existent pas
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS test_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE
        )''')
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS test_equipments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            status TEXT NOT NULL
        )''')
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS test_usages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            equipment_id INTEGER,
            user_id INTEGER,
            usage_type TEXT NOT NULL,
            FOREIGN KEY (equipment_id) REFERENCES test_equipments(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES test_users(id) ON DELETE SET NULL
        )''')
        
        # Vider les tables de test
        cursor.execute('DELETE FROM test_usages')
        cursor.execute('DELETE FROM test_equipments')
        cursor.execute('DELETE FROM test_users')
        
        # 2. Insérer des données de test
        cursor.execute("INSERT INTO test_users (username, email) VALUES (?, ?)", 
                      ('testuser', 'test@example.com'))
        user_id = cursor.lastrowid
        
        cursor.execute("INSERT INTO test_equipments (name, status) VALUES (?, ?)",
                        ('Test Equipment', 'available'))
        equipment_id = cursor.lastrowid
        
        # 3. Tester l'insertion d'un usage valide
        cursor.execute('''
        INSERT INTO test_usages (equipment_id, user_id, usage_type)
        VALUES (?, ?, ?)
        ''', (equipment_id, user_id, 'checkout'))
        print("✅ Insertion d'un usage valide réussie")
        
        # 4. Tester la suppression d'un utilisateur (devrait mettre user_id à NULL dans usages)
        cursor.execute("DELETE FROM test_users WHERE id = ?", (user_id,))
        
        # Vérifier que user_id est NULL dans l'usage
        cursor.execute("SELECT user_id FROM test_usages WHERE id = 1")
        result = cursor.fetchone()
        if result[0] is None:
            print("✅ Test SET NULL réussi: user_id est NULL après suppression de l'utilisateur")
        else:
            print("❌ Échec du test SET NULL: user_id n'est pas NULL")
        
        # 5. Tester la suppression d'un équipement (devrait supprimer l'usage associé)
        cursor.execute("DELETE FROM test_equipments WHERE id = ?", (equipment_id,))
        
        # Vérifier que l'usage a été supprimé
        cursor.execute("SELECT COUNT(*) FROM test_usages WHERE id = 1")
        count = cursor.fetchone()[0]
        if count == 0:
            print("✅ Test CASCADE réussi: l'usage a été supprimé avec l'équipement")
        else:
            print("❌ Échec du test CASCADE: l'usage n'a pas été supprimé")
        
        # Nettoyer
        conn.rollback()
        
    except sqlite3.Error as e:
        print(f"❌ Erreur SQLite: {e}")
        conn.rollback()
    
    finally:
        # Fermer la connexion
        conn.close()

if __name__ == '__main__':
    test_foreign_keys()
