/**
 * EquipTrack - Validation des formulaires
 * Fournit des fonctions de validation réutilisables pour les formulaires
 */

import { showError } from './notifications';

/**
 * Règles de validation prédéfinies
 */
const validationRules = {
    // Vérifie si la valeur est requise
    required: (value, fieldName) => {
        if (value === null || value === undefined || value === '') {
            return `Le champ ${fieldName} est requis`;
        }
        return '';
    },
    
    // Vérifie la longueur minimale
    minLength: (value, fieldName, min) => {
        if (value && value.length < min) {
            return `Le champ ${fieldName} doit contenir au moins ${min} caractères`;
        }
        return '';
    },
    
    // Vérifie la longueur maximale
    maxLength: (value, fieldName, max) => {
        if (value && value.length > max) {
            return `Le champ ${fieldName} ne doit pas dépasser ${max} caractères`;
        }
        return '';
    },
    
    // Vérifie la longueur exacte
    exactLength: (value, fieldName, length) => {
        if (value && value.length !== length) {
            return `Le champ ${fieldName} doit contenir exactement ${length} caractères`;
        }
        return '';
    },
    
    // Vérifie si la valeur est une adresse email valide
    email: (value, fieldName) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
            return `Veuillez saisir une adresse email valide pour le champ ${fieldName}`;
        }
        return '';
    },
    
    // Vérifie si la valeur est un numéro de téléphone valide
    phone: (value, fieldName) => {
        const phoneRegex = /^(\+\d{1,3}[\s-]?)?(\d[\s-]?){9,14}$/;
        if (value && !phoneRegex.test(value)) {
            return `Veuillez saisir un numéro de téléphone valide pour le champ ${fieldName}`;
        }
        return '';
    },
    
    // Vérifie si la valeur est numérique
    numeric: (value, fieldName) => {
        if (value && isNaN(Number(value))) {
            return `Le champ ${fieldName} doit être un nombre`;
        }
        return '';
    },
    
    // Vérifie si la valeur est un entier
    integer: (value, fieldName) => {
        if (value && !Number.isInteger(Number(value))) {
            return `Le champ ${fieldName} doit être un nombre entier`;
        }
        return '';
    },
    
    // Vérifie si la valeur est positive
    positive: (value, fieldName) => {
        if (value && Number(value) <= 0) {
            return `Le champ ${fieldName} doit être un nombre positif`;
        }
        return '';
    },
    
    // Vérifie si la valeur est supérieure à une valeur minimale
    minValue: (value, fieldName, min) => {
        if (value !== null && value !== undefined && value !== '' && Number(value) < min) {
            return `Le champ ${fieldName} doit être supérieur ou égal à ${min}`;
        }
        return '';
    },
    
    // Vérifie si la valeur est inférieure à une valeur maximale
    maxValue: (value, fieldName, max) => {
        if (value !== null && value !== undefined && value !== '' && Number(value) > max) {
            return `Le champ ${fieldName} doit être inférieur ou égal à ${max}`;
        }
        return '';
    },
    
    // Vérifie si la valeur correspond à un motif (regex)
    pattern: (value, fieldName, pattern) => {
        const regex = new RegExp(pattern);
        if (value && !regex.test(value)) {
            return `Le format du champ ${fieldName} est invalide`;
        }
        return '';
    },
    
    // Vérifie si la valeur est une date valide
    date: (value, fieldName) => {
        if (value && isNaN(new Date(value).getTime())) {
            return `Le champ ${fieldName} doit être une date valide`;
        }
        return '';
    },
    
    // Vérifie si la date est dans le futur
    futureDate: (value, fieldName) => {
        if (value && new Date(value) <= new Date()) {
            return `Le champ ${fieldName} doit être une date future`;
        }
        return '';
    },
    
    // Vérifie si la date est dans le passé
    pastDate: (value, fieldName) => {
        if (value && new Date(value) >= new Date()) {
            return `Le champ ${fieldName} doit être une date passée`;
        }
        return '';
    },
    
    // Vérifie si la valeur est une URL valide
    url: (value, fieldName) => {
        try {
            if (value) {
                new URL(value);
            }
            return '';
        } catch (e) {
            return `Le champ ${fieldName} doit être une URL valide`;
        }
    },
    
    // Vérifie si la valeur est un code QR valide (6 caractères alphanumériques)
    qrCode: (value, fieldName) => {
        const qrCodeRegex = /^[A-Z0-9]{6}$/i;
        if (value && !qrCodeRegex.test(value)) {
            return `Le champ ${fieldName} doit être un code QR valide (6 caractères alphanumériques)`;
        }
        return '';
    },
    
    // Vérifie si la valeur est un statut d'équipement valide
    equipmentStatus: (value, fieldName) => {
        const validStatuses = ['available', 'borrowed', 'maintenance'];
        if (value && !validStatuses.includes(value)) {
            return `Le statut de l'équipement est invalide`;
        }
        return '';
    },
    
    // Vérifie si la valeur est un type d'utilisation valide
    usageType: (value, fieldName) => {
        const validTypes = ['scan', 'borrow', 'return', 'maintenance'];
        if (value && !validTypes.includes(value)) {
            return `Le type d'utilisation est invalide`;
        }
        return '';
    },
    
    // Vérifie si la valeur est égale à une autre valeur (pour la confirmation de mot de passe par exemple)
    equals: (value, fieldName, otherValue, otherFieldName) => {
        if (value !== otherValue) {
            return `Les champs ${fieldName} et ${otherFieldName} doivent être identiques`;
        }
        return '';
    },
    
    // Vérifie si la valeur est incluse dans une liste de valeurs autorisées
    in: (value, fieldName, allowedValues) => {
        if (value && !allowedValues.includes(value)) {
            return `La valeur du champ ${fieldName} n'est pas valide`;
        }
        return '';
    },
    
    // Vérifie si la valeur est un tableau non vide
    arrayNotEmpty: (value, fieldName) => {
        if (value && (!Array.isArray(value) || value.length === 0)) {
            return `Le champ ${fieldName} doit être un tableau non vide`;
        }
        return '';
    },
    
    // Vérifie si la valeur est un objet non vide
    objectNotEmpty: (value, fieldName) => {
        if (value && (typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length === 0)) {
            return `Le champ ${fieldName} doit être un objet non vide`;
        }
        return '';
    }
};

