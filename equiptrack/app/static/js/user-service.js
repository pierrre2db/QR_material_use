/**
 * EquipTrack - Service des utilisateurs
 * Fournit des méthodes pour interagir avec l'API des utilisateurs
 */

import api from './api';
import { eventBus, Events } from './events';
import { showSuccess, showError } from './notifications';

class UserService {
    /**
     * Récupère la liste des utilisateurs avec pagination
     * @param {Object} params - Paramètres de requête (page, limit, filters, sort, etc.)
     * @returns {Promise<Object>} - Objet contenant les données et la pagination
     */
    async getUsers(params = {}) {
        try {
            const response = await api.get('/users', { params });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs:', error);
            throw error;
        }
    }
    
    /**
     * Récupère un utilisateur par son ID
     * @param {string} id - ID de l'utilisateur
     * @returns {Promise<Object>} - Données de l'utilisateur
     */
    async getUserById(id) {
        try {
            const response = await api.get(`/users/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la récupération de l'utilisateur ${id}:`, error);
            throw error;
        }
    }
    
    /**
     * Crée un nouvel utilisateur
     * @param {Object} userData - Données du nouvel utilisateur
     * @returns {Promise<Object>} - Utilisateur créé
     */
    async createUser(userData) {
        try {
            const response = await api.post('/users', userData);
            
            // Émettre un événement de création d'utilisateur
            eventBus.emit(Events.USER_CREATED, response.data);
            
            // Afficher une notification de succès
            showSuccess(`L'utilisateur "${response.data.username}" a été créé avec succès`);
            
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la création de l'utilisateur:", error);
            
            // Afficher une notification d'erreur
            showError(error.message || "Une erreur s'est produite lors de la création de l'utilisateur");
            
            throw error;
        }
    }
    
    /**
     * Met à jour un utilisateur existant
     * @param {string} id - ID de l'utilisateur à mettre à jour
     * @param {Object} updateData - Données à mettre à jour
     * @returns {Promise<Object>} - Utilisateur mis à jour
     */
    async updateUser(id, updateData) {
        try {
            const response = await api.put(`/users/${id}`, updateData);
            
            // Émettre un événement de mise à jour d'utilisateur
            eventBus.emit(Events.USER_UPDATED, response.data);
            
            // Afficher une notification de succès
            showSuccess(`L'utilisateur "${response.data.username}" a été mis à jour avec succès`);
            
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la mise à jour de l'utilisateur ${id}:`, error);
            
            // Afficher une notification d'erreur
            showError(error.message || "Une erreur s'est produite lors de la mise à jour de l'utilisateur");
            
            throw error;
        }
    }
    
    /**
     * Supprime un utilisateur
     * @param {string} id - ID de l'utilisateur à supprimer
     * @returns {Promise<Object>} - Réponse de l'API
     */
    async deleteUser(id) {
        try {
            // Récupérer les données de l'utilisateur avant suppression pour la notification
            const user = await this.getUserById(id);
            
            const response = await api.delete(`/users/${id}`);
            
            // Émettre un événement de suppression d'utilisateur
            eventBus.emit(Events.USER_DELETED, { id, ...user });
            
            // Afficher une notification de succès
            showSuccess(`L'utilisateur "${user.username}" a été supprimé avec succès`);
            
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la suppression de l'utilisateur ${id}:`, error);
            
            // Afficher une notification d'erreur
            showError(error.message || "Une erreur s'est produite lors de la suppression de l'utilisateur");
            
            throw error;
        }
    }
    
