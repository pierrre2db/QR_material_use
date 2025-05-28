# Utiliser une image Python officielle comme image parente
FROM python:3.9-slim

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY requirements.txt .

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Copier le reste des fichiers de l'application
COPY . .

# Créer le dossier de données s'il n'existe pas
RUN mkdir -p data

# Exposer le port sur lequel l'application va s'exécuter
EXPOSE 5000

# Commande pour exécuter l'application
CMD ["python", "app.py"]
