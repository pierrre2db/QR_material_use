/**
 * EquipTrack - Gestion des tableaux
 * Fournit des fonctionnalités avancées pour les tableaux de données
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialisation des tableaux avec DataTables
    const dataTables = document.querySelectorAll('.datatable');
    
    if (dataTables.length > 0 && window.DataTable) {
        dataTables.forEach(table => {
            const options = {
                responsive: true,
                language: {
                    url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/fr-FR.json'
                },
                dom: "<'row'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6'f>>" +
                      "<'row'<'col-sm-12'tr>>" +
                      "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
                pageLength: 25,
                lengthMenu: [10, 25, 50, 100],
                order: [],
                columnDefs: [
                    { orderable: false, targets: 'no-sort' },
                    { searchable: false, targets: 'no-search' }
                ]
            };
            
            // Options spécifiques au tableau si définies dans data-*
            if (table.dataset.pageLength) {
                options.pageLength = parseInt(table.dataset.pageLength);
            }
            
            if (table.dataset.ordering !== undefined) {
                options.ordering = table.dataset.ordering === 'true';
            }
            
            if (table.dataset.searching !== undefined) {
                options.searching = table.dataset.searching === 'true';
            }
            
            if (table.dataset.buttons) {
                options.dom = "<'row'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6'fB>>" +
                           "<'row'<'col-sm-12'tr>>" +
                           "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>";
                
                options.buttons = [
                    {
                        extend: 'copy',
                        className: 'btn-sm',
                        exportOptions: {
                            columns: ':not(.no-export)'
                        }
                    },
                    {
                        extend: 'csv',
                        className: 'btn-sm',
                        exportOptions: {
                            columns: ':not(.no-export)'
                        }
                    },
                    {
                        extend: 'excel',
                        className: 'btn-sm',
                        exportOptions: {
                            columns: ':not(.no-export)'
                        }
                    },
                    {
                        extend: 'pdf',
                        className: 'btn-sm',
                        exportOptions: {
                            columns: ':not(.no-export)'
                        }
                    },
                    {
                        extend: 'print',
                        className: 'btn-sm',
                        exportOptions: {
                            columns: ':not(.no-export)'
                        }
                    }
                ];
            }
            
            // Initialiser DataTable
            const dataTable = new DataTable(table, options);
            
            // Ajouter des classes pour le style
            $(table).addClass('table-striped table-hover');
            
            // Personnaliser la recherche
            const searchInput = $(table).closest('.dataTables_wrapper').find('input[type="search"]');
            searchInput.addClass('form-control form-control-sm');
            searchInput.attr('placeholder', 'Rechercher...');
            
            // Personnaliser la sélection de la longueur de page
            const lengthSelect = $(table).closest('.dataTables_wrapper').find('select[name*="length"]');
            lengthSelect.addClass('form-select form-select-sm');
        });
    }
    
    // Fonction pour exporter un tableau au format CSV
    function exportTableToCSV(table, filename) {
        const rows = table.querySelectorAll('tr');
        const csv = [];
        
        for (let i = 0; i < rows.length; i++) {
            const row = [];
            const cols = rows[i].querySelectorAll('td, th');
            
            for (let j = 0; j < cols.length; j++) {
                // Nettoyer le texte et ajouter des guillemets pour les valeurs contenant des virgules
                let text = cols[j].innerText;
                if (text.includes(',')) {
                    text = `"${text}"`;
                }
                row.push(text);
            }
            
            csv.push(row.join(','));
        }
        
        // Télécharger le fichier
        const csvContent = 'data:text/csv;charset=utf-8,' + csv.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${filename || 'export'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Gestion des exports de tableau
    document.querySelectorAll('[data-export-csv]').forEach(btn => {
        btn.addEventListener('click', function() {
            const tableId = this.getAttribute('data-export-csv');
            const table = document.getElementById(tableId) || 
                          document.querySelector(`.${tableId}`) || 
                          document.querySelector(`#${tableId} table`);
            
            if (table) {
                const filename = this.getAttribute('data-filename') || 'export';
                exportTableToCSV(table, filename);
            }
        });
    });
    
    // Gestion des lignes cliquables
    document.querySelectorAll('table tbody tr[data-href]').forEach(row => {
        row.style.cursor = 'pointer';
        row.addEventListener('click', function(e) {
            // Ne pas déclencher si l'utilisateur a cliqué sur un lien ou un bouton
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a, button, [data-bs-toggle]')) {
                return;
            }
            
            window.location.href = this.getAttribute('data-href');
        });
    });
    
    // Gestion des cases à cocher "Tout sélectionner"
    document.querySelectorAll('.select-all-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const target = this.getAttribute('data-target');
            const checkboxes = document.querySelectorAll(target);
            
            checkboxes.forEach(cb => {
                cb.checked = this.checked;
                cb.dispatchEvent(new Event('change'));
            });
        });
    });
    
    // Gestion des actions groupées sur les lignes sélectionnées
    document.querySelectorAll('[data-batch-action]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const action = this.getAttribute('data-batch-action');
            const target = this.getAttribute('data-batch-target');
            const checkboxes = document.querySelectorAll(`${target}:checked`);
            
            if (checkboxes.length === 0) {
                alert('Veuillez sélectionner au moins un élément.');
                return;
            }
            
            if (confirm(`Êtes-vous sûr de vouloir effectuer cette action sur ${checkboxes.length} élément(s) ?`)) {
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = action;
                
                // Ajouter un jeton CSRF si disponible
                const csrfToken = document.querySelector('meta[name="csrf-token"]');
                if (csrfToken) {
                    const csrfInput = document.createElement('input');
                    csrfInput.type = 'hidden';
                    csrfInput.name = 'csrf_token';
                    csrfInput.value = csrfToken.getAttribute('content');
                    form.appendChild(csrfInput);
                }
                
                // Ajouter les cases cochées
                checkboxes.forEach(checkbox => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = 'ids[]';
                    input.value = checkbox.value;
                    form.appendChild(input);
                });
                
                // Soumettre le formulaire
                document.body.appendChild(form);
                form.submit();
                document.body.removeChild(form);
            }
        });
    });
    
    // Gestion des filtres de colonnes
    document.querySelectorAll('.table-filter').forEach(filter => {
        filter.addEventListener('keyup', function() {
            const columnIndex = parseInt(this.getAttribute('data-column'));
            const tableId = this.getAttribute('data-table');
            const table = document.getElementById(tableId);
            
            if (!table) return;
            
            const filterValue = this.value.toLowerCase();
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                const cell = row.cells[columnIndex];
                if (cell) {
                    const text = cell.textContent.toLowerCase();
                    row.style.display = text.includes(filterValue) ? '' : 'none';
                }
            });
        });
    });
    
    // Gestion du tri personnalisé
    document.querySelectorAll('[data-sort]').forEach(header => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', function() {
            const table = this.closest('table');
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const columnIndex = Array.from(this.parentElement.children).indexOf(this);
            const isNumeric = this.getAttribute('data-sort-type') === 'numeric';
            const isDate = this.getAttribute('data-sort-type') === 'date';
            const sortOrder = this.getAttribute('data-sort-order') || 'asc';
            
            // Trier les lignes
            rows.sort((a, b) => {
                let aValue = a.cells[columnIndex]?.textContent.trim();
                let bValue = b.cells[columnIndex]?.textContent.trim();
                
                if (isNumeric) {
                    aValue = parseFloat(aValue.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
                    bValue = parseFloat(bValue.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
                    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
                } else if (isDate) {
                    aValue = new Date(aValue) || new Date(0);
                    bValue = new Date(bValue) || new Date(0);
                    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
                } else {
                    return sortOrder === 'asc' 
                        ? aValue.localeCompare(bValue, 'fr', {sensitivity: 'base'}) 
                        : bValue.localeCompare(aValue, 'fr', {sensitivity: 'base'});
                }
            });
            
            // Inverser l'ordre pour le prochain clic
            this.setAttribute('data-sort-order', sortOrder === 'asc' ? 'desc' : 'asc');
            
            // Mettre à jour l'icône de tri
            table.querySelectorAll('th').forEach(th => {
                th.classList.remove('sorting-asc', 'sorting-desc');
                th.removeAttribute('aria-sort');
            });
            
            this.classList.add(sortOrder === 'asc' ? 'sorting-asc' : 'sorting-desc');
            this.setAttribute('aria-sort', sortOrder === 'asc' ? 'ascending' : 'descending');
            
            // Réorganiser les lignes
            rows.forEach(row => tbody.appendChild(row));
        });
    });
});

// Fonction utilitaire pour formater les nombres
function formatNumber(number, decimals = 2, decPoint = ',', thousandsSep = ' ') {
    if (isNaN(number)) return '';
    
    number = parseFloat(number);
    const sign = number < 0 ? '-' : '';
    number = Math.abs(number);
    
    const n = !isFinite(+number) ? 0 : +number;
    const prec = !isFinite(+decimals) ? 0 : Math.abs(decimals);
    const sep = (typeof thousandsSep === 'undefined') ? ',' : thousandsSep;
    const dec = (typeof decPoint === 'undefined') ? '.' : decPoint;
    let s = '';
    
    const toFixedFix = function(n, prec) {
        const k = Math.pow(10, prec);
        return '' + Math.round(n * k) / k;
    };
    
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
    
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, sep);
    }
    
    if ((s[1] || '').length < prec) {
        s[1] = s[1] || '';
        s[1] += new Array(prec - s[1].length + 1).join('0');
    }
    
    return sign + (s[1] ? s.join(dec) : s[0]);
}

// Exposer les fonctions globalement
window.EquipTrack = window.EquipTrack || {};
window.EquipTrack.Tables = {
    formatNumber,
    exportTableToCSV: function(table, filename) {
        exportTableToCSV(table, filename);
    }
};
