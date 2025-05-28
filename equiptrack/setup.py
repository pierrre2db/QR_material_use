from setuptools import setup, find_packages
import os

def read_requirements():
    """Lit les dépendances depuis le fichier requirements.txt."""
    with open('requirements.txt', 'r', encoding='utf-8') as f:
        return [line.strip() for line in f if line.strip() and not line.startswith('#')]

# Lire la description depuis le README.md
with open('README.md', 'r', encoding='utf-8') as f:
    long_description = f.read()

setup(
    name='equiptrack',
    version='0.1.0',
    author='Votre Nom',
    author_email='votre.email@example.com',
    description='Application de suivi des équipements électroniques',
    long_description=long_description,
    long_description_content_type='text/markdown',
    url='https://github.com/votrenom/equiptrack',
    packages=find_packages(),
    include_package_data=True,
    install_requires=read_requirements(),
    classifiers=[
        'Development Status :: 3 - Alpha',
        'Intended Audience :: Education',
        'License :: OSI Approved :: MIT License',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
        'Framework :: Flask',
    ],
    python_requires='>=3.8',
    entry_points={
        'console_scripts': [
            'equiptrack=wsgi:app',
        ],
    },
    # Inclure les fichiers statiques et templates
    package_data={
        'equiptrack': [
            'templates/**/*',
            'static/**/*',
        ],
    },
)
