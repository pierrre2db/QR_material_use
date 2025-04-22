// Script principal pour l'application

document.addEventListener('DOMContentLoaded', function() {
    // Initialiser les tooltips Bootstrap
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    });

    // Initialiser les popovers Bootstrap
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl)
    });

    // Fermer automatiquement les alertes après 5 secondes
    setTimeout(function() {
        var alerts = document.querySelectorAll('.alert');
        alerts.forEach(function(alert) {
            var bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);

    // Fonction pour simuler le scan d'un QR code (pour la démo)
    window.simulateScan = function(qrData) {
        alert('QR Code scanné: ' + qrData);
        // Dans une application réelle, cela enverrait une requête à l'API
    };
});

// Fonction pour imprimer un QR code
function printQRCode() {
    var printContents = document.getElementById('qrCodePrintable').innerHTML;
    var originalContents = document.body.innerHTML;
    
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    
    // Réinitialiser les scripts Bootstrap après l'impression
    var scriptElement = document.createElement('script');
    scriptElement.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js';
    document.body.appendChild(scriptElement);
}
