// Cuando carga la pagina


// ============ FUNCIONES DE RESUMEN (HOME) ============

function actualizarResumenHome() {
    // Obtener cantidad de aparatos
    fetch('/api/aparatos')
        .then(r => r.json())
        .then(aparatos => {
            const el = document.getElementById('summary-aparatos');
            if (el) el.textContent = aparatos.length;
        });

    // Obtener consumo total
    fetch('/api/consumo')
        .then(r => r.json())
        .then(data => {
            const el = document.getElementById('summary-consumo');
            if (el) el.textContent = data.total_mensual_kwh.toFixed(1);
        })
        .catch(() => {
            const el = document.getElementById('summary-consumo');
            if (el) el.textContent = "0.0";
        });
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
    if (!contenedor) return;

    if (aparatos.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-microchip"></i>
                <p>No has añadido ningún aparato todavía.</p>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = aparatos.map((aparato, idx) => `
        <div class="aparato-item" style="animation: fadeIn 0.5s ease forwards ${idx * 0.1}s; opacity: 0;">
            <div class="aparato-header">
                <span class="aparato-nombre">${aparato.nombre}</span>
                <div class="aparato-actions">
                    <button onclick="editarAparato(${aparato.id}, event)" class="btn-icon btn-edit" title="Editar">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button onclick="eliminarAparato(${aparato.id})" class="btn-icon btn-delete" title="Eliminar">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <div class="aparato-body">
                <div class="aparato-spec">
                    <span class="aparato-spec-label">Potencia</span>
                    <span class="aparato-spec-value">${aparato.potencia} <small>W</small></span>
                </div>
                <div class="aparato-spec">
                    <span class="aparato-spec-label">Uso diario</span>
                    <span class="aparato-spec-value">${aparato.horas.toFixed(1)} <small>h</small></span>
                </div>
            </div>
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
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify({ nombre, potencia_w: potencia, horas_dia: horas })
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

async function eliminarAparato(id) {
    const confirmacion = await customConfirm('¿Seguro que deseas eliminar este dispositivo?');
    if (!confirmacion) return;

    fetch(`/api/aparatos/${id}`, { method: 'DELETE', headers: { 'X-CSRFToken': csrfToken } })
        .then(r => r.json())
        .then(data => {
            mostrarNotificacion(data.mensaje, 'success');
            cargarAparatos();
        })
        .catch(e => mostrarNotificacion('Error al eliminar', 'error'));
}

async function editarAparato(id, e) {
    // Buscar el nombre actual desde la lista global de aparatos guardada en el estado o desde el DOM
    // Para simplificar, buscaremos el elemento que contiene el botón presionado
    const btn = e ? e.currentTarget : (window.event ? window.event.currentTarget : null);
    if (!btn) return;
    const card = btn.closest('.aparato-item');
    const nombreActual = card.querySelector('.aparato-nombre').textContent;

    const nombre = await customPrompt('Nombre del aparato:', nombreActual);
    if (nombre === null || nombre.trim() === '') return;

    const potenciaStr = await customPrompt('Potencia (watts):', '');
    if (potenciaStr === null) return;
    const potencia = parseFloat(potenciaStr);

    const horasStr = await customPrompt('Horas diarias:', '');
    if (horasStr === null) return;
    const horas = parseFloat(horasStr);

    if (isNaN(potencia) || isNaN(horas) || potencia <= 0 || horas <= 0) {
        mostrarNotificacion('Datos inválidos para la edición', 'error');
        return;
    }

    fetch(`/api/aparatos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify({ nombre, potencia_w: potencia, horas_dia: horas })
    })
        .then(r => r.json())
        .then(data => {
            mostrarNotificacion(data.mensaje, 'success');
            cargarAparatos();
        })
        .catch(() => mostrarNotificacion('Error al editar aparato', 'error'));
}

function cargarEjemplo() {
    fetch('/api/cargar-ejemplo', { method: 'POST', headers: { 'X-CSRFToken': csrfToken } })
        .then(r => r.json())
        .then(data => {
            mostrarNotificacion('Datos de ejemplo cargados con éxito', 'success');
            // Recargar página si estamos en una sección que depende de datos
            if (window.location.pathname === '/aparatos' || window.location.pathname === '/') {
                location.reload();
            }
        })
        .catch(e => mostrarNotificacion('Error al cargar ejemplo', 'error'));
}

// ============ FUNCIONES DE CONSUMO ============

