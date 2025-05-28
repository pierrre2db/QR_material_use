# 📋 Spécifications du Produit - MVP EduTrack Mini

**EduTrack Mini**  
*Suivi des Équipements Éducatifs*

*Rédigé par Pierre De Dobbeleer*  
*Dernière mise à jour : 21 mai 2025*  
*Version du document : 2.0*  
*Date cible de livraison : Septembre 2025*

---

## 📌 Sommaire Exécutif

### 1. Vue d'Ensemble

EduTrack Mini est une solution légère et intuitive pour le suivi de l'utilisation des équipements éducatifs dans les établissements scolaires. Développée avec Flask et SQLite, elle permet de gérer efficacement le parc matériel en se concentrant sur le suivi d'utilisation des équipements fixes.

### 💡 Points Clés
- **Public Cible** : Établissements d'enseignement en Fédération Wallonie-Bruxelles
- **Périmètre** : Suivi de l'utilisation des équipements fixes
- **Délai** : MVP pour Septembre 2025
- **Équipe** : 1 développeur (temps partiel) + support techno-pédagogique

### 🚀 Avantages Clés
1. **Simplicité** : Interface intuitive et légère
2. **Facilité de déploiement** : Fonctionne sur Raspberry Pi ou PC existant
3. **Suivi précis** : Enregistrement fiable de l'utilisation des équipements
4. **Conforme RGPD** : Protection des données utilisateurs
5. **Maintenance réduite** : Mises à jour trimestrielles

### 📈 Indicateurs de Succès
- Couverture de 90% des équipements ciblés
- Satisfaction utilisateur > 4.5/5
- Temps de formation < 30 minutes
- 100% de conformité RGPD
- Temps de résolution < 1 semaine pour les problèmes critiques

### 📞 Support
- Support par email : pierre@eafc-tic.be
- Documentation en ligne complète
- Mises à jour planifiées tous les 3 mois
- Correctifs critiques sous 1 semaine

---

## 1. Vue d'Ensemble

### 1.1 Contexte
Les établissements scolaires doivent justifier l'utilisation des équipements subventionnés. Actuellement, ce suivi est souvent effectué manuellement, ce qui s'avère chronophage et peu fiable. EduTrack Mini automatise ce processus tout en restant simple d'utilisation.

### 1.2 Objectifs
- Permettre l'enregistrement facile et rapide de l'utilisation des équipements
- Générer des rapports d'utilisation détaillés
- Fournir une preuve fiable de l'utilisation des équipements pour les subventions
- Réduire la charge administrative liée au suivi manuel

### 1.3 Contraintes Techniques
- Développement par une seule personne à temps partiel
- Compatibilité avec Raspberry Pi et PC standards
- Interface nécessitant moins de 30 minutes de formation
- Respect strict du RGPD
- Mises à jour trimestrielles maximum

---

## 2. Fonctionnalités du MVP

### 2.1 Gestion des Équipements
- Enregistrement des équipements fixes par salle
- Désignation et description claire de chaque équipement
- Statut de disponibilité en temps réel

### 2.2 Suivi d'Utilisation
- Saisie manuelle des périodes d'utilisation
- Enregistrement de la date, heure et utilisateur
- Suivi en temps réel de l'état des équipements
- Historique des utilisations

### 2.3 Rapports et Exports
- Génération de rapports d'utilisation
- Export des données en CSV/Excel
- Tableaux de bord synthétiques
- Filtres par période, équipement et utilisateur
- Vue synthétique de l'utilisation par période
- Taux d'utilisation par équipement

### 2.4 Administration
- Gestion des utilisateurs (admin/enseignant)
- Configuration des salles et équipements
- Sauvegarde des données

---

## 3. Spécifications Techniques

### 3.1 Architecture
- Application web légère
- Base de données SQLite
- Interface responsive simple

### 3.2 Hébergement
- Compatible Raspberry Pi et PC standards
- Aucun serveur dédié requis
- Accès via navigateur sur réseau local

### 3.3 Sécurité
- Authentification simple
- Données stockées localement
- Sauvegardes automatiques

---

## 4. Planning

### 4.1 Juin-Juillet 2025
- Développement des fonctionnalités de base
- Interface utilisateur minimale
- Tests unitaires

### 4.2 Août 2025
- Tests avec l'équipe techno-pédagogique
- Corrections et ajustements
- Documentation utilisateur

### 4.3 Septembre 2025
- Déploiement pilote
- Formation des utilisateurs
- Support initial

---

## 5. Support et Maintenance

### 5.1 Support
- Support par email : pierre@eafc-tic.be
- Documentation en ligne
- FAQ intégrée

### 5.2 Maintenance
- Mises à jour occasionnelles selon les besoins
- Corrections de bugs en fonction des retours
- Sauvegardes gérées localement

---

## 6. Perspectives Futures (Post-MVP)

- Intégration avec les systèmes existants
- Tableau de bord avancé
- Notifications automatisées
- Gestion des prêts d'équipements

---

*Document créé le 21/05/2024 - Tous droits réservés*
