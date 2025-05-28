/**
 * EquipTrack - API des équipements
 * Fournit des méthodes pour interagir avec l'API des équipements
 */

import api from './api';

class EquipmentApi {
    /**
     * Récupère la liste des équipements
     * @param {Object} params - Paramètres de requête (filtres, pagination, etc.)
     * @returns {Promise} Promesse résolue avec la liste des équipements
     */
    static async getEquipments(params = {}) {
        try {
            const response = await api.get('/equipments', { params });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des équipements:', error);
            throw error;
        }
    }
    
    /**
     * Récupère un équipement par son QR code
     * @param {string} qrCode - Code QR de l'équipement
     * @returns {Promise} Promesse résolue avec les détails de l'équipement
     */
    static async getEquipmentByQrCode(qrCode) {
        try {
            const response = await api.get(`/equipments/${encodeURIComponent(qrCode)}`);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la récupération de l'équipement ${qrCode}:`, error);
            throw error;
        }
    }
    
    /**
     * Crée un nouvel équipement
     * @param {Object} equipmentData - Données du nouvel équipement
     * @returns {Promise} Promesse résolue avec l'équipement créé
     */
    static async createEquipment(equipmentData) {
        try {
            const response = await api.post('/equipments', equipmentData);
            return response.data;
        } catch (error) {
            console.error("Erreur lors de la création de l'équipement:", error);
            throw error;
        }
    }
    
    /**
     * Met à jour un équipement existant
     * @param {string} qrCode - Code QR de l'équipement à mettre à jour
     * @param {Object} updateData - Données à mettre à jour
     * @returns {Promise} Promesse résolue avec l'équipement mis à jour
     */
    static async updateEquipment(qrCode, updateData) {
        try {
            const response = await api.put(`/equipments/${encodeURIComponent(qrCode)}`, updateData);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la mise à jour de l'équipement ${qrCode}:`, error);
            throw error;
        }
    }
    
    /**
     * Supprime un équipement
     * @param {string} qrCode - Code QR de l'équipement à supprimer
     * @returns {Promise} Promesse résolue après la suppression
     */
    static async deleteEquipment(qrCode) {
        try {
            const response = await api.delete(`/equipments/${encodeURIComponent(qrCode)}`);
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la suppression de l'équipement ${qrCode}:`, error);
            throw error;
        }
    }
    
    /**
     * Enregistre une utilisation d'équipement
     * @param {string} qrCode - Code QR de l'équipement
     * @ {string} usageType - Type d'utilisation (scan/emprunt/retour/maintenance)
     * @param {string} userId - Identifiant de l'utilisateur
     * @param {string} notes - Notes optionnelles
     * @returns {Promise} Promesse résolue avec l'enregistrement d'utilisation
     */
    static async recordUsage(qrCode, usageType, userId = null, notes = '') {
        try {
            const response = await api.post(`/equipments/${encodeURIComponent(qrCode)}/usage`, {
                type: usageType,
                user: userId,
                notes: notes
            });
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de l'enregistrement de l'utilisation pour l'équipement ${qrCode}:`, error);
            throw error;
        }
    }
    
    /**
     * Récupère l'historique d'utilisation d'un équipement
     * @param {string} qrCode - Code QR de l'équipement
     * @param {Object} params - Paramètres de requête (filtres, pagination, etc.)
     * @returns {Promise} Promesse résolue avec l'historique d'utilisation
     */
    static async getUsageHistory(qrCode, params = {}) {
        try {
            const response = await api.get(`/equipments/${encodeURIComponent(qrCode)}/history`, { params });
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la récupération de l'historique pour l'équipement ${qrCode}:`, error);
            throw error;
        }
    }
    
    /**
     * Génère un code QR pour un nouvel équipement
     * @returns {Promise} Promesse résolue avec le code QR généré
     */
    static async generateQrCode() {
        try {
            const response = await api.post('/equipments/generate-qr');
            return response.data.qrCode;
        } catch (error) {
            console.error('Erreur lors de la génération du code QR:', error);
            throw error;
        }
    }
    
    /**
     * Exporte la liste des équipements au format CSV
     * @param {Object} params - Paramètres de filtrage
     * @returns {Promise} Promesse résolue avec les données CSV
     */
    static async exportToCsv(params = {}) {
        try {
            const response = await api.get('/equipments/export/csv', { 
                params,
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
            
            return { success: true, filename };
        } catch (error) {
            console.error('Erreur lors de l\'export des équipements en CSV:', error);
            throw error;
        }
    }
    
    /**
     * Récupère les statistiques d'utilisation des équipements
     * @param {Object} params - Paramètres de la requête (période, filtres, etc.)
     * @returns {Promise} Promesse résolue avec les statistiques
     */
    static async getStatistics(params = {}) {
        try {
            const response = await api.get('/equipments/statistics', { params });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            throw error;
        }
    }
    
    /**
     * Met à jour le statut d'un équipement
     * @param {string} qrCode - Code QR de l'équipement
     * @param {string} status - Nouveau statut (disponible/en prêt/en maintenance)
     * @param {string} notes - Notes optionnelles
     * @returns {Promise} Promesse résolue avec l'équipement mis à jour
     */
    static async updateStatus(qrCode, status, notes = '') {
        try {
            const response = await api.patch(`/equipments/${encodeURIComponent(qrCode)}/status`, {
                status,
                notes
            });
            return response.data;
        } catch (error) {
            console.error(`Erreur lors de la mise à jour du statut de l'équipement ${qrCode}:`, error);
            throw error;
        }
    }
    
    /**
     * Effectue une recherche avancée d'équipements
     * @param {Object} criteria - Critères de recherche
     * @param {Object} options - Options de pagination et de tri
     * @returns {Promise} Promesse résolue avec les résultats de la recherche
     */
    static async search(criteria = {}, options = {}) {
        try {
            const response = await api.post('/equipments/search', {
                criteria,
                options
            });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la recherche d\'équipements:', error);
            throw error;
        }
    }
    
    /**
     * Importe des équipements à partir d'un fichier
     * @param {File} file - Fichier à importer (CSV, Excel, etc.)
     * @param {Object} options - Options d'importation
     * @param {Function} onProgress - Fonction de rappel pour suivre la progression
     * @returns {Promise} Promesse résolue avec le résultat de l'importation
     */
    static async importFromFile(file, options = {}, onProgress = null) {
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            if (options) {
                Object.keys(options).forEach(key => {
                    formData.append(key, options[key]);
                });
            }
            
            const response = await api.upload('/equipments/import', file, 'file', options, {}, onProgress);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de l\'import des équipements:', error);
            throw error;
        }
    }
}

// Exposer l'API au niveau global
window.EquipTrack = window.EquipTrack || {};
window.EquipTrack.EquipmentApi = EquipmentApi;

export default EquipmentApi;
