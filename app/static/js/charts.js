function generarGrafico(aparatos) {
    const canvas = document.getElementById('grafico-consumo');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (graficoInstance) graficoInstance.destroy();

    graficoInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: aparatos.map(a => a.nombre),
            datasets: [{
                label: 'Consumo Mensual (kWh)',
                data: aparatos.map(a => a.kwh_mes),
                backgroundColor: aparatos.map((_, i) => COLORS.chart[i % COLORS.chart.length]),
                borderRadius: 6,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: '#0f172a', padding: 12, cornerRadius: 8 }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                x: { grid: { display: false } }
            }
        }
    });
}
