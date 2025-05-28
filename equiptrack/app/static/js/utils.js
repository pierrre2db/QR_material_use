/**
 * EquipTrack - Utilitaires
 * Fournit des fonctions utilitaires pour les opérations courantes
 */

/**
 * Formate une date au format lisible
 * @param {Date|string|number} date - Date à formater
 * @param {string} [format='fr-FR'] - Format de localisation
 * @param {Object} [options] - Options de formatage
 * @returns {string} Date formatée
 */
function formatDate(date, format = 'fr-FR', options = {}) {
    if (!date) return '';
    
    const defaultOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        ...options
    };
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
        return '';
    }
    
    return new Intl.DateTimeFormat(format, defaultOptions).format(dateObj);
}

/**
 * Formate un nombre avec des séparateurs de milliers
 * @param {number|string} number - Nombre à formater
 * @param {number} [decimals=2] - Nombre de décimales
 * @param {string} [decimalSeparator=','] - Séparateur décimal
 * @param {string} [thousandsSeparator=' '] - Séparateur de milliers
 * @returns {string} Nombre formaté
 */
function formatNumber(number, decimals = 2, decimalSeparator = ',', thousandsSeparator = ' ') {
    if (number === null || number === undefined || number === '') return '';
    
    const num = typeof number === 'string' ? parseFloat(number.replace(/[^0-9.,-]/g, '').replace(',', '.')) : number;
    
    if (isNaN(num)) return '';
    
    const fixed = num.toFixed(decimals);
    const parts = fixed.split('.');
    let integerPart = parts[0];
    const decimalPart = parts.length > 1 ? parts[1] : '';
    
    // Ajouter les séparateurs de milliers
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
    
    // Construire le résultat final
    let result = integerPart;
    
    if (decimals > 0 && decimalPart) {
        result += decimalSeparator + decimalPart;
    }
    
    return result;
}

/**
 * Formate une taille en octets dans une unité lisible
 * @param {number} bytes - Taille en octets
 * @param {number} [decimals=2] - Nombre de décimales
 * @returns {string} Taille formatée avec unité
 */
function formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Génère un identifiant unique
 * @param {number} [length=8] - Longueur de l'identifiant
 * @returns {string} Identifiant unique
 */
function generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
}

/**
 * Vérifie si une valeur est vide
 * @param {*} value - Valeur à vérifier
 * @returns {boolean} True si la valeur est vide
 */
function isEmpty(value) {
    if (value === null || value === undefined) {
        return true;
    }
    
    if (typeof value === 'string' && value.trim() === '') {
        return true;
    }
    
    if (Array.isArray(value) && value.length === 0) {
        return true;
    }
    
    if (typeof value === 'object' && Object.keys(value).length === 0) {
        return true;
    }
    
    return false;
}

/**
 * Clone profond d'un objet ou d'un tableau
 * @param {*} obj - Objet à cloner
 * @returns {*} Clone de l'objet
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (obj instanceof Date) {
        return new Date(obj);
    }
    
    if (obj instanceof RegExp) {
        return new RegExp(obj);
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }
    
    const clone = {};
    
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            clone[key] = deepClone(obj[key]);
        }
    }
    
    return clone;
}

/**
 * Fusionne plusieurs objets en profondeur
 * @param {...Object} objects - Objets à fusionner
 * @returns {Object} Objet fusionné
 */
function mergeDeep(...objects) {
    const isObject = obj => obj && typeof obj === 'object' && !Array.isArray(obj);
    
    return objects.reduce((prev, obj) => {
        if (!obj) return prev;
        
        Object.keys(obj).forEach(key => {
            const pVal = prev[key];
            const oVal = obj[key];
            
            if (isObject(pVal) && isObject(oVal)) {
                prev[key] = mergeDeep(pVal, oVal);
            } else if (Array.isArray(pVal) && Array.isArray(oVal)) {
                // Pour les tableaux, on concatène sans déduplication
                prev[key] = [...pVal, ...oVal];
            } else if (oVal !== undefined) {
                prev[key] = oVal;
            }
        });
        
        return prev;
    }, {});
}

/**
 * Met en majuscule la première lettre d'une chaîne
 * @param {string} str - Chaîne à modifier
 * @returns {string} Chaîne avec la première lettre en majuscule
 */
