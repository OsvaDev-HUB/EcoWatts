// Variables globales
let graficoInstance = null;

// Cuando carga la pagina
document.addEventListener('DOMContentLoaded', () => {
    cargarAparatos();
    
    // Actualizar valor del slider
    const slider = document.getElementById('porcentaje-reduccion');
    if (slider) {
        slider.addEventListener('input', (e) => {
            document.getElementById('valor-porcentaje').textContent = e.target.value;
        });
    }

    // Configurar botones de tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => cambiarTab(btn.dataset.tab, btn));
    });
});

// ============ FUNCIONES DE TABS ============

function cambiarTab(tabName, btnElement) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    btnElement.classList.add('active');
}

// ============ FUNCIONES DE APARATOS ============

function cargarAparatos() {
    fetch('/api/aparatos')
        .then(r => r.json())
        .then(aparatos => renderizarAparatos(aparatos))
        .catch(e => mostrarNotificacion('Error al cargar aparatos', 'error'));
}

function renderizarAparatos(aparatos) {
    const contenedor = document.getElementById('lista-aparatos');
    
    if (aparatos.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No hay aparatos agregados aun</p>
            </div>
        `;
        return;
    }
    
    contenedor.innerHTML = aparatos.map((aparato, idx) => `
        <div class="aparato-item">
            <div class="aparato-header">
                <span class="aparato-nombre">${aparato.nombre}</span>
            </div>
            <div class="aparato-body">
                <div class="aparato-spec">
                    <span class="aparato-spec-label">Potencia</span>
                    <span class="aparato-spec-value">${aparato.potencia} W</span>
                </div>
                <div class="aparato-spec">
                    <span class="aparato-spec-label">Uso diario</span>
                    <span class="aparato-spec-value">${aparato.horas.toFixed(1)} h</span>
                </div>
            </div>
            <button onclick="eliminarAparato(${idx})" class="btn-delete-circle" title="Eliminar">
                <i class="fas fa-trash"></i>
            </button>
            <button onclick="editarAparato(${idx})" class="btn-edit-circle" title="Editar">
                <i class="fas fa-pencil-alt"></i>
            </button>
        </div>
    `).join('');
}

function agregarAparato() {
    const nombre = document.getElementById('nombre-aparato').value.trim();
    const potencia = parseFloat(document.getElementById('potencia-aparato').value);
    const horas = parseFloat(document.getElementById('horas-aparato').value);
    
    if (!nombre || !potencia || !horas || potencia <= 0 || horas <= 0) {
        mostrarNotificacion('Por favor completa todos los campos correctamente', 'error');
        return;
    }
    
    fetch('/api/aparatos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nombre: nombre,
            potencia_w: potencia,
            horas_dia: horas
        })
    })
    .then(r => r.json())
    .then(data => {
        mostrarNotificacion(data.mensaje, 'success');
        document.getElementById('nombre-aparato').value = '';
        document.getElementById('potencia-aparato').value = '';
        document.getElementById('horas-aparato').value = '';
        cargarAparatos();
    })
    .catch(e => mostrarNotificacion('Error al agregar aparato', 'error'));
}

function eliminarAparato(id) {
    if (!confirm('¿Eliminar este aparato?')) return;
    
    fetch(`/api/aparatos/${id}`, { method: 'DELETE' })
        .then(r => r.json())
        .then(data => {
            mostrarNotificacion(data.mensaje, 'success');
            cargarAparatos();
        })
        .catch(e => mostrarNotificacion('Error al eliminar', 'error'));
}

function editarAparato(id) {
    const nombreActual = document.querySelectorAll('.aparato-nombre')[id]?.textContent || '';
    const nombre = prompt('Nombre del aparato:', nombreActual);
    if (nombre === null) return;

    const potenciaStr = prompt('Potencia (watts):', '');
    if (potenciaStr === null) return;
    const potencia = parseFloat(potenciaStr);

    const horasStr = prompt('Horas diarias:', '');
    if (horasStr === null) return;
    const horas = parseFloat(horasStr);

    if (!nombre || isNaN(potencia) || isNaN(horas) || potencia <= 0 || horas <= 0) {
        mostrarNotificacion('Datos invalidos para la edicion', 'error');
        return;
    }

    fetch(`/api/aparatos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre, potencia_w: potencia, horas_dia: horas })
    })
    .then(r => r.json())
    .then(data => {
        mostrarNotificacion(data.mensaje, 'success');
        cargarAparatos();
    })
    .catch(() => mostrarNotificacion('Error al editar aparato', 'error'));
}

function cargarEjemplo() {
    fetch('/api/cargar-ejemplo', { method: 'POST' })
        .then(r => r.json())
        .then(data => {
            mostrarNotificacion(data.mensaje, 'success');
            cargarAparatos();
        })
        .catch(e => mostrarNotificacion('Error al cargar ejemplo', 'error'));
}

// ============ FUNCIONES DE CONSUMO ============

function calcularConsumo() {
    fetch('/api/consumo')
        .then(r => r.json())
        .then(data => renderizarConsumo(data))
        .catch(e => mostrarNotificacion('Error al calcular consumo', 'error'));
}

