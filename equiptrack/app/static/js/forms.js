/**
 * EquipTrack - Gestion des formulaires
 * Fournit des fonctionnalités avancées pour les formulaires
 */

document.addEventListener('DOMContentLoaded', function() {
    // Validation des formulaires
    const forms = document.querySelectorAll('.needs-validation');
    
    // Désactiver la soumission des formulaires non valides
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            form.classList.add('was-validated');
        }, false);
        
        // Réinitialiser la validation lors de la modification des champs
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', function() {
                if (this.checkValidity()) {
                    this.classList.remove('is-invalid');
                    this.classList.add('is-valid');
                } else {
                    this.classList.remove('is-valid');
                    this.classList.add('is-invalid');
                }
            });
            
            // Gestion des champs de type fichier
            if (input.type === 'file') {
                input.addEventListener('change', function() {
                    const fileInput = this;
                    const fileLabel = this.nextElementSibling;
                    const fileName = fileInput.files[0]?.name || 'Aucun fichier choisi';
                    
                    if (fileLabel && fileLabel.classList.contains('custom-file-label')) {
                        fileLabel.textContent = fileName;
                    }
                    
                    // Validation de la taille maximale
                    const maxSize = parseInt(fileInput.getAttribute('data-max-size')) || 5 * 1024 * 1024; // 5MB par défaut
                    
                    if (fileInput.files[0] && fileInput.files[0].size > maxSize) {
                        const errorMsg = `Le fichier dépasse la taille maximale autorisée (${formatFileSize(maxSize)})`;
                        setFieldError(fileInput, errorMsg);
                        fileInput.value = '';
                        fileLabel.textContent = 'Aucun fichier choisi';
                    } else {
                        clearFieldError(fileInput);
                    }
                });
            }
        });
    });
    
    // Gestion des champs avec masque de saisie
    const maskedInputs = document.querySelectorAll('[data-mask]');
    if (maskedInputs.length > 0 && window.IMask) {
        maskedInputs.forEach(input => {
            const mask = input.getAttribute('data-mask');
            const maskOptions = {};
            
            if (mask === 'phone') {
                maskOptions.mask = '+{33} 0 00 00 00 00';
            } else if (mask === 'postal') {
                maskOptions.mask = '00000';
            } else if (mask === 'date') {
                maskOptions.mask = Date;
                maskOptions.pattern = 'Y-`m-`d';
                maskOptions.blocks = {
                    d: {
                        mask: IMask.MaskedRange,
                        from: 1,
                        to: 31,
                        maxLength: 2
                    },
                    m: {
                        mask: IMask.MaskedRange,
                        from: 1,
                        to: 12,
                        maxLength: 2
                    },
                    Y: {
                        mask: IMask.MaskedRange,
                        from: 1900,
                        to: 2999
                    }
                };
                maskOptions.format = function(date) {
                    return date.toISOString().split('T')[0];
                };
                maskOptions.parse = function(str) {
                    const [y, m, d] = str.split('-').map(Number);
                    return new Date(y, m - 1, d);
                };
vasy              }
            
            IMask(input, maskOptions);
        });
    }
    
    // Gestion des sélecteurs avec recherche
    const selectElements = document.querySelectorAll('select[data-search]');
    if (selectElements.length > 0 && window.Choices) {
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
    
    // Gestion des sélecteurs de date
    const datePickers = document.querySelectorAll('[data-datepicker]');
    if (datePickers.length > 0 && window.flatpickr) {
        datePickers.forEach(picker => {
            const options = {
                dateFormat: 'Y-m-d',
                allowInput: true,
                locale: 'fr',
                disableMobile: true
            };
            
            // Options personnalisées via data-attributes
            if (picker.dataset.minDate) {
                options.minDate = picker.dataset.minDate;
            }
            
            if (picker.dataset.maxDate) {
                options.maxDate = picker.dataset.maxDate;
            }
            
            if (picker.dataset.mode === 'range') {
                options.mode = 'range';
            } else if (picker.dataset.mode === 'multiple') {
                options.mode = 'multiple';
            }
            
            if (picker.dataset.enableTime) {
                options.enableTime = true;
                options.dateFormat = 'Y-m-d H:i';
                options.time_24hr = true;
            }
            
            flatpickr(picker, options);
        });
    }
    
    // Gestion des champs avec compteur de caractères
    const charCounters = document.querySelectorAll('[data-char-counter]');
    charCounters.forEach(counter => {
        const input = counter.querySelector('input, textarea');
        const countElement = counter.querySelector('.char-count');
        const maxLength = input.getAttribute('maxlength') || 0;
        
        if (input && countElement) {
            const updateCounter = () => {
                const currentLength = input.value.length;
                countElement.textContent = `${currentLength}/${maxLength}`;
                
                if (currentLength > maxLength * 0.8) {
                    countElement.classList.add('text-warning');
                    countElement.classList.remove('text-success');
                } else {
                    countElement.classList.add('text-success');
                    countElement.classList.remove('text-warning');
                }
                
                if (currentLength >= maxLength) {
                    countElement.classList.add('text-danger');
                    countElement.classList.remove('text-warning', 'text-success');
                }
            };
            
            input.addEventListener('input', updateCounter);
            updateCounter(); // Initialisation
        }
    });
    
    // Gestion des champs avec prévisualisation
    const previewFields = document.querySelectorAll('[data-preview-target]');
    previewFields.forEach(field => {
        const targetId = field.getAttribute('data-preview-target');
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            const updatePreview = () => {
                targetElement.textContent = field.value || field.textContent;
                
                // Mise à jour des attributs spécifiques
                if (targetElement.hasAttribute('data-preview-attr')) {
                    const attrs = targetElement.getAttribute('data-preview-attr').split(',');
                    attrs.forEach(attr => {
                        targetElement.setAttribute(attr.trim(), field.value);
                    });
                }
                
                // Mise à jour du style
                if (targetElement.hasAttribute('data-preview-style')) {
                    const styles = targetElement.getAttribute('data-preview-style').split(';');
                    styles.forEach(style => {
                        const [prop, value] = style.split(':');
                        if (prop && value) {
                            targetElement.style[prop.trim()] = value.trim();
                        }
                    });
                }
            };
            
            field.addEventListener('input', updatePreview);
            updatePreview(); // Initialisation
        }
    });
    
    // Gestion des champs avec copie dans le presse-papier
    const copyButtons = document.querySelectorAll('[data-copy-target]');
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-copy-target');
            const targetElement = document.getElementById(targetId) || 
                                  document.querySelector(`.${targetId}`);
            
            if (targetElement) {
                const textToCopy = targetElement.value || targetElement.textContent;
                
                navigator.clipboard.writeText(textToCopy).then(() => {
                    // Afficher un message de confirmation
                    const originalText = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-check"></i> Copié!';
                    this.classList.add('text-success');
                    
                    // Réinitialiser après 2 secondes
                    setTimeout(() => {
                        this.innerHTML = originalText;
                        this.classList.remove('text-success');
                    }, 2000);
                }).catch(err => {
                    console.error('Erreur lors de la copie:', err);
                    alert('Impossible de copier le texte. Veuillez réessayer.');
                });
            }
        });
    });
    
    // Gestion des champs avec génération aléatoire
    const generateButtons = document.querySelectorAll('[data-generate-for]');
    generateButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-generate-for');
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const type = this.getAttribute('data-generate-type') || 'alphanumeric';
                const length = parseInt(this.getAttribute('data-generate-length')) || 10;
                
                let result = '';
                const chars = {
                    alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
                    numeric: '0123456789',
                    alphabetic: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
                    hex: '0123456789ABCDEF',
                    password: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-='
                };
                
                const charSet = chars[type] || chars.alphanumeric;
                
                for (let i = 0; i < length; i++) {
                    result += charSet.charAt(Math.floor(Math.random() * charSet.length));
                }
                
                targetElement.value = result;
                
                // Déclencher l'événement input pour la validation
                const event = new Event('input', { bubbles: true });
                targetElement.dispatchEvent(event);
            }
        });
    });
    
    // Gestion des champs avec affichage/masquage du mot de passe
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const type = targetElement.getAttribute('type') === 'password' ? 'text' : 'password';
                targetElement.setAttribute('type', type);
                
                // Changer l'icône
                const icon = this.querySelector('i');
                if (icon) {
                    if (type === 'text') {
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                    } else {
                        icon.classList.remove('fa-eye-slash');
                        icon.classList.add('fa-eye');
                    }
                }
            }
        });
    });
    
    // Gestion des champs avec force du mot de passe
    const passwordInputs = document.querySelectorAll('input[type="password"][data-password-strength]');
    passwordInputs.forEach(input => {
        const container = input.closest('.form-group') || input.parentElement;
        let strengthMeter = container.querySelector('.password-strength');
        
        if (!strengthMeter) {
            strengthMeter = document.createElement('div');
            strengthMeter.className = 'password-strength mt-2';
            container.appendChild(strengthMeter);
        }
        
        input.addEventListener('input', function() {
            const strength = calculatePasswordStrength(this.value);
            updatePasswordStrengthMeter(strengthMeter, strength);
        });
    });
});

