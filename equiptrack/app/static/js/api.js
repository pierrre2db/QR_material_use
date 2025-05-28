/**
 * EquipTrack - Gestion des appels API
 * Fournit des méthodes pour communiquer avec l'API du serveur
 */

class ApiClient {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };
        
        // Intercepteur de requêtes
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        
        // Configuration par défaut
        this.config = {
            withCredentials: true,
            timeout: 30000, // 30 secondes
            maxRetries: 1,
            retryDelay: 1000 // 1 seconde
        };
    }
    
    /**
     * Configure le client API
     * @param {Object} config - Configuration à fusionner avec la configuration actuelle
     */
    configure(config) {
        this.config = { ...this.config, ...config };
        return this;
    }
    
    /**
     * Définit un en-tête par défaut
     * @param {string} key - Clé de l'en-tête
     * @param {string} value - Valeur de l'en-tête
     */
    setHeader(key, value) {
        this.defaultHeaders[key] = value;
        return this;
    }
    
    /**
     * Supprime un en-tête par défaut
     * @param {string} key - Clé de l'en-tête à supprimer
     */
    removeHeader(key) {
        delete this.defaultHeaders[key];
        return this;
    }
    
    /**
     * Ajoute un intercepteur de requête
     * @param {Function} onFulfilled - Fonction à exécuter avant l'envoi de la requête
     * @param {Function} onRejected - Fonction à exécuter en cas d'erreur
     * @returns {number} ID de l'intercepteur (pour le supprimer plus tard)
     */
    addRequestInterceptor(onFulfilled, onRejected) {
        const id = this.requestInterceptors.length;
        this.requestInterceptors.push({ onFulfilled, onRejected, id });
        return id;
    }
    
    /**
     * Ajoute un intercepteur de réponse
     * @param {Function} onFulfilled - Fonction à exécuter pour une réponse réussie
     * @param {Function} onRejected - Fonction à exécuter pour une réponse en erreur
     * @returns {number} ID de l'intercepteur (pour le supprimer plus tard)
     */
    addResponseInterceptor(onFulfilled, onRejected) {
        const id = this.responseInterceptors.length;
        this.responseInterceptors.push({ onFulfilled, onRejected, id });
        return id;
    }
    
    /**
     * Supprime un intercepteur de requête
     * @param {number} id - ID de l'intercepteur à supprimer
     */
    removeRequestInterceptor(id) {
        this.requestInterceptors = this.requestInterceptors.filter(i => i.id !== id);
    }
    
    /**
     * Supprime un intercepteur de réponse
     * @param {number} id - ID de l'intercepteur à supprimer
     */
    removeResponseInterceptor(id) {
        this.responseInterceptors = this.responseInterceptors.filter(i => i.id !== id);
    }
    
    /**
     * Effectue une requête HTTP
     * @param {string} method - Méthode HTTP (GET, POST, etc.)
     * @param {string} url - URL de la requête
     * @param {Object} [data] - Données à envoyer dans le corps de la requête
     * @param {Object} [options] - Options supplémentaires pour la requête
     * @returns {Promise} Promesse résolue avec la réponse
     */
    async request(method, url, data = null, options = {}) {
        // Options par défaut
        const {
            headers = {},
            params = {},
            responseType = 'json',
            timeout = this.config.timeout,
            withCredentials = this.config.withCredentials,
            maxRetries = this.config.maxRetries,
            retryDelay = this.config.retryDelay,
            onUploadProgress = null,
            onDownloadProgress = null,
            signal = null
        } = options;
        
        // Construire l'URL complète avec les paramètres de requête
        let fullUrl = this.baseUrl + url;
        const queryString = this.serializeParams(params);
        if (queryString) {
            fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
        }
        
        // Fusionner les en-têtes par défaut avec les en-têtes personnalisés
        const mergedHeaders = { ...this.defaultHeaders, ...headers };
        
        // Configuration de la requête
        const requestConfig = {
            method: method.toUpperCase(),
            headers: mergedHeaders,
            credentials: withCredentials ? 'include' : 'same-origin',
            signal
        };
        
        // Ajouter le corps de la requête pour les méthodes POST, PUT, PATCH, etc.
        if (data && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
            if (data instanceof FormData || data instanceof URLSearchParams) {
                // Ne pas définir Content-Type pour FormData, le navigateur le fera automatiquement
                // avec la bonne limite de frontière
                delete requestConfig.headers['Content-Type'];
                requestConfig.body = data;
            } else if (typeof data === 'object') {
                requestConfig.body = JSON.stringify(data);
            } else {
                requestConfig.body = data;
            }
        }
        
        // Gestion du timeout
        let timeoutId;
        if (timeout > 0) {
            const controller = new AbortController();
            timeoutId = setTimeout(() => controller.abort(), timeout);
            requestConfig.signal = controller.signal;
            
            // Si un signal a été fourni, écouter son annulation
            if (signal) {
                signal.addEventListener('abort', () => {
                    controller.abort();
                    if (timeoutId) clearTimeout(timeoutId);
                });
            }
        }
        
        // Exécuter les intercepteurs de requête
        let request = { ...requestConfig, url: fullUrl };
        for (const interceptor of this.requestInterceptors) {
            try {
                request = await interceptor.onFulfilled(request) || request;
            } catch (error) {
                if (interceptor.onRejected) {
                    return await interceptor.onRejected(error);
                }
                throw error;
            }
        }
        
        // Fonction pour effectuer la requête avec réessai
        const fetchWithRetry = async (attempt = 0) => {
            try {
                // Effectuer la requête
                const response = await fetch(request.url, request);
                
                // Vérifier si la réponse est une redirection
                if (response.redirected) {
                    window.location.href = response.url;
                    return { data: null, status: response.status, headers: response.headers };
                }
                
                // Traiter la réponse
                let responseData;
                if (responseType === 'blob') {
                    responseData = await response.blob();
                } else if (responseType === 'arraybuffer') {
                    responseData = await response.arrayBuffer();
                } else if (responseType === 'text') {
                    responseData = await response.text();
                } else {
                    try {
                        responseData = await response.json();
                    } catch (e) {
                        // Si le JSON est invalide, retourner le texte brut
                        responseData = await response.text();
                    }
                }
                
                // Créer l'objet de réponse
                const apiResponse = {
                    data: responseData,
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers,
                    config: request,
                    request: {}
                };
                
                // Vérifier si la réponse est une erreur (statut HTTP 4xx ou 5xx)
                if (!response.ok) {
                    const error = new Error(`Request failed with status code ${response.status}`);
                    error.response = apiResponse;
                    error.request = request;
                    error.config = request;
                    throw error;
                }
                
                // Exécuter les intercepteurs de réponse
                let processedResponse = apiResponse;
                for (const interceptor of this.responseInterceptors) {
                    try {
                        processedResponse = await interceptor.onFulfilled(processedResponse) || processedResponse;
                    } catch (error) {
                        if (interceptor.onRejected) {
                            return await interceptor.onRejected(error);
                        }
                        throw error;
                    }
                }
                
                return processedResponse;
                
            } catch (error) {
                // Annulation de la requête
                if (error.name === 'AbortError') {
                    throw new Error(`Timeout of ${timeout}ms exceeded`);
                }
                
                // Réessayer en cas d'échec
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
                    return fetchWithRetry(attempt + 1);
                }
                
                throw error;
            } finally {
                if (timeoutId) clearTimeout(timeoutId);
            }
        };
        
        return fetchWithRetry();
    }
    
    /**
     * Effectue une requête GET
     * @param {string} url - URL de la requête
     * @param {Object} [params] - Paramètres de requête
     * @param {Object} [options] - Options supplémentaires pour la requête
     * @returns {Promise} Promesse résolue avec la réponse
     */
    get(url, params = {}, options = {}) {
        return this.request('GET', url, null, { ...options, params });
    }
    
    /**
     * Effectue une requête POST
     * @param {string} url - URL de la requête
     * @param {Object} [data] - Données à envoyer dans le corps de la requête
     * @param {Object} [options] - Options supplémentaires pour la requête
     * @returns {Promise} Promesse résolue avec la réponse
     */
    post(url, data = {}, options = {}) {
        return this.request('POST', url, data, options);
    }
    
    /**
     * Effectue une requête PUT
     * @param {string} url - URL de la requête
     * @param {Object} [data] - Données à envoyer dans le corps de la requête
     * @param {Object} [options] - Options supplémentaires pour la requête
     * @returns {Promise} Promesse résolue avec la réponse
     */
    put(url, data = {}, options = {}) {
        return this.request('PUT', url, data, options);
    }
    
    /**
     * Effectue une requête PATCH
     * @param {string} url - URL de la requête
     * @param {Object} [data] - Données à envoyer dans le corps de la requête
     * @param {Object} [options] - Options supplémentaires pour la requête
     * @returns {Promise} Promesse résolue avec la réponse
     */
    patch(url, data = {}, options = {}) {
        return this.request('PATCH', url, data, options);
    }
    
    /**
     * Effectue une requête DELETE
     * @param {string} url - URL de la requête
     * @param {Object} [data] - Données à envoyer dans le corps de la requête
     * @param {Object} [options] - Options supplémentaires pour la requête
     * @returns {Promise} Promesse résolue avec la réponse
     */
    delete(url, data = null, options = {}) {
        return this.request('DELETE', url, data, options);
    }
    
    /**
     * Télécharge un fichier
     * @param {string} url - URL du fichier à télécharger
     * @param {string} filename - Nom du fichier de destination
     * @param {Object} [options] - Options supplémentaires pour la requête
     * @returns {Promise} Promesse résolue lorsque le téléchargement est terminé
     */
    async download(url, filename, options = {}) {
        const response = await this.get(url, {}, { ...options, responseType: 'blob' });
        
        // Créer un lien de téléchargement
        const blob = new Blob([response.data], { type: response.headers.get('content-type') });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Nettoyer
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
        
        return response;
    }
    
    /**
     * Téléverse un fichier
     * @param {string} url - URL de l'endpoint d'upload
     * @ {File|Blob} file - Fichier à téléverser
     * @param {string} fieldName - Nom du champ de fichier (par défaut: 'file')
     * @param {Object} [data] - Données supplémentaires à envoyer avec le fichier
     * @param {Object} [options] - Options supplémentaires pour la requête
     * @param {Function} [onProgress] - Fonction de rappel pour suivre la progression
     * @returns {Promise} Promesse résolue avec la réponse
     */
    upload(url, file, fieldName = 'file', data = {}, options = {}, onProgress = null) {
        const formData = new FormData();
        
        // Ajouter le fichier
        formData.append(fieldName, file);
        
        // Ajouter les données supplémentaires
        Object.entries(data).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                if (value instanceof File || value instanceof Blob) {
                    formData.append(key, value);
                } else if (typeof value === 'object') {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, value);
                }
            }
        });
        
        // Configurer le suivi de la progression si disponible
        let xhr;
        if (onProgress && typeof XMLHttpRequest !== 'undefined') {
            xhr = new XMLHttpRequest();
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded * 100) / event.total);
                    onProgress(percent, event);
                }
            });
            
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    onProgress(100);
                }
            });
            
            options.xhr = () => xhr;
        }
        
        // Effectuer la requête
        return this.post(url, formData, {
            ...options,
            headers: {
                ...options.headers,
                'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: onProgress
        });
    }
    
    /**
     * Série les paramètres d'URL
     * @private
     */
    serializeParams(params) {
        if (!params || typeof params !== 'object') {
            return '';
        }
        
        const parts = [];
        
        const process = (key, value) => {
            if (value === null || value === undefined) {
                return;
            }
            
            if (Array.isArray(value)) {
                value.forEach((v, i) => {
                    if (v !== null && v !== undefined) {
                        if (typeof v === 'object') {
                            process(`${key}[${i}]`, v);
                        } else {
                            parts.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(v)}`);
                        }
                    }
                });
            } else if (typeof value === 'object') {
                Object.keys(value).forEach(k => {
                    if (value[k] !== null && value[k] !== undefined) {
                        process(`${key}[${k}]`, value[k]);
                    }
                });
            } else {
                parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
            }
        };
        
        Object.keys(params).forEach(key => {
            process(key, params[key]);
        });
        
        return parts.join('&');
    }
}

// Créer une instance par défaut
const api = new ApiClient('/api');

// Ajouter un intercepteur pour gérer les erreurs globales
api.addResponseInterceptor(
    response => response,
    error => {
        if (error.response) {
            // La requête a été effectuée et le serveur a répondu avec un statut hors 2xx
            const { status, data } = error.response;
            
            let message = 'Une erreur est survenue';
            
            if (status === 401) {
                // Non authentifié
                message = 'Vous devez être connecté pour effectuer cette action';
                // Rediriger vers la page de connexion
                window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            } else if (status === 403) {
                // Non autorisé
                message = 'Vous n\'êtes pas autorisé à effectuer cette action';
            } else if (status === 404) {
                // Ressource non trouvée
                message = 'La ressource demandée est introuvable';
            } else if (status === 422) {
                // Erreur de validation
                message = 'Veuillez vérifier les champs du formulaire';
                return Promise.reject({
                    ...error,
                    message,
                    validationErrors: data.errors || {}
                });
            } else if (status >= 500) {
                // Erreur serveur
                message = 'Une erreur est survenue sur le serveur. Veuillez réessayer plus tard.';
            }
            
            return Promise.reject({
                ...error,
                message: data.message || message
            });
        } else if (error.request) {
            // La requête a été effectuée mais aucune réponse n'a été reçue
            return Promise.reject({
                ...error,
                message: 'Impossible de se connecter au serveur. Vérifiez votre connexion Internet.'
            });
        } else {
            // Une erreur s'est produite lors de la configuration de la requête
            return Promise.reject({
                ...error,
                message: error.message || 'Une erreur est survenue lors de la configuration de la requête.'
            });
        }
    }
);

// Exporter l'instance par défaut et la classe
window.EquipTrack = window.EquipTrack || {};
window.EquipTrack.api = api;
window.EquipTrack.ApiClient = ApiClient;

export { api as default, ApiClient };
