/**
 * EquipTrack - Gestion des événements personnalisés
 * Fournit un système de publication/abonnement pour la communication entre composants
 */

class EventBus {
    constructor() {
        this.events = new Map();
        this.wildcards = new Set();
    }
    
    /**
     * Vérifie si un événement existe
     * @param {string} eventName - Nom de l'événement
     * @returns {boolean} True si l'événement existe
     */
    has(eventName) {
        return this.events.has(eventName) || this.wildcards.size > 0;
    }
    
    /**
     * Enregistre un écouteur d'événement
     * @param {string} eventName - Nom de l'événement (peut contenir des wildcards comme 'user.*')
     * @param {Function} callback - Fonction à appeler lorsque l'événement est déclenché
     * @param {Object} [options] - Options supplémentaires
     * @param {boolean} [options.once=false] - Si true, l'écouteur ne sera déclenché qu'une seule fois
     * @param {*} [options.context] - Contexte (this) pour le callback
     * @returns {Function} Fonction pour supprimer cet écouteur
     */
    on(eventName, callback, options = {}) {
        if (typeof callback !== 'function') {
            throw new Error('Le callback doit être une fonction');
        }
        
        const { once = false, context = null } = options;
        const listener = { callback, once, context };
        
        // Vérifier s'il s'agit d'un événement avec wildcard
        if (eventName.includes('*')) {
            listener.pattern = this._createWildcardPattern(eventName);
            this.wildcards.add(listener);
            
            // Retourner une fonction pour supprimer cet écouteur
            return () => this.off(eventName, callback);
        }
        
        // Pour les événements normaux
        if (!this.events.has(eventName)) {
            this.events.set(eventName, new Set());
        }
        
        this.events.get(eventName).add(listener);
        
        // Retourner une fonction pour supprimer cet écouteur
        return () => this.off(eventName, callback);
    }
    
    /**
     * Enregistre un écouteur d'événement qui ne se déclenchera qu'une seule fois
     * @param {string} eventName - Nom de l'événement
     * @param {Function} callback - Fonction à appeler
     * @param {Object} [context] - Contexte (this) pour le callback
     * @returns {Function} Fonction pour supprimer cet écouteur
     */
    once(eventName, callback, context = null) {
        return this.on(eventName, callback, { once: true, context });
    }
    
    /**
     * Supprime un ou plusieurs écouteurs d'événement
     * @param {string} [eventName] - Nom de l'événement (optionnel, si non fourni, tous les écouteurs sont supprimés)
     * @param {Function} [callback] - Fonction de callback à supprimer (optionnel)
     */
    off(eventName, callback) {
        // Supprimer tous les écouteurs si aucun argument n'est fourni
        if (eventName === undefined) {
            this.events.clear();
            this.wildcards.clear();
            return;
        }
        
        // Supprimer tous les écouteurs pour un événement spécifique
        if (callback === undefined) {
            // Supprimer les écouteurs normaux
            if (this.events.has(eventName)) {
                this.events.get(eventName).clear();
                this.events.delete(eventName);
            }
            
            // Supprimer les écouteurs avec wildcard qui correspondent exactement à ce nom
            for (const listener of this.wildcards) {
                if (listener.pattern.source === this._createWildcardPattern(eventName).source) {
                    this.wildcards.delete(listener);
                }
            }
            
            return;
        }
        
        // Supprimer un écouteur spécifique pour un événement spécifique
        if (this.events.has(eventName)) {
            for (const listener of this.events.get(eventName)) {
                if (listener.callback === callback) {
                    this.events.get(eventName).delete(listener);
                }
            }
            
            // Supprimer l'ensemble s'il est vide
            if (this.events.get(eventName).size === 0) {
                this.events.delete(eventName);
            }
        }
        
        // Supprimer les écouteurs avec wildcard
        for (const listener of this.wildcards) {
            if (listener.callback === callback) {
                this.wildcards.delete(listener);
            }
        }
    }
    
    /**
     * Déclenche un événement
     * @param {string} eventName - Nom de l'événement
     * @param {...*} args - Arguments à passer aux écouteurs
     * @returns {Array} Tableau des valeurs de retour des écouteurs
     */
    emit(eventName, ...args) {
        const results = [];
        const listenersToRemove = [];
        
        // Traiter les écouteurs normaux
        if (this.events.has(eventName)) {
            for (const listener of this.events.get(eventName)) {
                try {
                    const result = listener.callback.apply(listener.context || this, args);
                    results.push(result);
                    
                    // Marquer pour suppression si c'est un écouteur unique
                    if (listener.once) {
                        listenersToRemove.push({ eventName, listener });
                    }
                } catch (error) {
                    console.error(`Erreur dans l'écouteur pour l'événement '${eventName}':`, error);
                }
            }
            
            // Supprimer les écouteurs marqués pour suppression
            for (const { eventName: evt, listener } of listenersToRemove) {
                if (this.events.has(evt)) {
                    this.events.get(evt).delete(listener);
                }
            }
            
            // Nettoyer les ensembles vides
            if (this.events.has(eventName) && this.events.get(eventName).size === 0) {
                this.events.delete(eventName);
            }
        }
        
        // Traiter les écouteurs avec wildcard
        for (const listener of this.wildcards) {
            if (listener.pattern.test(eventName)) {
                try {
                    const result = listener.callback.apply(listener.context || this, [eventName, ...args]);
                    results.push(result);
                    
                    // Supprimer si c'est un écouteur unique
                    if (listener.once) {
                        this.wildcards.delete(listener);
                    }
                } catch (error) {
                    console.error(`Erreur dans l'écouteur avec wildcard pour l'événement '${eventName}':`, error);
                }
            }
        }
        
        return results;
    }
    
