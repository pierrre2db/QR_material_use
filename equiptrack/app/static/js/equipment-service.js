/**
 * EquipTrack - Service des équipements
 * Fournit des méthodes pour interagir avec l'API des équipements
 */

import api from './api';
import { eventBus, Events } from './events';
import { showSuccess, showError } from './notifications';

class EquipmentService {
    /**
     * Récupère la liste des équipements avec pagination
     * @param {Object} params - Paramètres de requête (page, limit, filters, sort, etc.)
     * @returns {Promise<Object>} - Objet contenant les données et la pagination
     */
    async getEquipments(params = {}) {
        try {
            const response = await api.get('/equipments', { params });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des équipements:', error);
            throw error;
        }
    }
    
    /**
     * Récupère un équipement par son ID
     * @param {string} id - ID de l'équipement
     * @returns {Promise<Object>} - Données de l'équipement
     */
    async getEquipmentById(id) {
        try {
            const response = await api.get(`/equipments/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la récupération de l'équipement ${id}:`, error);
            throw error;
        }
    }
    
    /**
     * Crée un nouvel équipement
     * @param {Object} equipmentData - Données du nouvel équipement
     * @returns {Promise<Object>} - Équipement créé
     */
    async createEquipment(equipmentData) {
        try {
            const response = await api.post('/equipments', equipmentData);
            
            // Émettre un événement de création d'équipement
            eventBus.emit(Events.EQUIPMENT_ADDED, response.data);
            
            // Afficher une notification de succès
            showSuccess(`L'équipement "${response.data.name}" a été créé avec succès`);
            
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la création de l'équipement:", error);
            
            // Afficher une notification d'erreur
            showError(error.message || "Une erreur s'est produite lors de la création de l'équipement");
            
            throw error;
        }
    }
    
    /**
     * Met à jour un équipement existant
     * @param {string} id - ID de l'équipement à mettre à jour
     * @param {Object} updateData - Données à mettre à jour
     * @returns {Promise<Object>} - Équipement mis à jour
     */
    async updateEquipment(id, updateData) {
        try {
            const response = await api.put(`/equipments/${id}`, updateData);
            
            // Émettre un événement de mise à jour d'équipement
            eventBus.emit(Events.EQUIPMENT_UPDATED, response.data);
            
            // Afficher une notification de succès
            showSuccess(`L'équipement "${response.data.name}" a été mis à jour avec succès`);
            
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la mise à jour de l'équipement ${id}:`, error);
            
            // Afficher une notification d'erreur
            showError(error.message || "Une erreur s'est produite lors de la mise à jour de l'équipement");
            
            throw error;
        }
    }
    
    /**
     * Supprime un équipement
     * @param {string} id - ID de l'équipement à supprimer
     * @returns {Promise<Object>} - Réponse de l'API
     */
    async deleteEquipment(id) {
        try {
            // Récupérer les données de l'équipement avant suppression pour la notification
            const equipment = await this.getEquipmentById(id);
            
            const response = await api.delete(`/equipments/${id}`);
            
            // Émettre un événement de suppression d'équipement
            eventBus.emit(Events.EQUIPMENT_DELETED, { id, ...equipment });
            
            // Afficher une notification de succès
            showSuccess(`L'équipement "${equipment.name}" a été supprimé avec succès`);
            
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la suppression de l'équipement ${id}:`, error);
            
            // Afficher une notification d'erreur
            showError(error.message || "Une erreur s'est produite lors de la suppression de l'équipement");
            
            throw error;
        }
    }
    
    /**
     * Met à jour le statut d'un équipement
     * @param {string} id - ID de l'équipement
     * @param {string} status - Nouveau statut (disponible/en prêt/en maintenance)
     * @param {string} [notes=''] - Notes optionnelles
     * @returns {Promise<Object>} - Équipement mis à jour
     */
    async updateEquipmentStatus(id, status, notes = '') {
        try {
            const response = await api.patch(`/equipments/${id}/status`, {
                status,
                notes
            });
            
            // Émettre un événement de changement de statut
            eventBus.emit(Events.EQUIPMENT_STATUS_CHANGED, {
                id,
                status,
                previousStatus: response.data.previousStatus,
                equipment: response.data.equipment
            });
            
            // Afficher une notification de succès
            const statusLabels = {
                'available': 'disponible',
                'borrowed': 'emprunté',
                'maintenance': 'en maintenance'
            };
            
            showSuccess(`Le statut de l'équipement a été mis à jour à "${statusLabels[status] || status}"`);
            
            return response.data.equipment;
        } catch (error) {
            console.error(`Erreur lors de la mise à jour du statut de l'équipement ${id}:`, error);
            
            // Afficher une notification d'erreur
            showError(error.message || "Une erreur s'est produite lors de la mise à jour du statut de l'équipement");
            
            throw error;
        }
    }
    