function calcularConsumo() {
    const btn = document.querySelector('.btn-large');
    if (!btn) return;

    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    btn.disabled = true;

    fetch('/api/consumo')
        .then(r => r.json())
        .then(data => {
            renderizarConsumo(data);
            btn.innerHTML = originalText;
            btn.disabled = false;
        })
        .catch(e => {
            mostrarNotificacion('Error al calcular consumo', 'error');
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
}

function renderizarConsumo(data) {
    const container = document.getElementById('consumo-results');
    if (!container) return;
    container.style.display = 'block';

    document.getElementById('kpi-diario').textContent = data.total_diario_kwh.toFixed(2);
    document.getElementById('kpi-mensual').textContent = data.total_mensual_kwh.toFixed(2);
    document.getElementById('kpi-costo').textContent = '$' + data.costo_mensual_clp.toLocaleString('es-CL');

    const tbody = document.getElementById('tabla-consumo-body');
    tbody.innerHTML = data.aparatos.map(aparato => `
        <tr>
            <td style="font-weight: 600;">${aparato.nombre}</td>
            <td>${aparato.potencia_w} W</td>
            <td>${aparato.horas_dia.toFixed(1)} h</td>
            <td>${aparato.kwh_dia.toFixed(3)}</td>
            <td style="color: var(--primary); font-weight: 600;">${aparato.kwh_mes.toFixed(2)}</td>
            <td style="font-weight: 700;">$${aparato.costo_mes.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</td>
        </tr>
    `).join('');

    generarGrafico(data.aparatos);
    cargarTopConsumidores();
}


function cargarTopConsumidores() {
    fetch('/api/top-consumidores')
        .then(r => r.json())
        .then(top => {
            const topList = document.getElementById('top-list');
            if (!topList) return;
            topList.innerHTML = top.map(item => `
                <div class="top-item">
                    <span class="top-rank">${item.rank}</span>
                    <div class="top-info">
                        <div class="top-nombre">${item.nombre}</div>
                        <div class="top-stats">
                            Representa el <span class="top-valor" style="font-size: 0.9rem;">${item.porcentaje.toFixed(1)}%</span> del gasto total
                        </div>
                    </div>
                    <div class="top-valor">${item.kwh_mes.toFixed(1)} <small>kWh</small></div>
                </div>
            `).join('');
        });
}

// ============ FUNCIONES DE SIMULACION ============

function simularReduccion() {
    const porcentaje = document.getElementById('porcentaje-reduccion').value;

    fetch('/api/simulacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify({ porcentaje_reduccion: parseFloat(porcentaje) })
    })
        .then(r => r.json())
        .then(data => renderizarSimulacion(data))
        .catch(e => mostrarNotificacion('Error en simulación', 'error'));
}

function renderizarSimulacion(data) {
    const container = document.getElementById('simulacion-results');
    if (!container) return;
    container.style.display = 'block';

    document.getElementById('sim-original').textContent = data.consumo_original.toFixed(1);
    document.getElementById('sim-nuevo').textContent = data.consumo_nuevo.toFixed(1);
    document.getElementById('sim-ahorro-kwh').textContent = data.ahorro_kwh.toFixed(1);
    document.getElementById('sim-ahorro-dinero').textContent = '$' + data.ahorro_dinero.toLocaleString('es-CL', { maximumFractionDigits: 0 });
    document.getElementById('sim-ahorro-porc').textContent = data.ahorro_porcentual.toFixed(1);
}

// ============ FUNCIONES DE RECOMENDACIONES ============

function cargarRecomendaciones() {
    fetch('/api/recomendaciones')
        .then(r => r.json())
        .then(recomendaciones => renderizarRecomendaciones(recomendaciones))
        .catch(e => mostrarNotificacion('Error al generar sugerencias', 'error'));
}

function renderizarRecomendaciones(recomendaciones) {
    const contenedor = document.getElementById('recomendaciones-container');
    if (!contenedor) return;

    contenedor.style.display = 'grid';
    contenedor.innerHTML = recomendaciones.map((rec, idx) => `
        <div class="recommendation-card" style="animation: slideInRight 0.5s ease forwards ${idx * 0.1}s; opacity: 0;">
            <div class="rec-icon">
                <i class="fas fa-lightbulb"></i>
            </div>
            <div class="rec-content">
                <h4 style="font-family: var(--font-heading); font-size: 1.25rem; margin-bottom: 1rem; color: var(--text-main);">${rec.aparato}</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <small style="color: var(--text-muted); display: block; text-transform: uppercase; font-weight: 600; font-size: 0.7rem;">Meta de Uso</small>
                        <span style="font-weight: 700; color: var(--info);">${rec.horas_recomendada.toFixed(1)}h / día</span>
                    </div>
                    <div>
                        <small style="color: var(--text-muted); display: block; text-transform: uppercase; font-weight: 600; font-size: 0.7rem;">Ahorro Mensual</small>
                        <span style="font-weight: 700; color: var(--accent);">$${rec.ahorro_dinero.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

