from app import create_app
from netlify_lambda_wsgi import make_lambda_handler

# Créer l'application Flask
app = create_app()

# Créer le handler Lambda pour Netlify
handler = make_lambda_handler(app)