    /**
     * Enregistre une utilisation d'équipement
     * @param {string} equipmentId - ID de l'équipement
     * @param {string} type - Type d'utilisation (borrow, return, maintenance, etc.)
     * @param {Object} [data] - Données supplémentaires (utilisateur, notes, etc.)
     * @returns {Promise<Object>} - Enregistrement d'utilisation créé
     */
    async recordUsage(equipmentId, type, data = {}) {
        try {
            const response = await api.post(`/equipments/${equipmentId}/usage`, {
                type,
                ...data
            });
            
            // Émettre un événement d'utilisation enregistrée
            eventBus.emit(Events.USAGE_RECORDED, response.data);
            
            // Afficher une notification de succès
            const actionLabels = {
                'borrow': 'emprunté',
                'return': 'retourné',
                'maintenance': 'mis en maintenance',
                'scan': 'scanné'
            };
            
            showSuccess(`L'équipement a été marqué comme ${actionLabels[type] || type} avec succès`);
            
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de l'enregistrement de l'utilisation pour l'équipement ${equipmentId}:`, error);
            
            // Afficher une notification d'erreur
            showError(error.message || "Une erreur s'est produite lors de l'enregistrement de l'utilisation");
            
            throw error;
        }
    }
    
    /**
     * Récupère l'historique d'utilisation d'un équipement
     * @param {string} equipmentId - ID de l'équipement
     * @param {Object} [params] - Paramètres de pagination et de filtrage
     * @returns {Promise<Object>} - Historique d'utilisation avec pagination
     */
    async getUsageHistory(equipmentId, params = {}) {
        try {
            const response = await api.get(`/equipments/${equipmentId}/history`, { params });
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la récupération de l'historique pour l'équipement ${equipmentId}:`, error);
            throw error;
        }
    }
    
    /**
     * Recherche des équipements selon des critères
     * @param {Object} criteria - Critères de recherche
     * @param {Object} [options] - Options de pagination et de tri
     * @returns {Promise<Object>} - Résultats de la recherche avec pagination
     */
    async searchEquipments(criteria = {}, options = {}) {
        try {
            const response = await api.post('/equipments/search', {
                criteria,
                options: {
                    page: 1,
                    limit: 10,
                    sort: { createdAt: -1 },
                    ...options
                }
            });
            
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la recherche d\'équipements:', error);
            throw error;
        }
    }
    
    /**
     * Exporte les équipements au format CSV
     * @param {Object} [filters] - Filtres à appliquer à l'export
     * @returns {Promise<void>}
     */
    async exportToCsv(filters = {}) {
        try {
            // Afficher une notification de chargement
            const notification = showInfo('Préparation de l\'export en cours...', {
                autoClose: false
            });
            
            const response = await api.get('/equipments/export/csv', {
                params: filters,
                responseType: 'blob'
            });
            
            // Créer un objet URL pour le téléchargement
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            // Extraire le nom de fichier depuis les en-têtes de réponse
            const contentDisposition = response.headers['content-disposition'];
            let filename = 'equipments-export.csv';
            
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
            console.error('Erreur lors de l\'export des équipements en CSV:', error);
            
            // Afficher une notification d'erreur
            showError(error.message || "Une erreur s'est produite lors de l'export des équipements");
            
            throw error;
        }
    }
    
    /**
     * Importe des équipements à partir d'un fichier
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
                '/equipments/import', 
                file, 
                'file', 
                options, 
                { onUploadProgress }
            );
            
            // Émettre un événement d'importation réussie
            eventBus.emit('equipments:imported', response.data);
            
            // Mettre à jour la notification avec un message de succès
            notification.update({
                message: `Import réussi: ${response.data.imported} équipement(s) importé(s)`,
                type: 'success',
                autoClose: 5000
            });
            
            return response.data;
        } catch (error) {
            console.error('Erreur lors de l\'import des équipements:', error);
            
            // Afficher une notification d'erreur avec des détails si disponibles
            let errorMessage = error.message || "Une erreur s'est produite lors de l'import des équipements";
            
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
    
    /**
     * Génère un code QR pour un nouvel équipement
     * @returns {Promise<string>} - Code QR généré
     */
    async generateQrCode() {
        try {
            const response = await api.post('/equipments/generate-qr');
            return response.data.qrCode;
        } catch (error) {
            console.error('Erreur lors de la génération du code QR:', error);
            
            // Afficher une notification d'erreur
            showError(error.message || "Une erreur s'est produite lors de la génération du code QR");
            
            throw error;
        }
    }
    
    /**
     * Récupère les statistiques d'utilisation des équipements
     * @param {Object} [params] - Paramètres de la requête (période, filtres, etc.)
     * @returns {Promise<Object>} - Statistiques d'utilisation
     */
    async getStatistics(params = {}) {
        try {
            const response = await api.get('/equipments/statistics', { params });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            
            // Afficher une notification d'erreur
            showError(error.message || "Une erreur s'est produite lors de la récupération des statistiques");
            
            throw error;
        }
    }
}

// Créer une instance du service
const equipmentService = new EquipmentService();

// Exposer l'instance globale
window.EquipTrack = window.EquipTrack || {};
window.EquipTrack.equipmentService = equipmentService;

// Exporter l'instance par défaut et la classe
export { equipmentService as default, EquipmentService };
