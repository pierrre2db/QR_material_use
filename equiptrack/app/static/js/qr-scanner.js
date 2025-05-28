/**
 * EquipTrack - Scanner de codes QR
 * Fournit des fonctions pour scanner des codes QR à partir de la caméra ou d'une image
 */

import { eventBus, Events } from './events';
import { showError, showInfo, showSuccess } from './notifications';

// Vérifier si le navigateur prend en charge l'API de médias
const isMediaDevicesSupported = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;

// Vérifier si le navigateur prend en charge l'API de détection de code-barres
const isBarcodeDetectorSupported = 'BarcodeDetector' in window;

/**
 * Classe pour gérer le scan de codes QR
 */
class QRScanner {
    /**
     * Crée une nouvelle instance de QRScanner
     * @param {Object} options - Options de configuration
     * @param {HTMLElement|string} options.container - Conteneur pour l'élément vidéo
     * @param {number} [options.scanInterval=500] - Intervalle de scan en ms
     * @param {boolean} [options.torchEnabled=false] - Activer/désactiver la torche
     * @param {string} [options.facingMode='environment'] - Mode de la caméra ('user' ou 'environment')
     * @param {boolean} [options.debug=false] - Mode débogage
     */
    constructor(options = {}) {
        // Options par défaut
        this.options = {
            container: null,
            scanInterval: 500,
            torchEnabled: false,
            facingMode: 'environment',
            debug: false,
            ...options
        };
        
        // État du scanner
        this.isScanning = false;
        this.stream = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.canvasContext = null;
        this.scanInterval = null;
        this.barcodeDetector = null;
        
        // Dernier code scanné (pour éviter les doublons)
        this.lastScannedCode = '';
        this.lastScanTime = 0;
        
        // Initialiser le détecteur de codes-barres si pris en charge
        if (isBarcodeDetectorSupported) {
            this.barcodeDetector = new BarcodeDetector({
                formats: ['qr_code']
            });
        }
        
        // Initialiser les éléments DOM
        this._initElements();
    }
    
    /**
     * Initialise les éléments DOM nécessaires
     * @private
     */
    _initElements() {
        // Créer l'élément vidéo s'il n'existe pas
        if (!this.videoElement) {
            this.videoElement = document.createElement('video');
            this.videoElement.setAttribute('autoplay', '');
            this.videoElement.setAttribute('playsinline', '');
            this.videoElement.style.width = '100%';
            this.videoElement.style.height = '100%';
            this.videoElement.style.objectFit = 'cover';
        }
        
        // Créer l'élément canvas pour la capture d'image
        if (!this.canvasElement) {
            this.canvasElement = document.createElement('canvas');
            this.canvasContext = this.canvasElement.getContext('2d', { willReadFrequently: true });
            this.canvasElement.style.display = 'none';
        }
        
        // Ajouter les éléments au conteneur s'il est spécifié
        if (this.options.container) {
            const container = typeof this.options.container === 'string' ? 
                document.querySelector(this.options.container) : 
                this.options.container;
                
            if (container) {
                container.innerHTML = '';
                container.appendChild(this.videoElement);
                container.appendChild(this.canvasElement);
            } else {
                console.warn('Le conteneur spécifié est introuvable');
            }
        }
    }
    
    /**
     * Vérifie si le scanner est pris en charge par le navigateur
     * @returns {Object} - Résultat de la vérification
     */
    static isSupported() {
        return {
            mediaDevices: isMediaDevicesSupported,
            barcodeDetector: isBarcodeDetectorSupported,
            supported: isMediaDevicesSupported && isBarcodeDetectorSupported,
            message: isMediaDevicesSupported && isBarcodeDetectorSupported ?
                'La numérisation de codes QR est prise en charge par votre navigateur' :
                'Votre navigateur ne prend pas en charge toutes les fonctionnalités nécessaires pour le scan de codes QR'
        };
    }
    
