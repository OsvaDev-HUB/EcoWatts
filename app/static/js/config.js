// Variables globales
let graficoInstance = null;
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

// Configuración de colores para gráficos
const COLORS = {
    primary: '#0ea5e9',
    chart: ['#0ea5e9', '#38bdf8', '#7dd3fc', '#0284c7', '#0369a1', '#0c4a6e', '#bae6fd', '#e0f2fe']
};
