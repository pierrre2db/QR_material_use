/**
 * EquipTrack - Client API
 * Fournit une couche d'abstraction pour les appels API avec gestion des erreurs et authentification
 */

import axios from 'axios';
import { eventBus, Events } from './events';
import { showError, showInfo } from './notifications';
import auth from './auth';

/**
 * Classe pour gérer les appels API
 */
class ApiClient {
    /**
     * Crée une nouvelle instance d'ApiClient
     * @param {Object} options - Options de configuration
     * @param {string} options.baseURL - URL de base de l'API
     * @param {Object} options.headers - En-têtes HTTP par défaut
     * @param {number} options.timeout - Délai d'expiration des requêtes en ms
     * @param {boolean} options.withCredentials - Si les requêtes doivent inclure les informations d'identification
     * @param {Function} options.onUnauthenticated - Fonction à appeler en cas d'erreur d'authentification
     * @param {Function} options.onError - Gestionnaire d'erreurs global
     */
    constructor(options = {}) {
        // Options par défaut
        this.options = {
            baseURL: '/api',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 30000, // 30 secondes
            withCredentials: true,
            ...options
        };
        
        // Créer une instance Axios avec les options de base
        this.client = axios.create({
            baseURL: this.options.baseURL,
            headers: this.options.headers,
            timeout: this.options.timeout,
            withCredentials: this.options.withCredentials
        });
        
        // Configurer les intercepteurs de requête
        this._setupRequestInterceptors();
        
        // Configurer les intercepteurs de réponse
        this._setupResponseInterceptors();
    }
    
    /**
     * Configure les intercepteurs de requête
     * @private
     */
    _setupRequestInterceptors() {
        // Intercepteur pour ajouter le jeton d'authentification
        this.client.interceptors.request.use(
            (config) => {
                // Ajouter le jeton d'accès s'il est disponible
                const accessToken = auth.getAccessToken();
                if (accessToken && !config.headers.Authorization) {
                    config.headers.Authorization = `Bearer ${accessToken}`;
                }
                
                // Émettre un événement de début de requête
                const requestId = this._generateRequestId();
                config.metadata = { 
                    ...config.metadata,
                    requestId,
                    startTime: new Date().getTime()
                };
                
                eventBus.emit(Events.API_REQUEST_START, {
                    id: requestId,
                    url: config.url,
                    method: config.method,
                    params: config.params,
                    data: config.data
                });
                
                return config;
            },
            (error) => {
                // Gérer les erreurs de requête
                return Promise.reject(error);
            }
        );
    }
    