    /**
     * Démarre le scan du code QR
     * @returns {Promise<boolean>} - True si le scan a démarré avec succès
     */
    async start() {
        // Vérifier si le scan est déjà en cours
        if (this.isScanning) {
            console.warn('Le scan est déjà en cours');
            return true;
        }
        
        // Vérifier la prise en charge du navigateur
        const support = QRScanner.isSupported();
        if (!support.supported) {
            const errorMessage = 'La numérisation de codes QR n\'est pas prise en charge par votre navigateur. ' +
                'Veuillez utiliser un navigateur compatible comme Chrome pour Android ou Safari pour iOS.';
            
            console.error(errorMessage);
            showError(errorMessage);
            
            // Émettre un événement d'erreur
            eventBus.emit(Events.QR_SCAN_ERROR, {
                error: 'NOT_SUPPORTED',
                message: errorMessage
            });
            
            return false;
        }
        
        try {
            // Demander l'accès à la caméra
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: this.options.facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            
            // Configurer l'élément vidéo
            this.videoElement.srcObject = this.stream;
            
            // Attendre que la vidéo soit prête
            await new Promise((resolve, reject) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play().then(resolve).catch(reject);
                };
                
                this.videoElement.onerror = reject;
                
                // Timeout après 5 secondes
                setTimeout(() => {
                    reject(new Error('Le chargement de la caméra a pris trop de temps'));
                }, 5000);
            });
            
            // Mettre à jour la taille du canvas pour correspondre à la vidéo
            this._updateCanvasSize();
            
            // Démarrer la boucle de scan
            this.isScanning = true;
            this._startScanLoop();
            
            // Émettre un événement de démarrage
            eventBus.emit(Events.QR_SCAN_START, {
                videoElement: this.videoElement,
                stream: this.stream
            });
            
            if (this.options.debug) {
                console.log('Scan de codes QR démarré');
            }
            
