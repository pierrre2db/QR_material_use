/**
 * EquipTrack - Gestion des graphiques
 * Fournit des fonctionnalités pour créer et gérer des graphiques avec Chart.js
 */

// Configuration par défaut pour les graphiques
const defaultChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
        mode: 'index',
        intersect: false,
    },
    plugins: {
        legend: {
            position: 'bottom',
            labels: {
                boxWidth: 12,
                padding: 20,
                usePointStyle: true,
            }
        },
        tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: { size: 13 },
            bodyFont: { size: 13 },
            padding: 12,
            usePointStyle: true,
            callbacks: {
                label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== null) {
                        label += context.parsed.y.toLocaleString();
                    }
                    return label;
                }
            }
        }
    },
    scales: {
        x: {
            grid: {
                display: false,
                drawBorder: false
            },
            ticks: {
                color: '#6c757d'
            }
        },
        y: {
            beginAtZero: true,
            grid: {
                borderDash: [3, 3],
                color: 'rgba(0, 0, 0, 0.05)',
                drawBorder: false
            },
            ticks: {
                color: '#6c757d',
                callback: function(value) {
                    return value.toLocaleString();
                }
            }
        }
    }
};

// Thèmes de couleurs pour les graphiques
const chartColors = {
    primary: 'rgba(13, 110, 253, 0.9)',
    secondary: 'rgba(108, 117, 125, 0.9)',
    success: 'rgba(25, 135, 84, 0.9)',
    info: 'rgba(13, 202, 240, 0.9)',
    warning: 'rgba(255, 193, 7, 0.9)',
    danger: 'rgba(220, 53, 69, 0.9)',
    light: 'rgba(248, 249, 250, 0.9)',
    dark: 'rgba(33, 37, 41, 0.9)'
};

// Fonction pour initialiser tous les graphiques de la page
document.addEventListener('DOMContentLoaded', function() {
    initCharts();
    initSparklines();
    initGauges();
    initMaps();
});

/**
 * Initialise tous les graphiques avec l'attribut data-chart
 */
function initCharts() {
    const chartElements = document.querySelectorAll('[data-chart]');
    
    if (chartElements.length === 0 || typeof Chart === 'undefined') {
        return;
    }
    
    chartElements.forEach(element => {
        const type = element.getAttribute('data-chart-type') || 'line';
        const data = parseChartData(element);
        const options = parseChartOptions(element);
        
        // Créer le graphique
        new Chart(element, {
            type: type,
            data: data,
            options: options
        });
    });
}

/**
 * Analyse les données du graphique à partir des attributs data-*
 */
function parseChartData(element) {
    const labels = JSON.parse(element.getAttribute('data-labels') || '[]');
    const datasets = [];
    
    // Récupérer les séries de données
    const seriesElements = element.querySelectorAll('[data-series]');
    
    if (seriesElements.length > 0) {
        // Si des éléments HTML sont utilisés pour les données
        seriesElements.forEach((seriesEl, index) => {
            const label = seriesEl.getAttribute('data-label') || `Série ${index + 1}`;
            const data = JSON.parse(seriesEl.getAttribute('data-series') || '[]');
            const color = seriesEl.getAttribute('data-color') || Object.values(chartColors)[index % Object.keys(chartColors).length];
            const borderColor = seriesEl.getAttribute('data-border-color') || color;
            const backgroundColor = seriesEl.getAttribute('data-background-color') || 
                                 color.replace('0.9', '0.2');
            
            datasets.push({
                label: label,
                data: data,
                borderColor: borderColor,
                backgroundColor: backgroundColor,
                borderWidth: 2,
                pointBackgroundColor: borderColor,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: borderColor,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointHitRadius: 10,
                pointBorderWidth: 2,
                fill: seriesEl.getAttribute('data-fill') === 'true'
            });
        });
    } else {
        // Si les données sont dans des attributs data-*
        const series = JSON.parse(element.getAttribute('data-series') || '[]');
        
        series.forEach((data, index) => {
            const color = Object.values(chartColors)[index % Object.keys(chartColors).length];
            
            datasets.push({
                label: data.label || `Série ${index + 1}`,
                data: data.data || [],
                borderColor: data.borderColor || color,
                backgroundColor: data.backgroundColor || color.replace('0.9', '0.2'),
                borderWidth: 2,
                pointBackgroundColor: data.pointBackgroundColor || color,
                pointBorderColor: data.pointBorderColor || '#fff',
                pointHoverBackgroundColor: data.pointHoverBackgroundColor || '#fff',
                pointHoverBorderColor: data.pointHoverBorderColor || color,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointHitRadius: 10,
                pointBorderWidth: 2,
                fill: data.fill !== undefined ? data.fill : false,
                tension: data.tension || 0.1
            });
        });
    }
    
    return { labels, datasets };
}