    /**
     * Configure les intercepteurs de réponse
     * @private
     */
    _setupResponseInterceptors() {
        // Intercepteur pour gérer les réponses et les erreurs
        this.client.interceptors.response.use(
            (response) => {
                // Calculer la durée de la requête
                const endTime = new Date().getTime();
                const startTime = response.config.metadata?.startTime || endTime;
                const duration = endTime - startTime;
                
                // Émettre un événement de fin de requête réussie
                eventBus.emit(Events.API_REQUEST_END, {
                    id: response.config.metadata?.requestId,
                    url: response.config.url,
                    method: response.config.method,
                    status: response.status,
                    duration,
                    response: response.data
                });
                
                return response;
            },
            async (error) => {
                // Vérifier si c'est une erreur de réseau
                if (!error.response) {
                    const errorMessage = 'Erreur de connexion au serveur. Veuillez vérifier votre connexion Internet.';
                    
                    // Émettre un événement d'erreur
                    eventBus.emit(Events.API_REQUEST_ERROR, {
                        error: 'NETWORK_ERROR',
                        message: errorMessage,
                        originalError: error
                    });
                    
                    // Afficher une notification d'erreur
                    showError(errorMessage);
                    
                    return Promise.reject({
                        error: 'NETWORK_ERROR',
                        message: errorMessage,
                        originalError: error
                    });
                }
                
                const { status, data } = error.response;
                const requestId = error.config?.metadata?.requestId;
                const url = error.config?.url;
                const method = error.config?.method;
                
                // Calculer la durée de la requête
                const endTime = new Date().getTime();
                const startTime = error.config?.metadata?.startTime || endTime;
                const duration = endTime - startTime;
                
                // Émettre un événement de fin de requête avec erreur
                eventBus.emit(Events.API_REQUEST_END, {
                    id: requestId,
                    url,
                    method,
                    status,
                    duration,
                    error: data || error.message
                });
                
                // Gérer les erreurs spécifiques
                switch (status) {
                    case 400: // Bad Request
                        // Émettre un événement d'erreur de validation
                        eventBus.emit(Events.API_VALIDATION_ERROR, {
                            status,
                            errors: data?.errors || {},
                            message: data?.message || 'Requête invalide',
                            requestId,
                            url,
                            method
                        });
                        
                        // Afficher les erreurs de validation si disponibles
                        if (data?.errors) {
                            const errorMessages = Object.values(data.errors)
                                .flat()
                                .filter(Boolean);
                                
                            if (errorMessages.length > 0) {
                                showError(errorMessages.join('\n'), { timeout: 10000 });
                            } else {
                                showError(data.message || 'Une erreur est survenue');
                            }
                        } else {
                            showError(data?.message || 'Une erreur est survenue');
                        }
                        break;
                        
                    case 401: // Unauthorized
                        // Émettre un événement d'erreur d'authentification
                        eventBus.emit(Events.AUTH_REQUIRED, {
                            status,
                            message: data?.message || 'Authentification requise',
                            requestId,
                            url,
                            method
                        });
                        
                        // Tenter de rafraîchir le jeton si possible
                        if (auth.isAuthenticated() && !error.config._retry) {
                            try {
                                // Marquer la requête comme étant en cours de réessai
                                error.config._retry = true;
                                
                                // Rafraîchir le jeton
                                await auth.refreshToken();
                                
                                // Réessayer la requête originale avec le nouveau jeton
                                const originalRequest = error.config;
                                originalRequest.headers.Authorization = `Bearer ${auth.getAccessToken()}`;
                                
                                return this.client(originalRequest);
                            } catch (refreshError) {
                                // Échec du rafraîchissement du jeton, déconnecter l'utilisateur
                                auth.logout();
                                
                                // Afficher un message d'erreur
                                showError('Votre session a expiré. Veuillez vous reconnecter.');
                                
                                // Rediriger vers la page de connexion
                                window.location.href = '/login';
                                
                                return Promise.reject({
                                    error: 'AUTH_REFRESH_FAILED',
                                    message: 'Échec du rafraîchissement du jeton d\'accès',
                                    originalError: refreshError
                                });
                            }
                        } else {
                            // Afficher un message d'erreur
                            showError('Veuillez vous connecter pour accéder à cette ressource');
                            
                            // Rediriger vers la page de connexion
                            window.location.href = '/login';
                        }
                        break;
                        
                    case 403: // Forbidden
                        // Émettre un événement d'erreur d'autorisation
                        eventBus.emit(Events.FORBIDDEN, {
                            status,
                            message: data?.message || 'Accès refusé',
                            requestId,
                            url,
                            method
                        });
                        
                        // Afficher un message d'erreur
                        showError('Vous n\'avez pas les droits nécessaires pour effectuer cette action');
                        break;
                        
                    case 404: // Not Found
                        // Émettre un événement de ressource non trouvée
                        eventBus.emit(Events.RESOURCE_NOT_FOUND, {
                            status,
                            message: data?.message || 'Ressource non trouvée',
                            requestId,
                            url,
                            method
                        });
                        
                        // Afficher un message d'erreur
                        showError('La ressource demandée est introuvable');
                        break;
                        
                    case 422: // Unprocessable Entity
                        // Émettre un événement d'erreur de validation
                        eventBus.emit(Events.API_VALIDATION_ERROR, {
                            status,
                            errors: data?.errors || {},
                            message: data?.message || 'Erreur de validation',
                            requestId,
                            url,
                            method
                        });
                        
                        // Afficher les erreurs de validation si disponibles
                        if (data?.errors) {
                            const errorMessages = Object.values(data.errors)
                                .flat()
                                .filter(Boolean);
                                
                            if (errorMessages.length > 0) {
                                showError(errorMessages.join('\n'), { timeout: 10000 });
                            } else {
                                showError(data.message || 'Une erreur de validation est survenue');
                            }
                        } else {
                            showError(data?.message || 'Une erreur de validation est survenue');
                        }
                        break;
                        
                    case 429: // Too Many Requests
                        // Émettre un événement de limitation de débit
                        eventBus.emit(Events.RATE_LIMIT_EXCEEDED, {
                            status,
                            message: data?.message || 'Trop de requêtes',
                            retryAfter: error.response.headers['retry-after'],
                            requestId,
                            url,
                            method
                        });
                        
                        // Afficher un message d'erreur
                        showError('Trop de requêtes. Veuillez patienter avant de réessayer.');
                        break;
                        
                    case 500: // Internal Server Error
                        // Émettre un événement d'erreur serveur
                        eventBus.emit(Events.SERVER_ERROR, {
                            status,
                            message: data?.message || 'Erreur interne du serveur',
                            requestId,
                            url,
                            method
                        });
                        
                        // Afficher un message d'erreur
                        showError('Une erreur est survenue sur le serveur. Veuillez réessayer plus tard.');
                        break;
                        
                    case 503: // Service Unavailable
                        // Émettre un événement de service indisponible
                        eventBus.emit(Events.SERVICE_UNAVAILABLE, {
                            status,
                            message: data?.message || 'Service indisponible',
                            retryAfter: error.response.headers['retry-after'],
                            requestId,
                            url,
                            method
                        });
                        
                        // Afficher un message d'erreur
                        showError('Le service est temporairement indisponible. Veuillez réessayer plus tard.');
                        break;
                        
                    default:
                        // Pour toutes les autres erreurs
                        eventBus.emit(Events.API_REQUEST_ERROR, {
                            status,
                            message: data?.message || 'Une erreur est survenue',
                            requestId,
                            url,
                            method,
                            originalError: error
                        });
                        
                        // Afficher un message d'erreur générique
                        showError(data?.message || 'Une erreur est survenue');
                }
                
                return Promise.reject({
                    status,
                    ...data,
                    originalError: error
                });
            }
        );
    }
    
