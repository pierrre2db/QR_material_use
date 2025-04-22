#!/usr/bin/env python3
import unittest
import sys
import os

def run_tests():
    """Exécute tous les tests unitaires"""
    # Découvrir et charger tous les tests dans le répertoire 'tests'
    test_loader = unittest.TestLoader()
    test_suite = test_loader.discover('tests', pattern='test_*.py')
    
    # Exécuter les tests
    test_runner = unittest.TextTestRunner(verbosity=2)
    result = test_runner.run(test_suite)
    
    # Retourner un code de sortie approprié (0 pour succès, 1 pour échec)
    return 0 if result.wasSuccessful() else 1

if __name__ == '__main__':
    # Ajouter le répertoire courant au chemin pour pouvoir importer l'application
    sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
    
    # Exécuter les tests et sortir avec le code approprié
    sys.exit(run_tests())