function renderizarConsumo(data) {
    document.getElementById('consumo-results').style.display = 'block';
    
    document.getElementById('kpi-diario').textContent = data.total_diario_kwh.toFixed(2);
    document.getElementById('kpi-mensual').textContent = data.total_mensual_kwh.toFixed(2);
    document.getElementById('kpi-costo').textContent = '$' + data.costo_mensual_clp.toFixed(0);
    
    const tbody = document.getElementById('tabla-consumo-body');
    tbody.innerHTML = data.aparatos.map(aparato => `
        <tr>
            <td>${aparato.nombre}</td>
            <td>${aparato.potencia_w}</td>
            <td>${aparato.horas_dia.toFixed(1)}</td>
            <td>${aparato.kwh_dia.toFixed(4)}</td>
            <td>${aparato.kwh_mes.toFixed(2)}</td>
            <td>$${aparato.costo_mes.toFixed(0)}</td>
        </tr>
    `).join('');
    
    generarGrafico(data.aparatos);
    cargarTopConsumidores();
}

function generarGrafico(aparatos) {
    const canvas = document.getElementById('grafico-consumo');
    const ctx = canvas.getContext('2d');
    
    if (graficoInstance) {
        graficoInstance.destroy();
    }
    
    graficoInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: aparatos.map(a => a.nombre),
            datasets: [{
                label: 'Consumo Mensual (kWh)',
                data: aparatos.map(a => a.kwh_mes),
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(251, 146, 60, 0.8)',
                    'rgba(34, 197, 94, 0.8)'
                ],
                borderColor: [
                    'rgb(99, 102, 241)',
                    'rgb(139, 92, 246)',
                    'rgb(236, 72, 153)',
                    'rgb(251, 146, 60)',
                    'rgb(34, 197, 94)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'kWh/mes'
                    }
                }
            }
        }
    });
}

function cargarTopConsumidores() {
    fetch('/api/top-consumidores')
        .then(r => r.json())
        .then(top => {
            const topList = document.getElementById('top-list');
            topList.innerHTML = top.map(item => `
                <div class="top-item">
                    <span class="top-rank">${item.rank}</span>
                    <div class="top-info">
                        <div class="top-nombre">${item.nombre}</div>
                        <div class="top-stats">
                            <span class="top-valor">${item.kwh_mes.toFixed(2)}</span> kWh/mes 
                            (<span class="top-valor">${item.porcentaje.toFixed(1)}%</span>)
                        </div>
                    </div>
                </div>
            `).join('');
        });
}

// ============ FUNCIONES DE SIMULACION ============

function simularReduccion() {
    const porcentaje = document.getElementById('porcentaje-reduccion').value;
    
    fetch('/api/simulacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            porcentaje_reduccion: parseFloat(porcentaje)
        })
    })
    .then(r => r.json())
    .then(data => renderizarSimulacion(data))
    .catch(e => mostrarNotificacion('Error en simulacion', 'error'));
}

function renderizarSimulacion(data) {
    document.getElementById('simulacion-results').style.display = 'block';
    
    document.getElementById('sim-original').textContent = data.consumo_original.toFixed(2);
    document.getElementById('sim-nuevo').textContent = data.consumo_nuevo.toFixed(2);
    document.getElementById('sim-ahorro-kwh').textContent = data.ahorro_kwh.toFixed(2);
    document.getElementById('sim-ahorro-dinero').textContent = '$' + data.ahorro_dinero.toFixed(0);
    document.getElementById('sim-ahorro-porc').textContent = data.ahorro_porcentual.toFixed(2);
    
    mostrarNotificacion('Simulacion completada exitosamente', 'success');
}

// ============ FUNCIONES DE RECOMENDACIONES ============

function cargarRecomendaciones() {
    fetch('/api/recomendaciones')
        .then(r => r.json())
        .then(recomendaciones => renderizarRecomendaciones(recomendaciones))
        .catch(e => mostrarNotificacion('Error al generar recomendaciones', 'error'));
}

function renderizarRecomendaciones(recomendaciones) {
    const contenedor = document.getElementById('recomendaciones-container');
    
    contenedor.style.display = 'block';
    contenedor.innerHTML = recomendaciones.map((rec, idx) => `
        <div class="recommendation-card">
            <div class="rec-header">
                <div class="rec-icon">
                    <i class="fas fa-lightbulb"></i>
                </div>
                <span class="rec-aparato">${rec.aparato}</span>
            </div>
            <div class="rec-content">
                <div class="rec-item">
                    <span class="rec-label">Uso Actual</span>
                    <span class="rec-value">${rec.horas_actual.toFixed(1)}h</span>
                </div>
                <div class="rec-item">
                    <span class="rec-label">Recomendado</span>
                    <span class="rec-value">${rec.horas_recomendada.toFixed(1)}h</span>
                </div>
                <div class="rec-item">
                    <span class="rec-label">Ahorro (kWh)</span>
                    <span class="rec-value">${rec.ahorro_kwh.toFixed(2)}</span>
                </div>
                <div class="rec-item">
                    <span class="rec-label">Ahorro ($)</span>
                    <span class="rec-value">$${rec.ahorro_dinero.toFixed(0)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ============ FUNCIONES AUXILIARES ============

function mostrarNotificacion(mensaje, tipo) {
    tipo = tipo || 'success';
    const notif = document.getElementById('notification');
    notif.textContent = mensaje;
    notif.className = 'notification ' + tipo + ' show';
    
    setTimeout(() => {
        notif.classList.remove('show');
    }, 4000);
}