    /**
     * Génère un identifiant unique pour les requêtes
     * @returns {string} - Identifiant unique
     * @private
     */
    _generateRequestId() {
        return 'req_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Effectue une requête GET
     * @param {string} url - URL de la ressource
     * @param {Object} [config] - Configuration de la requête
     * @returns {Promise<Object>} - Réponse de l'API
     */
    async get(url, config = {}) {
        try {
            const response = await this.client.get(url, config);
            return response.data;
        } catch (error) {
            // Si l'erreur a déjà été traitée par l'intercepteur, la renvoyer telle quelle
            if (error.status) {
                throw error;
            }
            throw this._handleError(error);
        }
    }
    
    /**
     * Effectue une requête POST
     * @param {string} url - URL de la ressource
     * @param {Object} [data] - Données à envoyer
     * @param {Object} [config] - Configuration de la requête
     * @returns {Promise<Object>} - Réponse de l'API
     */
    async post(url, data = {}, config = {}) {
        try {
            const response = await this.client.post(url, data, config);
            return response.data;
        } catch (error) {
            if (error.status) {
                throw error;
            }
            throw this._handleError(error);
        }
    }
    
    /**
     * Effectue une requête PUT
     * @param {string} url - URL de la ressource
     * @param {Object} [data] - Données à envoyer
     * @param {Object} [config] - Configuration de la requête
     * @returns {Promise<Object>} - Réponse de l'API
     */
    async put(url, data = {}, config = {}) {
        try {
            const response = await this.client.put(url, data, config);
            return response.data;
        } catch (error) {
            if (error.status) {
                throw error;
            }
            throw this._handleError(error);
        }
    }
    
    /**
     * Effectue une requête PATCH
     * @param {string} url - URL de la ressource
     * @param {Object} [data] - Données à envoyer
     * @param {Object} [config] - Configuration de la requête
     * @returns {Promise<Object>} - Réponse de l'API
     */
    async patch(url, data = {}, config = {}) {
        try {
            const response = await this.client.patch(url, data, config);
            return response.data;
        } catch (error) {
            if (error.status) {
                throw error;
            }
            throw this._handleError(error);
        }
    }
    
    /**
     * Effectue une requête DELETE
     * @param {string} url - URL de la ressource
     * @param {Object} [config] - Configuration de la requête
     * @returns {Promise<Object>} - Réponse de l'API
     */
    async delete(url, config = {}) {
        try {
            const response = await this.client.delete(url, config);
            return response.data;
        } catch (error) {
            if (error.status) {
                throw error;
            }
            throw this._handleError(error);
        }
    }
    
    /**
     * Télécharge un fichier
     * @param {string} url - URL de la ressource
     * @param {Object} [config] - Configuration de la requête
     * @returns {Promise<Blob>} - Fichier téléchargé
     */
    async download(url, config = {}) {
        try {
            const response = await this.client.get(url, {
                ...config,
                responseType: 'blob'
            });
            
            // Extraire le nom du fichier à partir des en-têtes de réponse
            const contentDisposition = response.headers['content-disposition'];
            let filename = 'download';
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch != null && filenameMatch[1]) { 
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }
            
            // Créer un objet URL pour le téléchargement
            const blob = new Blob([response.data]);
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            
            // Nettoyer
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(downloadUrl);
            }, 100);
            