function capitalize(str) {
    if (typeof str !== 'string' || !str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Génère un slug à partir d'une chaîne
 * @param {string} str - Chaîne à convertir en slug
 * @returns {string} Slug généré
 */
function slugify(str) {
    if (!str) return '';
    
    return str
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
        .replace(/[^a-z0-9\s-]/g, '') // Supprime les caractères spéciaux
        .replace(/[\s-]+/g, '-') // Remplace les espaces et tirets par un seul tiret
        .replace(/^-+|-+$/g, ''); // Supprime les tirets en début et fin
}

/**
 * Échappe les caractères spéciaux pour les expressions régulières
 * @param {string} str - Chaîne à échapper
 * @returns {string} Chaîne échappée
 */
function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Met en surbrillance les correspondances dans une chaîne
 * @param {string} text - Texte dans lequel effectuer la recherche
 * @param {string} query - Terme de recherche
 * @param {string} [tag='mark'] - Balise à utiliser pour la surbrillance
 * @param {string} [className='highlight'] - Classe CSS à ajouter à la balise
 * @returns {string} Texte avec les correspondances mises en surbrillance
 */
function highlight(text, query, tag = 'mark', className = 'highlight') {
    if (!query || !text) return text || '';
    
    // Échapper les caractères spéciaux de la requête
    const escapedQuery = escapeRegExp(query);
    
    // Créer une expression régulière insensible à la casse
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    
    // Remplacer les correspondances par la balise de surbrillance
    return text.toString().replace(regex, `<${tag} class="${className}">$1</${tag}>`);
}

/**
 * Tronque une chaîne à une longueur maximale
 * @param {string} str - Chaîne à tronquer
 * @param {number} maxLength - Longueur maximale
 * @param {string} [suffix='...'] - Suffixe à ajouter si la chaîne est tronquée
 * @returns {string} Chaîne tronquée
 */
function truncate(str, maxLength, suffix = '...') {
    if (typeof str !== 'string' || !str) return '';
    if (str.length <= maxLength) return str;
    
    return str.substring(0, maxLength) + suffix;
}

/**
 * Valide une adresse email
 * @param {string} email - Adresse email à valider
 * @returns {boolean} True si l'email est valide
 */
function isValidEmail(email) {
    if (!email) return false;
    
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Valide un numéro de téléphone
 * @param {string} phone - Numéro de téléphone à valider
 * @returns {boolean} True si le numéro est valide
 */
function isValidPhone(phone) {
    if (!phone) return false;
    
    // Format international: +33612345678 ou 0612345678 ou 06 12 34 56 78
    const re = /^(\+\d{1,3}[\s-]?)?(\d[\s-]?){9,14}$/;
    return re.test(phone);
}

/**
 * Formate un numéro de téléphone
 * @param {string} phone - Numéro de téléphone à formater
 * @param {string} [format='fr-FR'] - Format de numérotation (fr-FR, en-US, etc.)
 * @returns {string} Numéro formaté
 */
function formatPhoneNumber(phone, format = 'fr-FR') {
    if (!phone) return '';
    
    // Nettoyer le numéro (ne garder que les chiffres)
    const cleaned = ('' + phone).replace(/\D/g, '');
    
    // Format français: 06 12 34 56 78
    if (format === 'fr-FR') {
        const match = cleaned.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
        if (match) {
            return `${match[1]} ${match[2]} ${match[3]} ${match[4]} ${match[5]}`;
        }
    }
    
    // Format international: +33 6 12 34 56 78
    if (format === 'international') {
        if (cleaned.length > 10) {
            return `+${cleaned.substring(0, cleaned.length - 9)} ${cleaned.substring(cleaned.length - 9, cleaned.length - 8)} ${cleaned.substring(cleaned.length - 8, cleaned.length - 6)} ${cleaned.substring(cleaned.length - 6, cleaned.length - 4)} ${cleaned.substring(cleaned.length - 4, cleaned.length - 2)} ${cleaned.substring(cleaned.length - 2)}`;
        }
    }
    
    // Retourner le numéro nettoyé si aucun format ne correspond
    return cleaned;
}

/**
 * Retarde l'exécution d'une fonction
 * @param {Function} fn - Fonction à exécuter
 * @param {number} delay - Délai en millisecondes
 * @returns {Function} Fonction d'annulation
 */
function debounce(fn, delay) {
    let timeoutId;
    
    return function(...args) {
        const context = this;
        
        clearTimeout(timeoutId);
        
        timeoutId = setTimeout(() => {
            fn.apply(context, args);
        }, delay);
        
        return () => clearTimeout(timeoutId);
    };
}

/**
 * Limite le taux d'exécution d'une fonction
 * @param {Function} fn - Fonction à exécuter
 * @param {number} limit - Délai minimum entre deux exécutions en millisecondes
 * @returns {Function} Fonction limitée
 */
function throttle(fn, limit) {
    let inThrottle = false;
    let lastFn;
    let lastRan;
    
    return function(...args) {
        const context = this;
        
        if (!inThrottle) {
            fn.apply(context, args);
            lastRan = Date.now();
            inThrottle = true;
        } else {
            clearTimeout(lastFn);
            
            lastFn = setTimeout(() => {
                if (Date.now() - lastRan >= limit) {
                    fn.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
}

/**
 * Exécute une fonction après un certain délai
 * @param {number} ms - Délai en millisecondes
 * @returns {Promise} Promesse résolue après le délai
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Crée un gestionnaire d'erreur pour les promesses
 * @param {Function} fn - Fonction à exécuter
 * @param {Function} errorHandler - Gestionnaire d'erreur
 * @returns {Function} Fonction enveloppée
 */
function withErrorHandler(fn, errorHandler = console.error) {
    return async function(...args) {
        try {
            return await fn.apply(this, args);
        } catch (error) {
            return errorHandler(error);
        }
    };
}

/**
 * Vérifie si un élément est visible dans le viewport
 * @param {HTMLElement} element - Élément à vérifier
 * @param {number} [offset=0] - Délai supplémentaire en pixels
 * @returns {boolean} True si l'élément est visible
 */
function isInViewport(element, offset = 0) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    
    return (
        rect.top >= -offset &&
        rect.left >= -offset &&
        rect.bottom <= viewportHeight + offset &&
        rect.right <= viewportWidth + offset
    );
}

/**
 * Fait défiler la page jusqu'à un élément en douceur
 * @param {HTMLElement|string} target - Élément ou sélecteur CSS de l'élément cible
 * @param {Object} [options] - Options de défilement
 * @param {number} [options.offset=0] - Délai supplémentaire en pixels
 * @param {number} [options.duration=500] - Durée de l'animation en millisecondes
 * @param {string} [options.easing='easeInOutQuad'] - Fonction d'accélération
 * @returns {Promise} Promesse résolue à la fin du défilement
 */
function scrollToElement(target, options = {}) {
    return new Promise((resolve) => {
        const {
            offset = 0,
            duration = 500,
            easing = 'easeInOutQuad'
        } = options;
        
        // Récupérer l'élément cible
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        
        if (!element) {
            console.warn(`Élément non trouvé: ${target}`);
            return resolve();
        }
        
        // Fonctions d'accélération
        const easingFunctions = {
            linear: t => t,
            easeInQuad: t => t * t,
            easeOutQuad: t => t * (2 - t),
            easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: t => t * t * t,
            easeOutCubic: t => (--t) * t * t + 1,
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
            easeInQuart: t => t * t * t * t,
            easeOutQuart: t => 1 - (--t) * t * t * t,
            easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
            easeInQuint: t => t * t * t * t * t,
            easeOutQuint: t => 1 + (--t) * t * t * t * t,
            easeInOutQuint: t => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t
        };
        
        const start = window.pageYOffset;
        const targetY = window.pageYOffset + element.getBoundingClientRect().top - offset;
        const distance = targetY - start;
        const startTime = performance.now();
        
        // Vérifier si le défilement est nécessaire
        if (distance === 0) {
            return resolve();
        }
        
        // Sélectionner la fonction d'accélération
        const ease = typeof easing === 'function' ? 
            easing : 
            (easingFunctions[easing] || easingFunctions.easeInOutQuad);
        
        // Fonction d'animation
        function step(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            window.scrollTo(0, start + distance * ease(progress));
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                resolve();
            }
        }
        
        // Démarrer l'animation
        window.requestAnimationFrame(step);
    });
}

// Exposer les fonctions globalement
window.EquipTrack = window.EquipTrack || {};
window.EquipTrack.utils = {
    formatDate,
    formatNumber,
    formatFileSize,
    generateId,
    isEmpty,
    deepClone,
    mergeDeep,
    capitalize,
    slugify,
    escapeRegExp,
    highlight,
    truncate,
    isValidEmail,
    isValidPhone,
    formatPhoneNumber,
    debounce,
    throttle,
    sleep,
    withErrorHandler,
    isInViewport,
    scrollToElement
};

// Exporter toutes les fonctions
export {
    formatDate,
    formatNumber,
    formatFileSize,
    generateId,
    isEmpty,
    deepClone,
    mergeDeep,
    capitalize,
    slugify,
    escapeRegExp,
    highlight,
    truncate,
    isValidEmail,
    isValidPhone,
    formatPhoneNumber,
    debounce,
    throttle,
    sleep,
    withErrorHandler,
    isInViewport,
    scrollToElement
};
