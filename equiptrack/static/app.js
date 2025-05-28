// Gestion des messages flash
function hideFlashMessages() {
    const flashMessages = document.querySelectorAll('.flash-message');
    flashMessages.forEach(message => {
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => message.remove(), 300);
        }, 3000);
    });
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Masquer les messages flash après un délai
    hideFlashMessages();
    
    // Initialiser les tooltips
    const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
    tooltipTriggers.forEach(trigger => {
        trigger.addEventListener('mouseenter', showTooltip);
        trigger.addEventListener('mouseleave', hideTooltip);
    });
    
    // Gestion des onglets
    const tabButtons = document.querySelectorAll('[data-tab]');
    tabButtons.forEach(button => {
        button.addEventListener('click', switchTab);
    });
});

// Fonction pour afficher les tooltips
function showTooltip(event) {
    const tooltipText = this.getAttribute('data-tooltip');
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = tooltipText;
    
    document.body.appendChild(tooltip);
    
    const rect = this.getBoundingClientRect();
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
    tooltip.style.left = `${rect.left + (this.offsetWidth - tooltip.offsetWidth) / 2}px`;
    
    this._tooltip = tooltip;
}

// Fonction pour masquer les tooltips
function hideTooltip() {
    if (this._tooltip) {
        this._tooltip.remove();
        this._tooltip = null;
    }
}

// Fonction pour basculer entre les onglets
function switchTab(event) {
    event.preventDefault();
    
    const tabId = this.getAttribute('data-tab');
    const tabContent = document.getElementById(tabId);
    
    if (!tabContent) return;
    
    // Désactiver tous les onglets
    document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.add('hidden');
    });
    
    // Activer l'onglet sélectionné
    this.classList.add('active');
    tabContent.classList.remove('hidden');
}

// Fonction pour confirmer les actions critiques
function confirmAction(message) {
    return confirm(message || 'Êtes-vous sûr de vouloir effectuer cette action ?');
}

// Fonction pour afficher un indicateur de chargement
function showLoading(button, text = 'Chargement...') {
    if (!button) return null;
    
    const originalHTML = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `
        <span class="loading-spinner"></span>
        ${text}
    `;
    
    return () => {
        button.innerHTML = originalHTML;
        button.disabled = false;
    };
}

// Fonction utilitaire pour les requêtes AJAX
async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Une erreur est survenue');
    }
    
    return response.json();
}

// Fonction pour copier du texte dans le presse-papier
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Erreur lors de la copie :', err);
        return false;
    }
}

// Exposer les fonctions au scope global
window.App = {
    confirmAction,
    showLoading,
    fetchJson,
    copyToClipboard
};