    /**
     * Met à jour le mot de passe d'un utilisateur
     * @param {string} id - ID de l'utilisateur
     * @param {string} currentPassword - Mot de passe actuel
     * @param {string} newPassword - Nouveau mot de passe
     * @returns {Promise<Object>} - Réponse de l'API
     */
    async updatePassword(id, currentPassword, newPassword) {
        try {
            const response = await api.put(`/users/${id}/password`, {
                currentPassword,
                newPassword
            });
            
            // Émettre un événement de changement de mot de passe
            eventBus.emit(Events.USER_PASSWORD_CHANGED, { id });
            
            // Afficher une notification de succès
            showSuccess('Le mot de passe a été mis à jour avec succès');
            
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la mise à jour du mot de passe de l'utilisateur ${id}:`, error);
            
            // Afficher une notification d'erreur
            showError(error.message || "Une erreur s'est produite lors de la mise à jour du mot de passe");
            
            throw error;
        }
    }
    
    /**
     * Réinitialise le mot de passe d'un utilisateur (admin uniquement)
     * @param {string} id - ID de l'utilisateur
     * @param {string} newPassword - Nouveau mot de passe
     * @returns {Promise<Object>} - Réponse de l'API
     */
    async resetPassword(id, newPassword) {
        try {
            const response = await api.post(`/users/${id}/reset-password`, {
                newPassword
            });
            
            // Émettre un événement de réinitialisation de mot de passe
            eventBus.emit(Events.USER_PASSWORD_RESET, { id });
            
            // Afficher une notification de succès
            showSuccess('Le mot de passe a été réinitialisé avec succès');
            
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la réinitialisation du mot de passe de l'utilisateur ${id}:`, error);
            
            // Afficher une notification d'erreur
            showError(error.message || "Une erreur s'est produite lors de la réinitialisation du mot de passe");
            
            throw error;
        }
    }
    
    /**
     * Active ou désactive un compte utilisateur
     * @param {string} id - ID de l'utilisateur
     * @param {boolean} active - État d'activation
     * @returns {Promise<Object>} - Utilisateur mis à jour
     */
    async setUserActiveStatus(id, active) {
        try {
            const response = await api.patch(`/users/${id}/status`, { active });
            
            // Émettre un événement de changement de statut
            eventBus.emit(Events.USER_STATUS_CHANGED, {
                id,
                active,
                user: response.data
            });
            
            // Afficher une notification de succès
            showSuccess(`Le compte utilisateur a été ${active ? 'activé' : 'désactivé'} avec succès`);
            
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la mise à jour du statut de l'utilisateur ${id}:`, error);
            
            // Afficher une notification d'erreur
            showError(error.message || "Une erreur s'est produite lors de la mise à jour du statut de l'utilisateur");
            
            throw error;
        }
    }
    
    /**
     * Récupère le profil de l'utilisateur connecté
     * @returns {Promise<Object>} - Profil de l'utilisateur
     */
    async getProfile() {
        try {
            const response = await api.get('/users/me');
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération du profil utilisateur:', error);
            
            // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
            if (error.response && error.response.status === 401) {
                window.location.href = '/login';
            }
            
            throw error;
        }
    }
    
    /**
     * Met à jour le profil de l'utilisateur connecté
     * @param {Object} updateData - Données à mettre à jour
     * @returns {Promise<Object>} - Profil mis à jour
     */
    async updateProfile(updateData) {
        try {
            const response = await api.put('/users/me', updateData);
            
            // Émettre un événement de mise à jour de profil
            eventBus.emit(Events.USER_PROFILE_UPDATED, response.data);
            
            // Afficher une notification de succès
            showSuccess('Votre profil a été mis à jour avec succès');
            
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil utilisateur:', error);
            
            // Afficher une notification d'erreur
            showError(error.message || "Une erreur s'est produite lors de la mise à jour de votre profil");
            
            throw error;
        }
    }
    
    /**
     * Change le mot de passe de l'utilisateur connecté
     * @param {string} currentPassword - Mot de passe actuel
     * @param {string} newPassword - Nouveau mot de passe
     * @returns {Promise<Object>} - Réponse de l'API
     */
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await api.put('/users/me/password', {
                currentPassword,
                newPassword
            });
            
            // Émettre un événement de changement de mot de passe
            eventBus.emit(Events.USER_PASSWORD_CHANGED, { id: 'me' });
            
            // Afficher une notification de succès
            showSuccess('Votre mot de passe a été modifié avec succès');
            