            return true;
            
        } catch (error) {
            console.error('Erreur lors du démarrage du scan de codes QR:', error);
            
            // Arrêter le flux média en cas d'erreur
            this._stopStream();
            
            // Afficher un message d'erreur convivial
            let errorMessage = 'Impossible d\'accéder à la caméra. ';
            
            if (error.name === 'NotAllowedError') {
                errorMessage += 'Veuillez autoriser l\'accès à la caméra pour scanner les codes QR.';
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage += 'Aucune caméra n\'a été trouvée sur cet appareil.';
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage += 'La caméra est déjà utilisée par une autre application ou ne peut pas être démarrée.';
            } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
                errorMessage += 'Les contraintes de la caméra ne peuvent pas être satisfaites.';
            } else {
                errorMessage += `Erreur: ${error.message || 'Erreur inconnue'}`;
            }
            
            showError(errorMessage);
            
            // Émettre un événement d'erreur
            eventBus.emit(Events.QR_SCAN_ERROR, {
                error: error.name || 'UNKNOWN_ERROR',
                message: errorMessage,
                details: error
            });
            
            return false;
        }
    }
    
    /**
     * Arrête le scan du code QR
     */
    stop() {
        if (!this.isScanning) {
            return;
        }
        
        // Arrêter la boucle de scan
        this.isScanning = false;
        
        // Arrêter l'intervalle de scan
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
        
        // Arrêter le flux média
        this._stopStream();
        
        // Réinitialiser l'élément vidéo
        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.srcObject = null;
        }
        
        // Émettre un événement d'arrêt
        eventBus.emit(Events.QR_SCAN_STOP);
        
        if (this.options.debug) {
            console.log('Scan de codes QR arrêté');
        }
    }
    
    /**
     * Bascule entre l'activation et la désactivation du scan
     * @returns {Promise<boolean>} - Résultat de l'opération
     */
    toggle() {
        return this.isScanning ? (this.stop(), false) : this.start();
    }
    
    /**
     * Bascule entre les caméras avant et arrière
     * @returns {Promise<boolean>} - True si le changement a réussi
     */
    async toggleCamera() {
        if (!this.isScanning) {
            return false;
        }
        
        // Mémoriser l'état actuel
        const wasScanning = this.isScanning;
        
        // Arrêter le scan actuel
        this.stop();
        
        // Changer de caméra
        this.options.facingMode = this.options.facingMode === 'user' ? 'environment' : 'user';
        
        // Redémarrer le scan si nécessaire
        if (wasScanning) {
            return this.start();
        }
        
        return true;
    }
    
    /**
     * Bascule l'état de la torche (si disponible)
     * @returns {Promise<boolean>} - Nouvel état de la torche
     */
    async toggleTorch() {
        if (!this.stream) {
            return false;
        }
        
        try {
            const track = this.stream.getVideoTracks()[0];
            
            if (!track || !('getCapabilities' in track)) {
                console.warn('La torche n\'est pas disponible sur cet appareil');
                return false;
            }
            
            const capabilities = track.getCapabilities();
            
            if (!capabilities.torch) {
                console.warn('La torche n\'est pas disponible sur cet appareil');
                return false;
            }
            
            // Bascule l'état de la torche
            this.options.torchEnabled = !this.options.torchEnabled;
            
            await track.applyConstraints({
                advanced: [{
                    torch: this.options.torchEnabled
                }]
            });
            
            // Émettre un événement de changement d'état de la torche
            eventBus.emit(Events.QR_SCAN_TORCH_TOGGLED, {
                enabled: this.options.torchEnabled
            });
            
            if (this.options.debug) {
                console.log(`Torch ${this.options.torchEnabled ? 'activée' : 'désactivée'}`);
            }
            
            return this.options.torchEnabled;
            
        } catch (error) {
            console.error('Erreur lors du basculement de la torche:', error);
            return false;
        }
    }
    
    /**
     * Capture une image à partir de la caméra et tente de détecter un code QR
     * @returns {Promise<Object|null>} - Données du code QR détecté ou null
     */
    async captureAndScan() {
        if (!this.videoElement || !this.canvasContext) {
            return null;
        }
        
        try {
            // Mettre à jour la taille du canvas si nécessaire
            this._updateCanvasSize();
            
            // Dessiner l'image de la vidéo sur le canvas
            this.canvasContext.drawImage(
                this.videoElement,
                0, 0,
                this.canvasElement.width,
                this.canvasElement.height
            );
            
            // Détecter les codes-barres dans l'image
            const barcodes = await this.barcodeDetector.detect(this.canvasElement);
            
            // Vérifier si un code QR a été détecté
            if (barcodes && barcodes.length > 0) {
                // Trier par surface (le plus grand en premier)
                barcodes.sort((a, b) => {
                    const aArea = a.boundingBox.width * a.boundingBox.height;
                    const bArea = b.boundingBox.width * b.boundingBox.height;
                    return bArea - aArea;
                });
                
                // Retourner le premier code QR détecté
                return this._processDetectedBarcode(barcodes[0]);
            }
            
            return null;
            
        } catch (error) {
            console.error('Erreur lors de la capture et de l\'analyse:', error);
            return null;
        }
    }
    
    /**
     * Analyse une image à partir d'un fichier pour détecter un code QR
     * @param {File} file - Fichier image à analyser
     * @returns {Promise<Object|null>} - Données du code QR détecté ou null
     */
    static async scanFromFile(file) {
        if (!file || !(file instanceof File)) {
            throw new Error('Un fichier valide est requis');
        }
        
        if (!isBarcodeDetectorSupported) {
            throw new Error('La détection de codes QR à partir de fichiers n\'est pas prise en charge par votre navigateur');
        }
        
        try {
            // Créer un détecteur de codes-barres
            const barcodeDetector = new BarcodeDetector({
                formats: ['qr_code']
            });
            
            // Créer une URL pour le fichier
            const imageUrl = URL.createObjectURL(file);
            
            // Charger l'image
            const img = new Image();
            img.src = imageUrl;
            
            // Attendre que l'image soit chargée
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error('Impossible de charger l\'image'));
            });
            
            // Détecter les codes-barres dans l'image
            const barcodes = await barcodeDetector.detect(img);
            
            // Libérer l'URL de l'objet
            URL.revokeObjectURL(imageUrl);
            
            // Vérifier si un code QR a été détecté
            if (barcodes && barcodes.length > 0) {
                // Trier par surface (le plus grand en premier)
                barcodes.sort((a, b) => {
                    const aArea = a.boundingBox.width * a.boundingBox.height;
                    const bArea = b.boundingBox.width * b.boundingBox.height;
                    return bArea - aArea;
                });
                
                // Retourner le premier code QR détecté
                return {
                    rawValue: barcodes[0].rawValue,
                    format: barcodes[0].format,
                    boundingBox: barcodes[0].boundingBox,
                    cornerPoints: barcodes[0].cornerPoints,
                    timestamp: Date.now(),
                    source: 'file',
                    file: file.name
                };
            }
            
            return null;
            
        } catch (error) {
            console.error('Erreur lors de l\'analyse du fichier:', error);
            throw error;
        }
    }
    
    /**
     * Démarre la boucle de scan
     * @private
     */
    _startScanLoop() {
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
        }
        
        this.scanInterval = setInterval(async () => {
            if (!this.isScanning) {
                return;
            }
            
            try {
                const result = await this.captureAndScan();
                
                if (result) {
                    // Vérifier si c'est le même code que le précédent
                    const now = Date.now();
                    const isSameCode = result.rawValue === this.lastScannedCode;
                    const isRecent = now - this.lastScanTime < 2000; // 2 secondes
                    
                    if (!isSameCode || !isRecent) {
                        this.lastScannedCode = result.rawValue;
                        this.lastScanTime = now;
                        
                        // Émettre un événement de code QR détecté
                        eventBus.emit(Events.QR_CODE_DETECTED, result);
                        
                        if (this.options.debug) {
                            console.log('Code QR détecté:', result);
                        }
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la boucle de scan:', error);
            }
        }, this.options.scanInterval);
    }
    
    /**
     * Arrête le flux média
     * @private
     */
    _stopStream() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
            });
            this.stream = null;
        }
    }
    
    /**
     * Met à jour la taille du canvas pour correspondre à la vidéo
     * @private
     */
    _updateCanvasSize() {
        if (this.videoElement && this.canvasElement) {
            // Récupérer la taille de la vidéo
            const videoWidth = this.videoElement.videoWidth || 640;
            const videoHeight = this.videoElement.videoHeight || 480;
            
            // Mettre à jour la taille du canvas
            this.canvasElement.width = videoWidth;
            this.canvasElement.height = videoHeight;
        }
    }
    
    /**
     * Traite un code-barres détecté
     * @param {Object} barcode - Code-barres détecté
     * @returns {Object} - Données du code QR traité
     * @private
     */
    _processDetectedBarcode(barcode) {
        // Vérifier si le format est pris en charge
        const supportedFormats = ['qr_code'];
        if (!supportedFormats.includes(barcode.format)) {
            return null;
        }
        
        // Extraire les données pertinentes
        const result = {
            rawValue: barcode.rawValue,
            format: barcode.format,
            boundingBox: barcode.boundingBox,
            cornerPoints: barcode.cornerPoints,
            timestamp: Date.now(),
            source: 'camera'
        };
        
        return result;
    }
    
    /**
     * Nettoie les ressources utilisées par le scanner
     */
    destroy() {
        // Arrêter le scan
        this.stop();
        
        // Supprimer les éléments DOM
        if (this.videoElement && this.videoElement.parentNode) {
            this.videoElement.parentNode.removeChild(this.videoElement);
            this.videoElement = null;
        }
        
        if (this.canvasElement && this.canvasElement.parentNode) {
            this.canvasElement.parentNode.removeChild(this.canvasElement);
            this.canvasElement = null;
            this.canvasContext = null;
        }
        
        // Réinitialiser l'état
        this.isScanning = false;
        this.lastScannedCode = '';
        this.lastScanTime = 0;
    }
}

