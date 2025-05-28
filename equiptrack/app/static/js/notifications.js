/**
 * EquipTrack - Gestion des notifications
 * Fournit des méthodes pour afficher des notifications à l'utilisateur
 */

class Notifications {
    constructor() {
        this.container = this.createContainer();
        this.position = 'top-right';
        this.autoDismiss = 5000; // 5 secondes par défaut
        this.maxNotifications = 5;
        this.notifications = [];
        this.setupEventListeners();
    }
    
    /**
     * Crée le conteneur des notifications s'il n'existe pas
     */
    createContainer() {
        let container = document.getElementById('notifications-container');
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'notifications-container';
            container.className = 'notifications';
            document.body.appendChild(container);
        }
        
        return container;
    }
    
    /**
     * Configure les écouteurs d'événements
     */
    setupEventListeners() {
        // Délégation d'événements pour les boutons de fermeture
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.notification-close')) {
                const notification = e.target.closest('.notification');
                if (notification) {
                    this.remove(notification.dataset.id);
                }
            }
        });
        
        // Empêcher la propagation des clics sur les notifications
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.notification')) {
                e.stopPropagation();
            }
        });
        
        // Fermer les notifications lors d'un clic en dehors
        document.addEventListener('click', () => {
            this.notifications.forEach(notification => {
                if (notification.autoClose) {
                    this.remove(notification.id);
                }
            });
        });
    }
    
    /**
     * Configure la position du conteneur de notifications
     * @param {string} position - Position des notifications (top-right, top-left, bottom-right, bottom-left)
     */
    setPosition(position) {
        const validPositions = ['top-right', 'top-left', 'bottom-right', 'bottom-left'];
        
        if (validPositions.includes(position)) {
            this.position = position;
            this.container.className = `notifications ${position}`;
        }
        
        return this;
    }
    
    /**
     * Définit la durée avant disparition automatique
     * @param {number} ms - Durée en millisecondes (0 pour désactiver)
     */
    setAutoDismiss(ms) {
        this.autoDismiss = parseInt(ms, 10) || 0;
        return this;
    }
    
    /**
     * Affiche une notification
     * @param {Object} options - Options de la notification
     * @returns {string} ID de la notification
     */
    show(options) {
        if (typeof options === 'string') {
            options = { message: options };
        }
        
        const {
            title = '',
            message = '',
            type = 'info',
            icon = null,
            duration = this.autoDismiss,
            dismissible = true,
            onClick = null,
            onClose = null,
            action = null
        } = options;
        
        // Créer un ID unique pour la notification
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Créer l'élément de notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} ${dismissible ? 'dismissible' : ''}`;
        notification.dataset.id = id;
        
        // Icône par défaut selon le type
        let iconHtml = '';
        if (icon) {
            iconHtml = `<div class="notification-icon">${icon}</div>`;
        } else {
            const icons = {
                success: '<i class="fas fa-check-circle"></i>',
                error: '<i class="fas fa-exclamation-circle"></i>',
                warning: '<i class="fas fa-exclamation-triangle"></i>',
                info: '<i class="fas fa-info-circle"></i>'
            };
            iconHtml = `<div class="notification-icon">${icons[type] || icons.info}</div>`;
        }
        
        // Contenu de la notification
        let titleHtml = title ? `<div class="notification-title">${title}</div>` : '';
        let messageHtml = message ? `<div class="notification-message">${message}</div>` : '';
        
        // Bouton d'action
        let actionHtml = '';
        if (action) {
            actionHtml = `
                <div class="notification-actions">
                    <button class="btn btn-sm btn-${action.type || 'primary'}" data-action="${action.name || 'action'}">
                        ${action.label || 'OK'}
                    </button>
                </div>`;
        }
        
        // Bouton de fermeture
        const closeBtn = dismissible ? '<button class="notification-close">&times;</button>' : '';
        
        // Assembler le HTML
        notification.innerHTML = `
            ${iconHtml}
            <div class="notification-content">
                ${titleHtml}
                ${messageHtml}
                ${actionHtml}
            </div>
            ${closeBtn}
            <div class="notification-progress"></div>
        `;
        
        // Ajouter la notification au conteneur
        this.container.appendChild(notification);
        
        // Forcer le recalcul des styles pour l'animation
        void notification.offsetHeight;
        
        // Ajouter la classe pour l'animation d'entrée
        notification.classList.add('show');
        
        // Configurer la barre de progression
        if (duration > 0) {
            const progressBar = notification.querySelector('.notification-progress');
            if (progressBar) {
                progressBar.style.transition = `width ${duration}ms linear`;
                setTimeout(() => {
                    progressBar.style.width = '0%';
                }, 50);
            }
        }
        
        // Gérer le clic sur la notification
        if (onClick && typeof onClick === 'function') {
            notification.style.cursor = 'pointer';
            notification.addEventListener('click', (e) => {
                if (!e.target.closest('.notification-close') && !e.target.closest('.notification-actions')) {
                    onClick(e, { id, close: () => this.remove(id) });
                }
            });
        }
        
        // Gérer le clic sur le bouton d'action
        if (action && action.callback) {
            const actionBtn = notification.querySelector('[data-action]');
            if (actionBtn) {
                actionBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    action.callback(e, { id, close: () => this.remove(id) });
                });
            }
        }
        
        // Gérer la fermeture automatique
        let timeoutId;
        if (duration > 0) {
            timeoutId = setTimeout(() => {
                this.remove(id);
            }, duration);
        }
        
        // Stocker les informations de la notification
        const notificationObj = {
            id,
            element: notification,
            timeoutId,
            close: () => this.remove(id),
            update: (newOptions) => this.update(id, newOptions),
            autoClose: duration > 0
        };
        
        this.notifications.push(notificationObj);
        
        // Limiter le nombre de notifications affichées
        if (this.notifications.length > this.maxNotifications) {
            const oldestNotification = this.notifications.shift();
            this.remove(oldestNotification.id);
        }
        
        // Appeler le callback de fermeture si fourni
        if (onClose && typeof onClose === 'function') {
            notificationObj.onClose = onClose;
        }
        
        return id;
    }
    
    /**
     * Met à jour une notification existante
     * @param {string} id - ID de la notification à mettre à jour
     * @param {Object} options - Nouvelles options
     */
    update(id, options) {
        const notification = this.notifications.find(n => n.id === id);
        
        if (!notification) {
            return false;
        }
        
        // Mettre à jour les propriétés
        const { title, message, type, icon, duration } = options;
        
        if (title !== undefined) {
            const titleEl = notification.element.querySelector('.notification-title');
            if (titleEl) {
                titleEl.textContent = title;
            } else if (title) {
                const contentEl = notification.element.querySelector('.notification-content');
                if (contentEl) {
                    const newTitleEl = document.createElement('div');
                    newTitleEl.className = 'notification-title';
                    newTitleEl.textContent = title;
                    contentEl.insertBefore(newTitleEl, contentEl.firstChild);
                }
            }
        }
        
        if (message !== undefined) {
            const messageEl = notification.element.querySelector('.notification-message');
            if (messageEl) {
                messageEl.innerHTML = message;
            } else if (message) {
                const contentEl = notification.element.querySelector('.notification-content');
                if (contentEl) {
                    const newMessageEl = document.createElement('div');
                    newMessageEl.className = 'notification-message';
                    newMessageEl.innerHTML = message;
                    contentEl.appendChild(newMessageEl);
                }
            }
        }
        
        if (type) {
            // Supprimer les anciennes classes de type
            notification.element.className = notification.element.className
                .split(' ')
                .filter(c => !c.startsWith('notification-') || c === 'notification')
                .join(' ');
            
            // Ajouter la nouvelle classe de type
            notification.element.classList.add(`notification-${type}`);
        }
        
        if (icon !== undefined) {
            const iconEl = notification.element.querySelector('.notification-icon');
            if (iconEl) {
                iconEl.innerHTML = icon;
            }
        }
        
        // Réinitialiser le minuteur de fermeture automatique si la durée change
        if (duration !== undefined) {
            if (notification.timeoutId) {
                clearTimeout(notification.timeoutId);
            }
            
            if (duration > 0) {
                notification.timeoutId = setTimeout(() => {
                    this.remove(id);
                }, duration);
                
                // Mettre à jour la barre de progression
                const progressBar = notification.element.querySelector('.notification-progress');
                if (progressBar) {
                    progressBar.style.transition = 'none';
                    progressBar.style.width = '100%';
                    
                    setTimeout(() => {
                        progressBar.style.transition = `width ${duration}ms linear`;
                        progressBar.style.width = '0%';
                    }, 50);
                }
            } else {
                notification.timeoutId = null;
                
                // Cacher la barre de progression si la durée est désactivée
                const progressBar = notification.element.querySelector('.notification-progress');
                if (progressBar) {
                    progressBar.style.display = 'none';
                }
            }
        }
        
        return true;
    }
    
    /**
     * Supprime une notification
     * @param {string} id - ID de la notification à supprimer
     */
    remove(id) {
        const index = this.notifications.findIndex(n => n.id === id);
        
        if (index === -1) {
            return false;
        }
        
        const notification = this.notifications[index];
        
        // Annuler le minuteur de fermeture automatique
        if (notification.timeoutId) {
            clearTimeout(notification.timeoutId);
        }
        
        // Appeler le callback de fermeture si fourni
        if (typeof notification.onClose === 'function') {
            notification.onClose();
        }
        
        // Animation de sortie
        notification.element.classList.remove('show');
        notification.element.classList.add('hide');
        
        // Supprimer l'élément du DOM après l'animation
        setTimeout(() => {
            if (notification.element && notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
        }, 300); // Durée de l'animation CSS
        
        // Supprimer la notification du tableau
        this.notifications.splice(index, 1);
        
        return true;
    }
    
    /**
     * Supprime toutes les notifications
     */
    clear() {
        this.notifications.forEach(notification => {
            this.remove(notification.id);
        });
    }
    
    /**
     * Affiche une notification de succès
     * @param {string|Object} options - Message ou options de la notification
     */
    success(options) {
        if (typeof options === 'string') {
            options = { message: options };
        }
        return this.show({ ...options, type: 'success' });
    }
    
    /**
     * Affiche une notification d'erreur
     * @param {string|Object} options - Message ou options de la notification
     */
    error(options) {
        if (typeof options === 'string') {
            options = { message: options };
        }
        return this.show({ ...options, type: 'error' });
    }
    
    /**
     * Affiche une notification d'avertissement
     * @param {string|Object} options - Message ou options de la notification
     */
    warning(options) {
        if (typeof options === 'string') {
            options = { message: options };
        }
        return this.show({ ...options, type: 'warning' });
    }
    
    /**
     * Affiche une notification d'information
     * @param {string|Object} options - Message ou options de la notification
     */
    info(options) {
        if (typeof options === 'string') {
            options = { message: options };
        }
        return this.show({ ...options, type: 'info' });
    }
}

// Créer une instance par défaut
const notifications = new Notifications();

// Exposer l'instance globale
window.EquipTrack = window.EquipTrack || {};
window.EquipTrack.notifications = notifications;

// Méthodes globales pour un accès facile
window.showNotification = (message, type = 'info', options = {}) => {
    return notifications.show({ ...options, message, type });
};

window.showSuccess = (message, options = {}) => {
    return notifications.success({ ...options, message });
};

window.showError = (message, options = {}) => {
    return notifications.error({ ...options, message });
};

window.showWarning = (message, options = {}) => {
    return notifications.warning({ ...options, message });
};

window.showInfo = (message, options = {}) => {
    return notifications.info({ ...options, message });
};

// Exporter l'instance par défaut et la classe
export { notifications as default, Notifications };