/**
 * Classe de validation de formulaire
 */
class FormValidator {
    /**
     * Crée une nouvelle instance de FormValidator
     * @param {Object} rules - Règles de validation pour chaque champ du formulaire
     * @param {Object} [options] - Options de configuration
     * @param {boolean} [options.showErrors=true] - Afficher les erreurs dans l'interface
     * @param {string} [options.errorClass='is-invalid'] - Classe CSS pour les champs invalides
     * @param {string} [options.errorContainerClass='invalid-feedback'] - Classe CSS pour les conteneurs d'erreur
     * @param {Function} [options.onError] - Fonction de rappel appelée en cas d'erreur
     * @param {Function} [options.onSuccess] - Fonction de rappel appelée en cas de succès
     */
    constructor(rules, options = {}) {
        this.rules = rules;
        this.options = {
            showErrors: true,
            errorClass: 'is-invalid',
            errorContainerClass: 'invalid-feedback',
            ...options
        };
        this.errors = {};
        this.customValidators = {};
    }
    
    /**
     * Valide un champ spécifique
     * @param {string} field - Nom du champ à valider
     * @param {*} value - Valeur à valider
     * @param {Object} [formData] - Données complètes du formulaire (pour les validations croisées)
     * @returns {string} - Message d'erreur ou chaîne vide si valide
     */
    validateField(field, value, formData = {}) {
        if (!this.rules[field]) {
            return ''; // Aucune règle définie pour ce champ
        }
        
        const fieldRules = Array.isArray(this.rules[field]) ? 
            this.rules[field] : 
            [this.rules[field]];
        
        for (const rule of fieldRules) {
            // Règle personnalisée sous forme de fonction
            if (typeof rule === 'function') {
                const error = rule(value, field, formData);
                if (error) {
                    this.errors[field] = error;
                    return error;
                }
                continue;
            }
            
            // Règle prédéfinie sous forme de chaîne (ex: 'required', 'email')
            if (typeof rule === 'string') {
                if (validationRules[rule]) {
                    const error = validationRules[rule](value, field);
                    if (error) {
                        this.errors[field] = error;
                        return error;
                    }
                }
                continue;
            }
            
            // Règle avec paramètres (ex: {minLength: 6})
            if (typeof rule === 'object' && rule !== null) {
                for (const [ruleName, ruleParam] of Object.entries(rule)) {
                    if (validationRules[ruleName]) {
                        const error = validationRules[ruleName](value, field, ruleParam, formData);
                        if (error) {
                            this.errors[field] = error;
                            return error;
                        }
                    } else if (this.customValidators[ruleName]) {
                        const error = this.customValidators[ruleName](value, field, ruleParam, formData);
                        if (error) {
                            this.errors[field] = error;
                            return error;
                        }
                    }
                }
            }
        }
        
        // Si on arrive ici, la validation a réussi
        delete this.errors[field];
        return '';
    }
    