/**
 * Analyse les options du graphique à partir des attributs data-*
 */
function parseChartOptions(element) {
    const options = JSON.parse(JSON.stringify(defaultChartOptions));
    
    // Type de graphique spécifique
    const type = element.getAttribute('data-chart-type') || 'line';
    
    // Options spécifiques au type de graphique
    switch (type) {
        case 'bar':
            options.scales.x.grid.display = false;
            options.scales.x.offset = true;
            options.scales.x.ticks.autoSkip = true;
            options.scales.x.ticks.maxRotation = 0;
            options.barPercentage = 0.6;
            options.categoryPercentage = 0.8;
            break;
            
        case 'horizontalBar':
            options.indexAxis = 'y';
            options.scales.x.grid.display = true;
            options.scales.y.grid.display = false;
            options.scales.x.ticks.beginAtZero = true;
            break;
            
        case 'pie':
        case 'doughnut':
        case 'polarArea':
            options.cutout = type === 'doughnut' ? '60%' : '0%';
            options.radius = type === 'polarArea' ? '85%' : '70%';
            break;
            
        case 'radar':
            options.scales.r = {
                angleLines: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.1)'
                },
                suggestedMin: 0,
                ticks: {
                    display: false,
                    beginAtZero: true
                }
            };
            break;
    }
    
    // Personnalisation des options via data-options
    const dataOptions = element.getAttribute('data-options');
    if (dataOptions) {
        try {
            const customOptions = JSON.parse(dataOptions);
            mergeDeep(options, customOptions);
        } catch (e) {
            console.error('Erreur lors de l\'analyse des options du graphique:', e);
        }
    }
    
    return options;
}

/**
 * Initialise les graphiques sparkline
 */
function initSparklines() {
    const sparklines = document.querySelectorAll('[data-sparkline]');
    
    if (sparklines.length === 0 || typeof Chart === 'undefined') {
        return;
    }
    
    sparklines.forEach(element => {
        const type = element.getAttribute('data-sparkline-type') || 'line';
        const data = JSON.parse(element.getAttribute('data-sparkline') || '[]');
        const color = element.getAttribute('data-color') || chartColors.primary;
        
        new Chart(element, {
            type: type,
            data: {
                labels: Array(data.length).fill(''),
                datasets: [{
                    data: data,
                    borderColor: color,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.3,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false
                    }
                },
                scales: {
                    x: { display: false },
                    y: { display: false }
                },
                layout: {
                    padding: {
                        top: 2,
                        right: 2,
                        bottom: 2,
                        left: 2
                    }
                }
            }
        });
    });
}

/**
 * Initialise les jauges
 */
