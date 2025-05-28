/**
 * EquipTrack - Main JavaScript
 * Gère les interactions de l'interface utilisateur
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialisation des tooltips Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialisation des popovers Bootstrap
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    const popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Gestion des messages flash
    const flashMessages = document.querySelectorAll('.alert');
    if (flashMessages.length > 0) {
        flashMessages.forEach(flash => {
            setTimeout(() => {
                flash.classList.add('fade');
                setTimeout(() => flash.remove(), 150);
            }, 5000);
        });
    }

    // Initialisation des selects avec des recherches
    const selectElements = document.querySelectorAll('select[data-search]');
    if (selectElements.length > 0) {
        selectElements.forEach(select => {
            new Choices(select, {
                searchEnabled: true,
                itemSelectText: '',
                shouldSort: false,
                classNames: {
                    containerInner: 'choices__inner',
                    input: 'choices__input',
                    list: 'choices__list',
                    item: 'choices__item',
                },
            });
        });
    }

    // Gestion du formulaire de recherche
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        const searchInput = searchForm.querySelector('input[type="search"]');
        searchForm.addEventListener('submit', function(e) {
            if (!searchInput.value.trim()) {
                e.preventDefault();
            }
        });
    }

    // Gestion des confirmations de suppression
    const deleteButtons = document.querySelectorAll('[data-confirm-delete]');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.')) {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });
    });

    // Gestion des onglets dans l'URL
    const url = new URL(window.location.href);
    const tab = url.searchParams.get('tab');
    if (tab) {
        const tabElement = document.querySelector(`[data-bs-target="#${tab}"]`);
        if (tabElement) {
            const tabInstance = new bootstrap.Tab(tabElement);
            tabInstance.show();
        }
    }

    // Mise à jour de l'URL lors du changement d'onglet
    const tabElements = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabElements.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (e) {
            const target = e.target.getAttribute('data-bs-target').substring(1);
            const url = new URL(window.location.href);
            url.searchParams.set('tab', target);
            window.history.pushState({}, '', url);
        });
    });

    // Gestion du formulaire de scan de QR code
    const scanForm = document.getElementById('scanForm');
    if (scanForm) {
        const video = document.getElementById('qr-video');
        const canvas = document.getElementById('qr-canvas');
        const qrResult = document.getElementById('qr-result');
        const btnScan = document.getElementById('btn-scan');
        const btnStop = document.getElementById('btn-stop');
        const qrCodeInput = document.getElementById('qr_code');
        let scanner = null;

        // Démarrer le scan
        if (btnScan) {
            btnScan.addEventListener('click', async function() {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: 'environment' },
                        audio: false
                    });
                    
                    video.srcObject = stream;
                    video.play();
                    
                    btnScan.classList.add('d-none');
                    btnStop.classList.remove('d-none');
                    
                    scanner = setInterval(scanQRCode, 500);
                    
                } catch (err) {
                    console.error('Erreur lors de l\'accès à la caméra:', err);
                    alert('Impossible d\'accéder à la caméra. Veuillez vérifier les autorisations.');
                }
            });
        }

        // Arrêter le scan
        if (btnStop) {
            btnStop.addEventListener('click', function() {
                stopScanning();
            });
        }

        // Fonction pour scanner le QR code
        function scanQRCode() {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                const canvasElement = document.createElement('canvas');
                const context = canvasElement.getContext('2d');
                
                // Ajuster la taille du canvas à la vidéo
                canvasElement.width = video.videoWidth;
                canvasElement.height = video.videoHeight;
                
                // Dessiner l'image de la vidéo sur le canvas
                context.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
                
                // Obtenir les données d'image du canvas
                const imageData = context.getImageData(0, 0, canvasElement.width, canvasElement.height);
                
                // Détecter le code QR
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'dontInvert',
                });
                
                // Si un code QR est détecté
                if (code) {
                    qrCodeInput.value = code.data;
                    qrResult.textContent = `Code détecté: ${code.data}`;
                    qrResult.classList.remove('text-danger');
                    qrResult.classList.add('text-success');
                    
                    // Soumettre automatiquement le formulaire après un court délai
                    setTimeout(() => {
                        scanForm.submit();
                    }, 500);
                    
                    stopScanning();
                } else {
                    qrResult.textContent = 'Aucun code QR détecté';
                    qrResult.classList.remove('text-success');
                    qrResult.classList.add('text-danger');
                }
            }
        }
        
        // Fonction pour arrêter le scan
        function stopScanning() {
            if (video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
                video.srcObject = null;
            }
            
            if (scanner) {
                clearInterval(scanner);
                scanner = null;
            }
            
            btnScan.classList.remove('d-none');
            btnStop.classList.add('d-none');
        }
        
        // Nettoyage lors de la fermeture de la page
        window.addEventListener('beforeunload', stopScanning);
    }

    // Gestion du formulaire d'ajout d'équipement
    const equipmentForm = document.getElementById('equipmentForm');
    if (equipmentForm) {
        const qrCodeInput = document.getElementById('qr_code');
        const generateQrBtn = document.getElementById('generateQrBtn');
        
        // Générer un code QR aléatoire
        if (generateQrBtn && qrCodeInput) {
            generateQrBtn.addEventListener('click', function() {
                const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
                qrCodeInput.value = `EQ-${randomString}`;
            });
        }
        
        // Validation du formulaire
        equipmentForm.addEventListener('submit', function(e) {
            let isValid = true;
            const requiredFields = equipmentForm.querySelectorAll('[required]');
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('is-invalid');
                } else {
                    field.classList.remove('is-invalid');
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                e.stopPropagation();
                
                // Faire défiler jusqu'au premier champ invalide
                const firstInvalid = equipmentForm.querySelector('.is-invalid');
                if (firstInvalid) {
                    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstInvalid.focus();
                }
            }
            
            equipmentForm.classList.add('was-validated');
        });
    }

    // Gestion des aperçus d'images téléchargées
    const fileInputs = document.querySelectorAll('input[type="file"][data-preview]');
    fileInputs.forEach(input => {
        const previewId = input.getAttribute('data-preview');
        const previewElement = document.getElementById(previewId);
        
        if (previewElement) {
            input.addEventListener('change', function() {
                const file = this.files[0];
                if (file) {
                    const reader = new FileReader();
                    
                    reader.onload = function(e) {
                        if (previewElement.tagName === 'IMG') {
                            previewElement.src = e.target.result;
                        } else {
                            previewElement.style.backgroundImage = `url(${e.target.result})`;
                        }
                        previewElement.classList.remove('d-none');
                    };
                    
                    reader.readAsDataURL(file);
                } else {
                    previewElement.classList.add('d-none');
                }
            });
        }
    });

    // Gestion des cartes cliquables
    const clickableCards = document.querySelectorAll('.clickable-card');
    clickableCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function(e) {
            // Ne pas déclencher si l'utilisateur a cliqué sur un bouton ou un lien
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a, button, [data-bs-toggle]')) {
                return;
            }
            
            const link = this.querySelector('a[href]');
            if (link) {
                window.location.href = link.href;
            }
        });
    });

    // Gestion des filtres de tableau
    const filterInputs = document.querySelectorAll('[data-filter]');
    filterInputs.forEach(input => {
        input.addEventListener('input', function() {
            const filterValue = this.value.toLowerCase();
            const target = this.getAttribute('data-filter');
            const rows = document.querySelectorAll(target);
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(filterValue) ? '' : 'none';
            });
        });
    });

    // Gestion des sélecteurs de date
    const datePickers = document.querySelectorAll('[data-datepicker]');
    if (datePickers.length > 0 && window.flatpickr) {
        datePickers.forEach(picker => {
            flatpickr(picker, {
                dateFormat: 'Y-m-d',
                allowInput: true,
                locale: 'fr',
                disableMobile: true
            });
        });
    }

    // Gestion des graphiques avec Chart.js
    const chartElements = document.querySelectorAll('[data-chart]');
    if (chartElements.length > 0 && window.Chart) {
        chartElements.forEach(chartElement => {
            const ctx = chartElement.getContext('2d');
            const type = chartElement.getAttribute('data-chart-type') || 'bar';
            const data = JSON.parse(chartElement.getAttribute('data-chart-data'));
            const options = JSON.parse(chartElement.getAttribute('data-chart-options') || '{}');
            
            new Chart(ctx, {
                type: type,
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    },
                    ...options
                }
            });
        });
    }

    // Gestion des notifications
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '9999';
        notification.style.maxWidth = '350px';
        notification.role = 'alert';
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Supprimer automatiquement après 5 secondes
        setTimeout(() => {
            notification.classList.add('fade');
            setTimeout(() => notification.remove(), 150);
        }, 5000);
    }

    // Exposer la fonction de notification globalement
    window.showNotification = showNotification;

    // Gestion des formulaires AJAX
    const ajaxForms = document.querySelectorAll('form[data-ajax]');
    ajaxForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitButton = form.querySelector('[type="submit"]');
            const originalText = submitButton ? submitButton.innerHTML : null;
            
            // Afficher un indicateur de chargement
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Traitement...';
            }
            
            const formData = new FormData(form);
            const method = form.getAttribute('method') || 'POST';
            const action = form.getAttribute('action') || window.location.href;
            
            fetch(action, {
                method: method,
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.redirect) {
                    window.location.href = data.redirect;
                } else if (data.message) {
                    showNotification(data.message, data.status || 'success');
                    
                    if (data.status === 'success' && form.hasAttribute('data-reset-on-success')) {
                        form.reset();
                    }
                    
                    if (data.update) {
                        Object.entries(data.update).forEach(([selector, content]) => {
                            const element = document.querySelector(selector);
                            if (element) {
                                element.innerHTML = content;
                            }
                        });
                    }
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                showNotification('Une erreur est survenue. Veuillez réessayer.', 'danger');
            })
            .finally(() => {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalText;
                }
            });
        });
    });
});

// Fonction utilitaire pour formater les dates
function formatDate(dateString) {
    if (!dateString) return '';
    
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

// Fonction utilitaire pour formater les durées
function formatDuration(seconds) {
    if (!seconds) return '0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
    parts.push(`${remainingSeconds}s`);
    
    return parts.join(' ');
}

// Exposer les fonctions utilitaires globalement
window.EquipTrack = {
    formatDate,
    formatDuration,
    showNotification: window.showNotification
};