            return response.data;
        } catch (error) {
            console.error('Erreur lors du changement de mot de passe:', error);
            
            // Afficher une notification d'erreur
            showError(error.message || "Une erreur s'est produite lors du changement de mot de passe");
            
            throw error;
        }
    }
    
    /**
     * Exporte la liste des utilisateurs au format CSV
     * @param {Object} [filters] - Filtres à appliquer à l'export
     * @returns {Promise<void>}
     */
    async exportToCsv(filters = {}) {
        try {
            // Afficher une notification de chargement
            const notification = showInfo('Préparation de l\'export en cours...', {
                autoClose: false
            });
            
            const response = await api.get('/users/export/csv', {
                params: filters,
                responseType: 'blob'
            });
            
            // Créer un objet URL pour le téléchargement
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            // Extraire le nom de fichier depuis les en-têtes de réponse
            const contentDisposition = response.headers['content-disposition'];
            let filename = 'users-export.csv';
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch != null && filenameMatch[1]) { 
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }
            
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            // Libérer l'URL de l'objet
            window.URL.revokeObjectURL(url);
            
            // Mettre à jour la notification avec un message de succès
            notification.update({
                message: `Export terminé: ${filename}`,
                type: 'success',
                autoClose: 3000
            });
            
            return { success: true, filename };
        } catch (error) {
            console.error('Erreur lors de l\'export des utilisateurs en CSV:', error);
            
            // Afficher une notification d'erreur
            showError(error.message || "Une erreur s'est produite lors de l'export des utilisateurs");
            
            throw error;
        }
    }
    
    /**
     * Importe des utilisateurs à partir d'un fichier
     * @param {File} file - Fichier à importer (CSV, Excel, etc.)
     * @param {Object} [options] - Options d'importation
     * @param {Function} [onProgress] - Fonction de rappel pour suivre la progression
     * @returns {Promise<Object>} - Résultat de l'importation
     */
    async importFromFile(file, options = {}, onProgress = null) {
        try {
            // Afficher une notification de chargement
            const notification = showInfo('Import en cours...', {
                autoClose: false
            });
            
            // Créer un FormData pour l'envoi du fichier
            const formData = new FormData();
            formData.append('file', file);
            
            // Ajouter les options au FormData
            Object.entries(options).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    formData.append(key, value);
                }
            });
            
            // Fonction de suivi de la progression
            const onUploadProgress = (progressEvent) => {
                if (onProgress && typeof onProgress === 'function') {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted, progressEvent);
                }
                
                // Mettre à jour la notification avec la progression
                if (progressEvent.lengthComputable) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    notification.update({
                        message: `Import en cours: ${percentCompleted}%`
                    });
                }
            };
            
            // Envoyer la requête d'importation
            const response = await api.upload(
                '/users/import', 
                file, 
                'file', 
                options, 
                { onUploadProgress }
            );
            
            // Émettre un événement d'importation réussie
            eventBus.emit('users:imported', response.data);
            
            // Mettre à jour la notification avec un message de succès
            notification.update({
                message: `Import réussi: ${response.data.imported} utilisateur(s) importé(s)`,
                type: 'success',
                autoClose: 5000
            });
            
            return response.data;
        } catch (error) {
            console.error('Erreur lors de l\'import des utilisateurs:', error);
            
            // Afficher une notification d'erreur avec des détails si disponibles
            let errorMessage = error.message || "Une erreur s'est produite lors de l'import des utilisateurs";
            
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
                
                if (error.response.data.errors) {
                    errorMessage += ' ' + Object.values(error.response.data.errors).flat().join(' ');
                }
            }
            
            showError(errorMessage);
            
            throw error;
        }
    }
}

// Créer une instance du service
const userService = new UserService();

// Exposer l'instance globale
window.EquipTrack = window.EquipTrack || {};
window.EquipTrack.userService = userService;

// Exporter l'instance par défaut et la classe
export { userService as default, UserService };
