/**
 * EquipTrack - Gestion des raccourcis clavier
 * Fournit des fonctions pour gérer les raccourcis clavier et les événements de clavier
 */

import { eventBus, Events } from './events';

/**
 * Classe pour gérer les raccourcis clavier
 */
class KeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.enabled = true;
        this.modifiers = {
            ctrl: false,
            shift: false,
            alt: false,
            meta: false
        };
        
        // Écouter les événements de clavier
        this._initEventListeners();
    }
    
    /**
     * Initialise les écouteurs d'événements
     * @private
     */
    _initEventListeners() {
        // Écouter les événements de touche enfoncée
        document.addEventListener('keydown', (e) => this._handleKeyDown(e));
        
        // Écouter les événements de touche relâchée
        document.addEventListener('keyup', (e) => this._handleKeyUp(e));
        
        // Écouter les événements de perte de focus
        window.addEventListener('blur', () => this._resetModifiers());
    }
    
    /**
     * Gère l'événement de touche enfoncée
     * @param {KeyboardEvent} e - Événement de clavier
     * @private
     */
    _handleKeyDown(e) {
        // Mettre à jour l'état des touches de modification
        this._updateModifiers(e);
        
        // Si les raccourcis sont désactivés ou si l'événement provient d'un champ de formulaire, ignorer
        if (!this.enabled || this._isFormElement(e.target)) {
            return;
        }
        
        // Construire l'identifiant du raccourci
        const shortcutId = this._getShortcutId(e);
        
        // Vérifier si un raccourci correspond
        if (this.shortcuts.has(shortcutId)) {
            const action = this.shortcuts.get(shortcutId);
            
            // Empêcher le comportement par défaut
            e.preventDefault();
            e.stopPropagation();
            
            // Exécuter l'action du raccourci
            if (typeof action === 'function') {
                action(e);
            } else if (typeof action === 'string') {
                // Si c'est une chaîne, émettre un événement
                eventBus.emit(action, { event: e });
            }
        }
    }
    
    /**
     * Gère l'événement de touche relâchée
     * @param {KeyboardEvent} e - Événement de clavier
     * @private
     */
    _handleKeyUp(e) {
        // Mettre à jour l'état des touches de modification
        this._updateModifiers(e);
    }
    
    /**
     * Met à jour l'état des touches de modification
     * @param {KeyboardEvent} e - Événement de clavier
     * @private
     */
    _updateModifiers(e) {
        this.modifiers.ctrl = e.ctrlKey;
        this.modifiers.shift = e.shiftKey;
        this.modifiers.alt = e.altKey;
        this.modifiers.meta = e.metaKey;
    }
    
    /**
     * Réinitialise l'état des touches de modification
     * @private
     */
    _resetModifiers() {
        this.modifiers.ctrl = false;
        this.modifiers.shift = false;
        this.modifiers.alt = false;
        this.modifiers.meta = false;
    }
    
    /**
     * Vérifie si l'élément cible est un champ de formulaire
     * @param {HTMLElement} target - Élément cible
     * @returns {boolean} - True si c'est un champ de formulaire, false sinon
     * @private
     */
    _isFormElement(target) {
        const formElements = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'];
        return formElements.includes(target.tagName) || target.isContentEditable;
    }
    
    /**
     * Génère un identifiant unique pour un raccourci
     * @param {KeyboardEvent} e - Événement de clavier
     * @returns {string} - Identifiant du raccourci
     * @private
     */
    _getShortcutId(e) {
        const parts = [];
        
        // Ajouter les touches de modification
        if (e.ctrlKey || e.metaKey) parts.push('ctrl');
        if (e.shiftKey) parts.push('shift');
        if (e.altKey) parts.push('alt');
        
        // Ajouter la touche principale (en minuscule pour éviter les problèmes de casse)
        const key = e.key.toLowerCase();
        
        // Gérer les touches spéciales
        switch (key) {
            case ' ':
                parts.push('space');
                break;
            case 'escape':
                parts.push('esc');
                break;
            case 'arrowup':
                parts.push('up');
                break;
            case 'arrowdown':
                parts.push('down');
                break;
            case 'arrowleft':
                parts.push('left');
                break;
            case 'arrowright':
                parts.push('right');
                break;
            default:
                // Pour les touches de fonction (F1, F2, etc.)
                if (key.startsWith('f') && key.length > 1 && !isNaN(key.substring(1))) {
                    parts.push(key);
                } else if (key.length === 1) {
                    // Pour les caractères alphanumériques
                    parts.push(key);
                }
                break;
        }
        
        return parts.join('+');
    }
    
    /**
     * Active ou désactive les raccourcis clavier
     * @param {boolean} enabled - True pour activer, false pour désactiver
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    /**
     * Vérifie si les raccourcis clavier sont activés
     * @returns {boolean} - True si les raccourcis sont activés, false sinon
     */
    isEnabled() {
        return this.enabled;
    }
    
    /**
     * Ajoute un raccourci clavier
     * @param {string|Array} keys - Touche ou combinaison de touches (ex: 'ctrl+s' ou ['ctrl', 's'])
     * @param {Function|string} action - Fonction à exécuter ou nom d'événement à émettre
     * @param {Object} [options] - Options supplémentaires
     * @param {string} [options.description] - Description du raccourci (pour l'aide)
     * @param {boolean} [options.override=false] - Écraser un raccourci existant
     * @returns {boolean} - True si le raccourci a été ajouté, false sinon
     */
    add(keys, action, options = {}) {
        if (!keys || (!Array.isArray(keys) && typeof keys !== 'string')) {
            console.error('Les touches du raccourci doivent être une chaîne ou un tableau');
            return false;
        }
        
        // Normaliser les touches
        const keyArray = Array.isArray(keys) ? keys : keys.split('+').map(k => k.trim().toLowerCase());
        const shortcutId = keyArray.join('+');
        
        // Vérifier si le raccourci existe déjà
        if (this.shortcuts.has(shortcutId) && !options.override) {
            console.warn(`Le raccourci "${shortcutId}" existe déjà`);
            return false;
        }
        
        // Ajouter le raccourci
        this.shortcuts.set(shortcutId, action);
        
        // Émettre un événement d'ajout de raccourci
        eventBus.emit(Events.SHORTCUT_ADDED, {
            id: shortcutId,
            keys: keyArray,
            action,
            description: options.description
        });
        
        return true;
    }
    
    /**
     * Supprime un raccourci clavier
     * @param {string} shortcutId - Identifiant du raccourci à supprimer
     * @returns {boolean} - True si le raccourci a été supprimé, false sinon
     */
    remove(shortcutId) {
        if (this.shortcuts.has(shortcutId)) {
            this.shortcuts.delete(shortcutId);
            
            // Émettre un événement de suppression de raccourci
            eventBus.emit(Events.SHORTCUT_REMOVED, { id: shortcutId });
            
            return true;
        }
        return false;
    }
    
    /**
     * Supprime tous les raccourcis clavier
     */
    clear() {
        this.shortcuts.clear();
        
        // Émettre un événement de réinitialisation des raccourcis
        eventBus.emit(Events.SHORTCUTS_CLEARED);
    }
    
    /**
     * Active ou désactive temporairement les raccourcis clavier
     * @param {boolean} enable - True pour activer, false pour désactiver
     * @returns {Function} - Fonction de restauration
     */
    toggle(enable) {
        const previousState = this.enabled;
        this.setEnabled(enable);
        
        // Retourne une fonction pour restaurer l'état précédent
        return () => this.setEnabled(previousState);
    }
    
    /**
     * Écoute un raccourci clavier spécifique
     * @param {string|Array} keys - Touche ou combinaison de touches
     * @param {Object} [options] - Options supplémentaires
     * @param {boolean} [options.once=false] - Si true, le raccourci ne sera écouté qu'une seule fois
     * @returns {Promise<KeyboardEvent>} - Une promesse qui se résout lorsque le raccourci est utilisé
     */
    waitFor(keys, options = {}) {
        return new Promise((resolve) => {
            const keyArray = Array.isArray(keys) ? keys : keys.split('+').map(k => k.trim().toLowerCase());
            const shortcutId = keyArray.join('+');
            
            const handler = (e) => {
                if (options.once) {
                    this.remove(shortcutId);
                }
                resolve(e);
            };
            
            this.add(keys, handler, { ...options, override: true });
        });
    }
    
    /**
     * Active les raccourcis clavier uniquement lorsque l'élément spécifié a le focus
     * @param {HTMLElement} element - Élément qui doit avoir le focus
     */
    enableOnlyWhenFocused(element) {
        if (!(element instanceof HTMLElement)) {
            console.error('L\'élément doit être une instance de HTMLElement');
            return;
        }
        
        const enableShortcuts = () => this.setEnabled(true);
        const disableShortcuts = () => this.setEnabled(false);
        
        // Désactiver les raccourcis par défaut
        this.setEnabled(false);
        
        // Activer uniquement lorsque l'élément a le focus
        element.addEventListener('focus', enableShortcuts);
        element.addEventListener('blur', disableShortcuts);
        
        // Nettoyer les écouteurs d'événements lorsque l'élément est retiré du DOM
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.removedNodes) {
                    if (node === element || node.contains(element)) {
                        element.removeEventListener('focus', enableShortcuts);
                        element.removeEventListener('blur', disableShortcuts);
                        observer.disconnect();
                        return;
                    }
                }
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    /**
     * Détruit l'instance et nettoie les écouteurs d'événements
     */
    destroy() {
        document.removeEventListener('keydown', this._handleKeyDown);
        document.removeEventListener('keyup', this._handleKeyUp);
        window.removeEventListener('blur', this._resetModifiers);
        this.shortcuts.clear();
    }
}

// Créer une instance globale
const keyboardShortcuts = new KeyboardShortcuts();

// Raccourcis par défaut
keyboardShortcuts.add('?', Events.SHOW_KEYBOARD_SHORTCUTS, {
    description: 'Afficher la liste des raccourcis clavier'
});

keyboardShortcuts.add('esc', Events.CLOSE_MODAL, {
    description: 'Fermer la fenêtre modale ou le menu actif'
});

keyboardShortcuts.add('ctrl+shift+/', () => {
    keyboardShortcuts.setEnabled(!keyboardShortcuts.isEnabled());
    console.log(`Raccourcis clavier ${keyboardShortcuts.isEnabled() ? 'activés' : 'désactivés'}`);
}, {
    description: 'Activer/désactiver les raccourcis clavier'
});

// Exposer l'instance globale
window.EquipTrack = window.EquipTrack || {};
window.EquipTrack.keyboardShortcuts = keyboardShortcuts;

// Exporter l'instance par défaut et la classe
export { keyboardShortcuts as default, KeyboardShortcuts };
