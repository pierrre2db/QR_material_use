# Guide de contribution

Merci de votre intérêt pour EquipTrack ! Voici comment vous pouvez contribuer au projet.

## Environnement de développement

1. **Fork** le dépôt et clonez votre fork
2. Créez un environnement virtuel :
   ```bash
   python -m venv venv
   source venv/bin/activate  # Sur Windows: venv\Scripts\activate
   ```
3. Installez les dépendances de développement :
   ```bash
   pip install -r requirements-dev.txt
   ```
4. Installez les hooks git (optionnel mais recommandé) :
   ```bash
   pre-commit install
   ```

## Workflow de développement

1. Créez une branche pour votre fonctionnalité :
   ```bash
   git checkout -b feature/nom-de-la-fonctionnalite
   ```
2. Faites vos modifications
3. Vérifiez le code avec les outils de qualité :
   ```bash
   flake8 .
   black .
   isort .
   ```
4. Lancez les tests :
   ```bash
   pytest
   ```
5. Poussez votre branche et créez une Pull Request

## Standards de code

- Suivez le style de code existant
- Écrivez des tests unitaires pour les nouvelles fonctionnalités
- Documentez les nouvelles fonctionnalités
- Gardez les commits atomiques et bien décrits
- Utilisez des messages de commit conventionnels

## Signaler des bugs

Si vous trouvez un bug, merci d'ouvrir une issue en suivant le modèle fourni.

## Proposer des fonctionnalités

Les suggestions d'amélioration sont les bienvenues ! Ouvrez une issue pour discuter de votre idée avant de coder.

## Code de conduite

Veuillez noter que ce projet est régi par un code de conduite. En participant, vous êtes tenu de respecter ce code.

## Licence

En contribuant, vous acceptez que vos contributions soient sous la même licence que le projet.