    /**
     * Valide l'ensemble du formulaire
     * @param {Object} formData - Données du formulaire à valider
     * @returns {boolean} - True si le formulaire est valide, false sinon
     */
    validateForm(formData) {
        this.errors = {};
        let isValid = true;
        
        for (const field in this.rules) {
            const value = formData[field];
            const error = this.validateField(field, value, formData);
            
            if (error) {
                isValid = false;
                
                // Afficher l'erreur dans l'interface si activé
                if (this.options.showErrors) {
                    this.showError(field, error);
                }
            } else {
                // Effacer les erreurs précédentes
                this.clearError(field);
            }
        }
        
        // Appeler les callbacks
        if (isValid && typeof this.options.onSuccess === 'function') {
            this.options.onSuccess(formData);
        } else if (!isValid && typeof this.options.onError === 'function') {
            this.options.onError(this.errors, formData);
        }
        
        return isValid;
    }
    
    /**
     * Affiche une erreur pour un champ spécifique
     * @param {string} field - Nom du champ
     * @param {string} message - Message d'erreur à afficher
     */
    showError(field, message) {
        // Trouver l'élément du champ
        const fieldElement = document.querySelector(`[name="${field}"], #${field}`);
        if (!fieldElement) return;
        
        // Ajouter la classe d'erreur au champ
        fieldElement.classList.add(this.options.errorClass);
        
        // Créer ou mettre à jour le message d'erreur
        let errorElement = fieldElement.nextElementSibling;
        
        // Vérifier si l'élément suivant est déjà un message d'erreur
        if (!errorElement || !errorElement.classList.contains(this.options.errorContainerClass)) {
            errorElement = document.createElement('div');
            errorElement.className = this.options.errorContainerClass;
            fieldElement.parentNode.insertBefore(errorElement, fieldElement.nextSibling);
        }
        
        errorElement.textContent = message;
    }
    
    /**
     * Efface l'erreur d'un champ spécifique
     * @param {string} field - Nom du champ
     */
    clearError(field) {
        // Trouver l'élément du champ
        const fieldElement = document.querySelector(`[name="${field}"], #${field}`);
        if (!fieldElement) return;
        
        // Supprimer la classe d'erreur du champ
        fieldElement.classList.remove(this.options.errorClass);
        
        // Supprimer le message d'erreur s'il existe
        const errorElement = fieldElement.nextElementSibling;
        if (errorElement && errorElement.classList.contains(this.options.errorContainerClass)) {
            errorElement.remove();
        }
    }
    
    /**
     * Efface toutes les erreurs du formulaire
     */
    clearAllErrors() {
        for (const field in this.errors) {
            this.clearError(field);
        }
        this.errors = {};
    }
    
    /**
     * Ajoute un validateur personnalisé
     * @param {string} name - Nom du validateur
     * @param {Function} validator - Fonction de validation
     */
    addValidator(name, validator) {
        if (typeof validator !== 'function') {
            throw new Error('Le validateur doit être une fonction');
        }
        
        this.customValidators[name] = validator;
    }
    
    /**
     * Définit les règles de validation
     * @param {Object} rules - Nouvelles règles de validation
     */
    setRules(rules) {
        this.rules = rules;
    }
    
    /**
     * Récupère les erreurs de validation actuelles
     * @returns {Object} - Objet contenant les erreurs de validation
     */
    getErrors() {
        return { ...this.errors };
    }
    
    /**
     * Vérifie si le formulaire est valide
     * @returns {boolean} - True si le formulaire est valide, false sinon
     */
    isValid() {
        return Object.keys(this.errors).length === 0;
    }
}

// Exposer les fonctions globalement
window.EquipTrack = window.EquipTrack || {};
window.EquipTrack.Validation = {
    rules: validationRules,
    FormValidator
};

// Exporter les fonctions et classes
export { validationRules as rules, FormValidator };

// Fonction utilitaire pour valider un formulaire avec des règles prédéfinies
export function validateForm(formElement, rules, options = {}) {
    const formData = new FormData(formElement);
    const data = {};
    
    // Convertir FormData en objet simple
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    const validator = new FormValidator(rules, {
        showErrors: true,
        errorClass: 'is-invalid',
        errorContainerClass: 'invalid-feedback',
        ...options
    });
    
    return validator.validateForm(data);
}

// Fonction utilitaire pour valider un champ unique
export function validateField(fieldElement, rules, formData = {}) {
    if (!fieldElement) {
        throw new Error('Élément de champ non trouvé');
    }
    
    const fieldName = fieldElement.name || fieldElement.id;
    const value = fieldElement.value;
    
    if (!fieldName) {
        throw new Error('Le champ doit avoir un attribut name ou id');
    }
    
    const validator = new FormValidator({ [fieldName]: rules });
    const error = validator.validateField(fieldName, value, formData);
    
    if (error) {
        validator.showError(fieldName, error);
        return { isValid: false, error };
    } else {
        // Effacer les erreurs précédentes
        const errorElement = fieldElement.nextElementSibling;
        if (errorElement && errorElement.classList.contains('invalid-feedback')) {
            errorElement.remove();
        }
        fieldElement.classList.remove('is-invalid');
        return { isValid: true };
    }
}
