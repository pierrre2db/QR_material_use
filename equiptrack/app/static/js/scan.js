/**
 * EquipTrack - Scan de QR Code
 * Gère le scan de codes QR avec la caméra
 */

document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('qr-video');
    const canvas = document.getElementById('qr-canvas');
    const qrResult = document.getElementById('qr-result');
    const btnScan = document.getElementById('btn-scan');
    const btnStop = document.getElementById('btn-stop');
    const qrCodeInput = document.getElementById('qr_code');
    const scanForm = document.getElementById('scanForm');
    let stream = null;
    let scanner = null;
    let isScanning = false;

    // Vérifier si la page contient les éléments nécessaires
    if (!video || !btnScan || !btnStop || !qrCodeInput || !scanForm) {
        console.log('Éléments de scan non trouvés sur la page');
        return;
    }

    // Démarrer le scan
    async function startScanning() {
        if (isScanning) return;

        try {
            // Demander l'accès à la caméra
            stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });
            
            // Configurer la vidéo
            video.srcObject = stream;
            video.setAttribute('playsinline', true); // Nécessaire pour iOS
            
            // Attendre que la vidéo soit prête
            await new Promise((resolve) => {
                video.onloadedmetadata = () => {
                    video.play();
                    resolve();
                };
            });
            
            // Mettre à jour l'interface
            btnScan.classList.add('d-none');
            btnStop.classList.remove('d-none');
            qrResult.textContent = 'Recherche de code QR...';
            qrResult.className = 'text-muted mt-2';
            
            // Démarrer la boucle de scan
            isScanning = true;
            scanFrame();
            
        } catch (err) {
            console.error('Erreur lors de l\'accès à la caméra:', err);
            qrResult.textContent = 'Erreur: ' + (err.message || 'Impossible d\'accéder à la caméra');
            qrResult.className = 'text-danger mt-2';
            stopScanning();
        }
    }

    // Arrêter le scan
    function stopScanning() {
        isScanning = false;
        
        // Arrêter le flux vidéo
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        
        // Réinitialiser la vidéo
        video.srcObject = null;
        
        // Mettre à jour l'interface
        btnScan.classList.remove('d-none');
        btnStop.classList.add('d-none');
    }

    // Fonction de scan d'une image
    function scanFrame() {
        if (!isScanning) return;

        // Vérifier si la vidéo est prête
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            // Ajuster la taille du canvas à la vidéo
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // Dessiner l'image de la vidéo sur le canvas
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Obtenir les données d'image du canvas
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            
            // Détecter le code QR
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });
            
            // Si un code QR est détecté
            if (code) {
                handleQrCodeDetected(code.data);
                return; // Sortir de la boucle de scan
            }
        }
        
        // Continuer la boucle de scan
        if (isScanning) {
            requestAnimationFrame(scanFrame);
        }
    }
    
    // Gérer la détection d'un code QR
    function handleQrCodeDetected(code) {
        // Mettre à jour l'interface
        qrCodeInput.value = code;
        qrResult.textContent = `Code détecté: ${code}`;
        qrResult.className = 'text-success mt-2';
        
        // Émettre un son de succès
        playSuccessSound();
        
        // Soumettre automatiquement le formulaire après un court délai
        setTimeout(() => {
            if (scanForm) {
                scanForm.submit();
            }
        }, 500);
        
        // Arrêter le scan après un court délai
        setTimeout(stopScanning, 1000);
    }
    
    // Jouer un son de succès
    function playSuccessSound() {
        const audio = new Audio('/static/sounds/beep.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Impossible de jouer le son:', e));
    }
    
    // Événements
    btnScan.addEventListener('click', startScanning);
    btnStop.addEventListener('click', stopScanning);
    
    // Nettoyage lors de la fermeture de la page
    window.addEventListener('beforeunload', stopScanning);
    
    // Gestion du mode sombre
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        // Vérifier les préférences système
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
        
        // Fonction pour basculer le mode sombre
        function toggleDarkMode(enable) {
            if (enable) {
                document.documentElement.setAttribute('data-bs-theme', 'dark');
                localStorage.setItem('darkMode', 'enabled');
            } else {
                document.documentElement.removeAttribute('data-bs-theme');
                localStorage.setItem('darkMode', 'disabled');
            }
        }
        
        // Vérifier le stockage local pour les préférences de l'utilisateur
        const darkMode = localStorage.getItem('darkMode');
        if (darkMode === 'enabled' || (darkMode === null && prefersDarkScheme.matches)) {
            toggleDarkMode(true);
            darkModeToggle.checked = true;
        }
        
        // Écouter les changements de préférences système
        prefersDarkScheme.addEventListener('change', (e) => {
            if (localStorage.getItem('darkMode') === null) {
                toggleDarkMode(e.matches);
            }
        });
        
        // Gérer le clic sur le bouton de bascule
        darkModeToggle.addEventListener('change', function() {
            toggleDarkMode(this.checked);
        });
    }
});

// Permettre d'appeler startScanning depuis la console pour le débogage
window.startScanning = startScanning;
window.stopScanning = stopScanning;