            return blob;
        } catch (error) {
            if (error.status) {
                throw error;
            }
            throw this._handleError(error);
        }
    }
    
    /**
     * Téléverse un fichier
     * @param {string} url - URL de la ressource
     * @param {File} file - Fichier à téléverser
     * @param {string} fieldName - Nom du champ de fichier (par défaut: 'file')
     * @param {Object} [data] - Données supplémentaires à envoyer
     * @param {Object} [config] - Configuration de la requête
     * @param {Function} [onUploadProgress] - Fonction de rappel pour suivre la progression
     * @returns {Promise<Object>} - Réponse de l'API
     */
    async upload(url, file, fieldName = 'file', data = {}, config = {}, onUploadProgress) {
        // Créer un objet FormData
        const formData = new FormData();
        
        // Ajouter le fichier
        formData.append(fieldName, file);
        
        // Ajouter les données supplémentaires
        Object.entries(data).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                formData.append(key, value);
            }
        });
        
        // Configurer la requête
        const requestConfig = {
            ...config,
            headers: {
                'Content-Type': 'multipart/form-data',
                ...config.headers
            },
            onUploadProgress: (progressEvent) => {
                if (onUploadProgress && typeof onUploadProgress === 'function') {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onUploadProgress(percentCompleted, progressEvent);
                }
            }
        };
        
        // Effectuer la requête
        try {
            const response = await this.client.post(url, formData, requestConfig);
            return response.data;
        } catch (error) {
            if (error.status) {
                throw error;
            }
            throw this._handleError(error);
        }
    }
    
    /**
     * Gère les erreurs d'API
     * @param {Error} error - Erreur à traiter
     * @returns {Object} - Erreur formatée
     * @private
     */
    _handleError(error) {
        // Si la réponse contient des données d'erreur, les renvoyer
        if (error.response && error.response.data) {
            return {
                status: error.response.status,
                ...error.response.data,
                originalError: error
            };
        }
        
        // Si la requête a été annulée
        if (axios.isCancel(error)) {
            return {
                error: 'REQUEST_CANCELLED',
                message: 'La requête a été annulée',
                originalError: error
            };
        }
        
        // Pour les erreurs réseau
        if (error.request) {
            return {
                error: 'NETWORK_ERROR',
                message: 'Erreur de connexion au serveur',
                originalError: error
            };
        }
        
        // Pour les autres erreurs
        return {
            error: 'UNKNOWN_ERROR',
            message: 'Une erreur inconnue est survenue',
            originalError: error
        };
    }
    
    /**
     * Annule une requête en cours
     * @param {string} requestId - Identifiant de la requête à annuler
     */
    cancelRequest(requestId) {
        // Implémentation de l'annulation des requêtes
        // Note: Nécessite d'utiliser un token d'annulation Axios
        // Voir: https://github.com/axios/axios#cancellation
    }
    
    /**
     * Définit le jeton d'authentification
     * @param {string} token - Jeton d'authentification
     */
    setAuthToken(token) {
        if (token) {
            this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete this.client.defaults.headers.common['Authorization'];
        }
    }
    
    /**
     * Supprime le jeton d'authentification
     */
    removeAuthToken() {
        delete this.client.defaults.headers.common['Authorization'];
    }
}

// Créer une instance globale
const apiClient = new ApiClient({
    baseURL: process.env.API_BASE_URL || '/api',
    timeout: 30000 // 30 secondes
});

// Exposer l'instance globale
window.EquipTrack = window.EquipTrack || {};
window.EquipTrack.api = apiClient;

// Exporter l'instance par défaut et la classe
export { apiClient as default, ApiClient };