// Fonction pour calculer la force d'un mot de passe
function calculatePasswordStrength(password) {
    let strength = 0;
    
    // Longueur minimale
    if (password.length >= 8) strength += 1;
    
    // Contient des minuscules
    if (/[a-z]/.test(password)) strength += 1;
    
    // Contient des majuscules
    if (/[A-Z]/.test(password)) strength += 1;
    
    // Contient des chiffres
    if (/[0-9]/.test(password)) strength += 1;
    
    // Contient des caractères spéciaux
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return Math.min(Math.floor(strength / 5 * 100), 100);
}

// Fonction pour mettre à jour le compteur de force du mot de passe
function updatePasswordStrengthMeter(meter, strength) {
    meter.innerHTML = '';
    
    const progress = document.createElement('div');
    progress.className = 'progress';
    progress.style.height = '5px';
    
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.width = `${strength}%`;
    progressBar.setAttribute('role', 'progressbar');
    progressBar.setAttribute('aria-valuenow', strength);
    progressBar.setAttribute('aria-valuemin', '0');
    progressBar.setAttribute('aria-valuemax', '100');
    
    // Définir la classe en fonction de la force
    if (strength < 30) {
        progressBar.classList.add('bg-danger');
    } else if (strength < 70) {
        progressBar.classList.add('bg-warning');
    } else {
        progressBar.classList.add('bg-success');
    }
    
    progress.appendChild(progressBar);
    meter.appendChild(progress);
    
    // Ajouter un texte descriptif
    const text = document.createElement('div');
    text.className = 'small mt-1';
    
    let strengthText = '';
    if (strength < 30) {
        strengthText = 'Faible';
        text.classList.add('text-danger');
    } else if (strength < 70) {
        strengthText = 'Moyen';
        text.classList.add('text-warning');
    } else {
        strengthText = 'Fort';
        text.classList.add('text-success');
    }
    
    text.textContent = `Force du mot de passe: ${strengthText} (${strength}%)`;
    meter.appendChild(text);
}

// Fonction pour définir un message d'erreur sur un champ
function setFieldError(field, message) {
    const formGroup = field.closest('.form-group') || field.parentElement;
    
    // Supprimer les messages d'erreur existants
    const existingError = formGroup.querySelector('.invalid-feedback');
    if (existingError) {
        existingError.remove();
    }
    
    // Ajouter le message d'erreur
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;
    
    formGroup.appendChild(errorDiv);
    field.classList.add('is-invalid');
    field.classList.remove('is-valid');
}

// Fonction pour effacer les messages d'erreur d'un champ
function clearFieldError(field) {
    const formGroup = field.closest('.form-group') || field.parentElement;
    const errorDiv = formGroup.querySelector('.invalid-feedback');
    
    if (errorDiv) {
        errorDiv.remove();
    }
    
    field.classList.remove('is-invalid');
    
    if (field.checkValidity()) {
        field.classList.add('is-valid');
    }
}

// Fonction utilitaire pour formater la taille des fichiers
function formatFileSize(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Exposer les fonctions globalement
window.EquipTrack = window.EquipTrack || {};
window.EquipTrack.Forms = {
    setFieldError,
    clearFieldError,
    calculatePasswordStrength,
    formatFileSize
};
