/**
 * EquipTrack - Gestion de l'authentification
 * Fournit des méthodes pour gérer l'authentification des utilisateurs
 */

import api from './api';
import { eventBus, Events } from './events';

class Auth {
    constructor() {
        this.user = null;
        this.token = localStorage.getItem('auth_token') || null;
        this.refreshToken = localStorage.getItem('refresh_token') || null;
        this.tokenExpiry = parseInt(localStorage.getItem('token_expiry') || '0', 10);
        this.isRefreshing = false;
        this.refreshCall = null;
        
        // Configurer l'API pour utiliser le token d'authentification
        this.setupAuthHeader();
        
        // Vérifier l'état d'authentification au démarrage
        this.checkAuthState();
    }
    
    /**
     * Configure l'en-tête d'authentification pour les requêtes API
     */
    setupAuthHeader() {
        if (this.token) {
            api.setHeader('Authorization', `Bearer ${this.token}`);
            
            // Vérifier si le token est sur le point d'expirer
            this.checkTokenExpiry();
        } else {
            api.removeHeader('Authorization');
        }
    }
    
    /**
     * Vérifie si le token est sur le point d'expirer et le rafraîchit si nécessaire
     */
    checkTokenExpiry() {
        if (!this.token || !this.tokenExpiry) return;
        
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = this.tokenExpiry - now;
        
        // Si le token expire dans moins de 5 minutes, on le rafraîchit
        if (timeUntilExpiry < 300) {
            this.refreshTokenIfNeeded().catch(error => {
                console.error('Erreur lors du rafraîchissement du token:', error);
                this.logout();
            });
        }
    }
    
    /**
     * Rafraîchit le token d'authentification si nécessaire
     */
    async refreshTokenIfNeeded() {
        // Éviter les appels concurrents
        if (this.isRefreshing) {
            return this.refreshCall;
        }
        
        if (!this.refreshToken) {
            throw new Error('Aucun refresh token disponible');
        }
        
        this.isRefreshing = true;
        
        try {
            this.refreshCall = api.post('/auth/refresh', {
                refresh_token: this.refreshToken
            });
            
            const response = await this.refreshCall;
            this.setAuthTokens(response.data);
            
            return response;
        } finally {
            this.isRefreshing = false;
            this.refreshCall = null;
        }
    }
    
    /**
     * Vérifie l'état d'authentification actuel
     */
    async checkAuthState() {
        if (!this.token) {
            this.user = null;
            return false;
        }
        
        try {
            const response = await api.get('/auth/me');
            this.user = response.data.user;
            return true;
        } catch (error) {
            // En cas d'erreur, on déconnecte l'utilisateur
            if (error.response && error.response.status === 401) {
                this.clearAuth();
            }
            return false;
        }
    }
    
    /**
     * Connecte un utilisateur avec un email et un mot de passe
     * @param {string} email - Email de l'utilisateur
     * @param {string} password - Mot de passe de l'utilisateur
     * @param {boolean} rememberMe - Si vrai, le token sera stocké de manière persistante
     */
    async login(email, password, rememberMe = false) {
        try {
            const response = await api.post('/auth/login', {
                email,
                password,
                remember_me: rememberMe
            });
            
            this.setAuthTokens(response.data, rememberMe);
            this.user = response.data.user;
            
            // Émettre un événement de connexion réussie
            eventBus.emit(Events.USER_LOGGED_IN, this.user);
            
            return this.user;
        } catch (error) {
            // Transformer les erreurs de validation en un format plus facile à gérer
            if (error.response && error.response.status === 422) {
                const validationErrors = error.validationErrors || {};
                throw {
                    message: 'Veuillez corriger les erreurs du formulaire',
                    errors: validationErrors,
                    status: 422
                };
            }
            
            throw error;
        }
    }
    
    /**
     * Déconnecte l'utilisateur
     */
    async logout() {
        try {
            // Essayer d'appeler l'API de déconnexion si un token est disponible
            if (this.token) {
                await api.post('/auth/logout');
            }
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        } finally {
            // Nettoyer les données d'authentification dans tous les cas
            this.clearAuth();
            
            // Émettre un événement de déconnexion
            eventBus.emit(Events.USER_LOGGED_OUT);
            
            // Rediriger vers la page de connexion
            window.location.href = '/login';
        }
    }
    
    /**
     * Enregistre un nouvel utilisateur
     * @param {Object} userData - Données de l'utilisateur à enregistrer
     */
    async register(userData) {
        try {
            const response = await api.post('/auth/register', userData);
            
            // Si l'inscription connecte automatiquement l'utilisateur
            if (response.data.token) {
                this.setAuthTokens(response.data);
                this.user = response.data.user;
                
                // Émettre un événement de connexion réussie
                eventBus.emit(Events.USER_LOGGED_IN, this.user);
            }
            
            return response.data;
        } catch (error) {
            // Transformer les erreurs de validation en un format plus facile à gérer
            if (error.response && error.response.status === 422) {
                const validationErrors = error.response.data.errors || {};
                throw {
                    message: 'Veuillez corriger les erreurs du formulaire',
                    errors: validationErrors,
                    status: 422
                };
            }
            
            throw error;
        }
    }
    
    /**
     * Demande une réinitialisation de mot de passe
     * @param {string} email - Email de l'utilisateur
     */
    async forgotPassword(email) {
        try {
            const response = await api.post('/auth/forgot-password', { email });
            return response.data;
        } catch (error) {
            // Ne pas exposer les détails de l'erreur pour des raisons de sécurité
            if (error.response && error.response.status === 404) {
                throw {
                    message: 'Si un compte existe avec cette adresse email, un email de réinitialisation a été envoyé.',
                    status: 200 // Traiter comme un succès pour des raisons de sécurité
                };
            }
            
            throw error;
        }
    }
    