// Fonction utilitaire pour créer un sélecteur de fichier et analyser un code QR
export function scanQRFromFile() {
    return new Promise((resolve, reject) => {
        // Créer un élément input de type fichier
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.style.display = 'none';
        
        // Gérer la sélection de fichier
        input.onchange = async (e) => {
            const file = e.target.files[0];
            
            if (!file) {
                reject(new Error('Aucun fichier sélectionné'));
                return;
            }
            
            try {
                const result = await QRScanner.scanFromFile(file);
                
                if (result) {
                    // Émettre un événement de code QR détecté
                    eventBus.emit(Events.QR_CODE_DETECTED, {
                        ...result,
                        source: 'file',
                        file: file.name
                    });
                    
                    resolve(result);
                } else {
                    reject(new Error('Aucun code QR détecté dans l\'image'));
                }
            } catch (error) {
                reject(error);
            } finally {
                // Nettoyer l'élément input
                document.body.removeChild(input);
            }
        };
        
        // Gérer l'annulation de la sélection
        input.oncancel = () => {
            document.body.removeChild(input);
            reject(new Error('Sélection de fichier annulée'));
        };
        
        // Ajouter l'élément input au document et déclencher le sélecteur de fichier
        document.body.appendChild(input);
        input.click();
    });
}

// Créer une instance globale
const qrScanner = new QRScanner({
    debug: process.env.NODE_ENV === 'development'
});

// Exposer l'instance globale
window.EquipTrack = window.EquipTrack || {};
window.EquipTrack.QRScanner = qrScanner;

// Exporter l'instance par défaut et la classe
export { qrScanner as default, QRScanner };
