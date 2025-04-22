# Guide de contribution

Merci de votre intérêt pour contribuer au projet QR Material Use ! Ce document fournit des lignes directrices pour contribuer au projet.

## Environnement de développement

1. Clonez le dépôt
```bash
git clone https://github.com/pierrre2db/QR_material_use.git
cd QR_material_use
```

2. Créez un environnement virtuel et installez les dépendances
```bash
python -m venv .venv
source .venv/bin/activate  # Sur Windows : .venv\Scripts\activate
pip install -r requirements.txt
```

3. Initialisez la base de données
```bash
python update_db.py
```

4. Lancez l'application en mode développement
```bash
flask run
```

## Processus de contribution

1. Créez une branche pour votre fonctionnalité ou correction
```bash
git checkout -b feature/nom-de-votre-fonctionnalite
```

2. Effectuez vos modifications et testez-les

3. Assurez-vous que votre code respecte les conventions de style
```bash
# Si vous avez installé flake8
flake8 app/
```

4. Committez vos changements
```bash
git add .
git commit -m "Description claire de vos modifications"
```

5. Poussez votre branche vers GitHub
```bash
git push origin feature/nom-de-votre-fonctionnalite
```

6. Créez une Pull Request sur GitHub

## Conventions de codage

- Suivez la [PEP 8](https://www.python.org/dev/peps/pep-0008/) pour le code Python
- Utilisez des noms de variables et de fonctions explicites
- Commentez votre code lorsque nécessaire
- Écrivez des docstrings pour les fonctions et les classes
- Utilisez des messages de commit clairs et descriptifs

## Rapporter des bugs

Si vous trouvez un bug, veuillez créer une issue sur GitHub avec les informations suivantes :
- Description détaillée du bug
- Étapes pour reproduire le problème
- Comportement attendu vs comportement observé
- Captures d'écran si applicable
- Informations sur votre environnement (OS, navigateur, version de Python, etc.)

## Proposer des fonctionnalités

Si vous souhaitez proposer une nouvelle fonctionnalité :
1. Créez une issue décrivant la fonctionnalité
2. Expliquez pourquoi cette fonctionnalité serait utile
3. Discutez de l'implémentation potentielle
4. Attendez l'approbation avant de commencer le développement

## Tests

Assurez-vous que vos modifications passent tous les tests existants et ajoutez de nouveaux tests si nécessaire.

```bash
python -m pytest
```

## Licence

En contribuant à ce projet, vous acceptez que vos contributions soient sous la même licence que le projet (voir le fichier LICENSE).

---

© 2025 Pierre De Dobbeleer - EAFC-TIC.BE