    /**
     * Réinitialise le mot de passe d'un utilisateur
     * @param {Object} resetData - Données de réinitialisation (token, email, password, password_confirmation)
     */
    async resetPassword(resetData) {
        try {
            const response = await api.post('/auth/reset-password', resetData);
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 422) {
                const validationErrors = error.response.data.errors || {};
                throw {
                    message: 'Veuillez corriger les erreurs du formulaire',
                    errors: validationErrors,
                    status: 422
                };
            }
            
            if (error.response && error.response.status === 400) {
                throw {
                    message: 'Le lien de réinitialisation est invalide ou a expiré',
                    status: 400
                };
            }
            
            throw error;
        }
    }
    
    /**
     * Vérifie si l'utilisateur est connecté
     * @returns {boolean} True si l'utilisateur est connecté
     */
    isAuthenticated() {
        return !!this.token && !!this.user;
    }
    
    /**
     * Vérifie si l'utilisateur a un rôle spécifique
     * @param {string|string[]} roles - Rôle ou tableau de rôles à vérifier
     * @returns {boolean} True si l'utilisateur a le(s) rôle(s) requis
     */
    hasRole(roles) {
        if (!this.isAuthenticated() || !this.user.roles) {
            return false;
        }
        
        const userRoles = Array.isArray(this.user.roles) ? this.user.roles : [this.user.roles];
        const requiredRoles = Array.isArray(roles) ? roles : [roles];
        
        return requiredRoles.some(role => userRoles.includes(role));
    }
    
    /**
     * Vérifie si l'utilisateur a une permission spécifique
     * @param {string|string[]} permissions - Permission ou tableau de permissions à vérifier
     * @returns {boolean} True si l'utilisateur a la(les) permission(s) requise(s)
     */
    can(permissions) {
        if (!this.isAuthenticated() || !this.user.permissions) {
            return false;
        }
        
        const userPermissions = Array.isArray(this.user.permissions) ? 
            this.user.permissions : 
            [this.user.permissions];
            
        const requiredPermissions = Array.isArray(permissions) ? 
            permissions : 
            [permissions];
        
        return requiredPermissions.every(permission => 
            userPermissions.includes(permission) || 
            userPermissions.includes('*') ||
            (permission.includes('*') && 
             userPermissions.some(up => 
                 new RegExp('^' + permission.replace(/\*/g, '.*') + '$').test(up)
             )
            )
        );
    }
    
    /**
     * Définit les tokens d'authentification
     * @param {Object} authData - Données d'authentification (token, refresh_token, expires_in, user)
     * @param {boolean} remember - Si vrai, stocke les tokens de manière persistante
     */
    setAuthTokens(authData, remember = false) {
        const { token, refresh_token, expires_in, user } = authData;
        
        this.token = token;
        this.refreshToken = refresh_token || this.refreshToken;
        
        // Calculer la date d'expiration du token
        if (expires_in) {
            this.tokenExpiry = Math.floor(Date.now() / 1000) + expires_in;
        }
        
        // Mettre à jour l'utilisateur si fourni
        if (user) {
            this.user = user;
        }
        
        // Configurer l'en-tête d'authentification
        this.setupAuthHeader();
        
        // Stocker les tokens si nécessaire
        if (remember) {
            localStorage.setItem('auth_token', this.token);
            
            if (this.refreshToken) {
                localStorage.setItem('refresh_token', this.refreshToken);
            }
            
            if (this.tokenExpiry) {
                localStorage.setItem('token_expiry', this.tokenExpiry.toString());
            }
        } else {
            // Stocker en session seulement
            sessionStorage.setItem('auth_token', this.token);
            
            if (this.refreshToken) {
                sessionStorage.setItem('refresh_token', this.refreshToken);
            }
            
            if (this.tokenExpiry) {
                sessionStorage.setItem('token_expiry', this.tokenExpiry.toString());
            }
            
            // Nettoyer le stockage local
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('token_expiry');
        }
    }
    
    /**
     * Nettoie les données d'authentification
     */
    clearAuth() {
        this.token = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.user = null;
        
        // Supprimer les tokens du stockage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('token_expiry');
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('token_expiry');
        
        // Supprimer l'en-tête d'authentification
        api.removeHeader('Authorization');
    }
    
    /**
     * Initialise l'authentification à partir du stockage
     */
    async initFromStorage() {
        // Vérifier d'abord le stockage de session, puis le stockage local
        let token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
        
        if (token) {
            this.token = token;
            this.refreshToken = sessionStorage.getItem('refresh_token') || localStorage.getItem('refresh_token');
            
            const expiry = sessionStorage.getItem('token_expiry') || localStorage.getItem('token_expiry');
            this.tokenExpiry = expiry ? parseInt(expiry, 10) : null;
            
            // Configurer l'en-tête d'authentification
            this.setupAuthHeader();
            
            // Récupérer les informations de l'utilisateur
            try {
                const response = await api.get('/auth/me');
                this.user = response.data;
                return true;
            } catch (error) {
                console.error('Erreur lors de la récupération des informations utilisateur:', error);
                this.clearAuth();
                return false;
            }
        }
        
        return false;
    }
}

// Créer une instance par défaut
const auth = new Auth();

// Initialiser l'authentification au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    auth.initFromStorage().then(authenticated => {
        if (authenticated) {
            eventBus.emit(Events.USER_LOGGED_IN, auth.user);
        }
    });
});

// Exposer l'instance globale
window.EquipTrack = window.EquipTrack || {};
window.EquipTrack.auth = auth;

// Exporter l'instance par défaut et la classe
export { auth as default, Auth };