    /**
     * Crée un motif de recherche pour les événements avec wildcard
     * @private
     */
    _createWildcardPattern(eventName) {
        // Échapper les caractères spéciaux des expressions régulières
        const escaped = eventName.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
        // Remplacer les astérisques par .* pour la correspondance
        const pattern = `^${escaped.replace(/\*/g, '.*')}$`;
        return new RegExp(pattern);
    }
    
    /**
     * Retourne le nombre d'écouteurs pour un événement donné
     * @param {string} [eventName] - Nom de l'événement (optionnel)
     * @returns {number} Nombre d'écouteurs
     */
    listenerCount(eventName) {
        if (eventName === undefined) {
            // Compter tous les écouteurs
            let count = 0;
            for (const listeners of this.events.values()) {
                count += listeners.size;
            }
            return count + this.wildcards.size;
        }
        
        // Compter les écouteurs pour un événement spécifique
        let count = 0;
        
        // Écouteurs directs
        if (this.events.has(eventName)) {
            count += this.events.get(eventName).size;
        }
        
        // Écouteurs avec wildcard qui correspondent à cet événement
        for (const listener of this.wildcards) {
            if (listener.pattern.test(eventName)) {
                count++;
            }
        }
        
        return count;
    }
    
    /**
     * Supprime tous les écouteurs
     */
    removeAllListeners() {
        this.events.clear();
        this.wildcards.clear();
    }
    
    /**
     * Retourne la liste des noms d'événements enregistrés
     * @returns {string[]} Tableau des noms d'événements
     */
    eventNames() {
        const names = [...this.events.keys()];
        
        // Ajouter les modèles de wildcards uniques
        const wildcardPatterns = new Set();
        for (const listener of this.wildcards) {
            wildcardPatterns.add(listener.pattern.source);
        }
        
        for (const pattern of wildcardPatterns) {
            // Convertir le modèle d'expression régulière en chaîne d'événement
            let eventName = pattern
                .replace(/^\^/, '')      // Supprimer le ^ de début
                .replace(/\$$/, '')       // Supprimer le $ de fin
                .replace(/\\./g, match => match[1])  // Déséchapper les caractères échappés
                .replace(/\\./g, match => match[1])  // Deuxième passe pour les séquences comme \\*
                .replace(/\\./g, match => match[1])  // Troisième passe pour être sûr
                .replace(/\.\*\?/g, '*')  // Remplacer .*? par *
                .replace(/\.\*/g, '*')    // Remplacer .* par *
                .replace(/\./g, match => match[1] || '.');  // Déséchapper les autres caractères
                
            names.push(eventName);
        }
        
        return names;
    }
}

// Créer une instance par défaut
const eventBus = new EventBus();

// Méthodes globales pour un accès facile
const on = (eventName, callback, options) => eventBus.on(eventName, callback, options);
const once = (eventName, callback, context) => eventBus.once(eventName, callback, context);
const off = (eventName, callback) => eventBus.off(eventName, callback);
const emit = (eventName, ...args) => eventBus.emit(eventName, ...args);
const listenerCount = (eventName) => eventBus.listenerCount(eventName);
const removeAllListeners = () => eventBus.removeAllListeners();
const eventNames = () => eventBus.eventNames();

// Événements prédéfinis
const Events = {
    // Événements d'équipement
    EQUIPMENT_ADDED: 'equipment:added',
    EQUIPMENT_UPDATED: 'equipment:updated',
    EQUIPMENT_DELETED: 'equipment:deleted',
    EQUIPMENT_STATUS_CHANGED: 'equipment:status:changed',
    
    // Événements d'utilisation
    USAGE_RECORDED: 'usage:recorded',
    USAGE_DELETED: 'usage:deleted',
    
    // Événements d'interface utilisateur
    MODAL_OPENED: 'modal:opened',
    MODAL_CLOSED: 'modal:closed',
    NOTIFICATION_SHOWN: 'notification:shown',
    NOTIFICATION_CLOSED: 'notification:closed',
    
    // Événements d'authentification
    USER_LOGGED_IN: 'user:logged_in',
    USER_LOGGED_OUT: 'user:logged_out',
    SESSION_EXPIRED: 'session:expired',
    
    // Événements de navigation
    ROUTE_CHANGED: 'route:changed',
    
    // Événements de formulaire
    FORM_VALIDATION_ERROR: 'form:validation:error',
    FORM_SUBMITTED: 'form:submitted',
    FORM_RESET: 'form:reset',
    
    // Événements de recherche
    SEARCH_PERFORMED: 'search:performed',
    SEARCH_CLEARED: 'search:cleared',
    
    // Événements généraux
    LOADING_STARTED: 'loading:started',
    LOADING_FINISHED: 'loading:finished',
    ERROR_OCCURRED: 'error:occurred'
};

// Exposer l'instance globale
window.EquipTrack = window.EquipTrack || {};
window.EquipTrack.events = eventBus;
window.EquipTrack.Events = Events;

// Méthodes globales pour un accès facile
window.onEvent = on;
window.onceEvent = once;
window.offEvent = off;
window.emitEvent = emit;

// Exporter l'instance par défaut, les méthodes et les constantes
export {
    eventBus as default,
    EventBus,
    on,
    once,
    off,
    emit,
    listenerCount,
    removeAllListeners,
    eventNames,
    Events
};
