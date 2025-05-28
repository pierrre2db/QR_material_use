.PHONY: install test lint format clean run init-db docker-build docker-run

# Variables
PYTHON = python
PIP = pip
FLAKE8 = flake8
BLACK = black
ISORT = isort
PYTEST = pytest

# Installation
install:
	$(PIP) install -r requirements.txt
	$(PIP) install -r requirements-dev.txt

# Initialisation de la base de données
init-db:
	$(PYTHON) init_db.py

# Exécution de l'application
run:
	$(PYTHON) app.py

# Tests
test:
	$(PYTEST) -v --cov=.

# Linting
lint:
	$(FLAKE8) .
	$(BLACK) --check .
	$(ISORT) --check-only .

# Formatage de code
format:
	$(BLACK) .
	$(ISORT) .

# Nettoyage
clean:
	find . -type d -name "__pycache__" -exec rm -r {} +
	find . -type d -name ".pytest_cache" -exec rm -r {} +
	find . -type d -name ".mypy_cache" -exec rm -r {} +
	find . -type f -name "*.py[co]" -delete
	find . -type f -name "*~" -delete
	find . -type f -name ".coverage" -delete

# Docker
docker-build:
	docker build -t equiptrack .

docker-run:
	docker run -p 5000:5000 -v $(PWD)/data:/app/data equiptrack

# Démarrage rapide (installation + initialisation + lancement)
quick-start: install init-db run

# Aide (cible par défaut)
help:
	@echo "Commandes disponibles :"
	@echo "  make install      Installer les dépendances"
	@echo "  make init-db      Initialiser la base de données"
	@echo "  make run          Lancer l'application"
	@echo "  make test         Exécuter les tests"
	@echo "  make lint         Vérifier la qualité du code"
	@echo "  make format       Formater le code"
	@echo "  make clean        Nettoyer les fichiers temporaires"
	@echo "  make docker-build Construire l'image Docker"
	@echo "  make docker-run   Lancer l'application avec Docker"
	@echo "  make quick-start  Installation et démarrage rapides"

.DEFAULT_GOAL := help