function initGauges() {
    const gauges = document.querySelectorAll('[data-gauge]');
    
    if (gauges.length === 0 || typeof Chart === 'undefined') {
        return;
    }
    
    gauges.forEach(element => {
        const value = parseFloat(element.getAttribute('data-gauge')) || 0;
        const min = parseFloat(element.getAttribute('data-min')) || 0;
        const max = parseFloat(element.getAttribute('data-max')) || 100;
        const label = element.getAttribute('data-label') || '';
        const color = element.getAttribute('data-color') || chartColors.primary;
        
        // Calculer le pourcentage
        const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
        
        new Chart(element, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [percentage, 100 - percentage],
                    backgroundColor: [color, 'rgba(0, 0, 0, 0.1)'],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '80%',
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            },
            plugins: [{
                id: 'text',
                beforeDraw: function(chart) {
                    const width = chart.width;
                    const height = chart.height;
                    const ctx = chart.ctx;
                    
                    ctx.restore();
                    
                    // Afficher la valeur
                    const fontSize = (height / 3).toFixed(2);
                    ctx.font = `bold ${fontSize}px sans-serif`;
                    ctx.textBaseline = 'middle';
                    
                    const text = `${value}`;
                    const textX = Math.round((width - ctx.measureText(text).width) / 2);
                    const textY = height / 2 + 10;
                    
                    ctx.fillStyle = '#495057';
                    ctx.fillText(text, textX, textY);
                    
                    // Afficher le label
                    if (label) {
                        const labelFontSize = (fontSize / 3).toFixed(2);
                        ctx.font = `${labelFontSize}px sans-serif`;
                        
                        const labelY = textY + (fontSize / 1.5);
                        const labelX = Math.round((width - ctx.measureText(label).width) / 2);
                        
                        ctx.fillStyle = '#6c757d';
                        ctx.fillText(label, labelX, labelY);
                    }
                    
                    ctx.save();
                }
            }]
        });
    });
}

/**
 * Initialise les cartes
 */
function initMaps() {
    const mapElements = document.querySelectorAll('[data-map]');
    
    if (mapElements.length === 0 || typeof L === 'undefined') {
        return;
    }
    
    mapElements.forEach(element => {
        const center = JSON.parse(element.getAttribute('data-center') || '[46.603354, 1.888334]'); // Centre de la France par défaut
        const zoom = parseInt(element.getAttribute('data-zoom') || 6);
        const markers = JSON.parse(element.getAttribute('data-markers') || '[]');
        const tileLayer = element.getAttribute('data-tile-layer') || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const attribution = element.getAttribute('data-attribution') || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
        
        // Créer la carte
        const map = L.map(element).setView(center, zoom);
        
        // Ajouter la couche de tuiles
        L.tileLayer(tileLayer, {
            attribution: attribution,
            maxZoom: 18
        }).addTo(map);
        
        // Ajouter les marqueurs
        markers.forEach(marker => {
            const popupContent = marker.popup ? `<div class="p-2">${marker.popup}</div>` : null;
            const m = L.marker([marker.lat, marker.lng]);
            
            if (popupContent) {
                m.bindPopup(popupContent);
            }
            
            if (marker.title) {
                m.bindTooltip(marker.title, { permanent: false, direction: 'top' });
            }
            
            m.addTo(map);
        });
        
        // Ajuster la taille de la carte lorsque le conteneur change de taille
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });
        
        resizeObserver.observe(element);
    });
}

/**
 * Fusionne récursivement deux objets
 */
function mergeDeep(target, source) {
    const isObject = obj => obj && typeof obj === 'object' && !Array.isArray(obj);
    
    if (!isObject(target) || !isObject(source)) {
        return source;
    }
    
    Object.keys(source).forEach(key => {
        const targetValue = target[key];
        const sourceValue = source[key];
        
        if (isObject(targetValue) && isObject(sourceValue)) {
            target[key] = mergeDeep(Object.assign({}, targetValue), sourceValue);
        } else {
            target[key] = sourceValue;
        }
    });
    
    return target;
}

// Exposer les fonctions globalement
window.EquipTrack = window.EquipTrack || {};
window.EquipTrack.Charts = {
    initCharts,
    initSparklines,
    initGauges,
    initMaps,
    chartColors,
    defaultChartOptions
};
