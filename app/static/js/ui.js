// ============ FUNCIONES DE ANIMACIÓN (LLUVIA) ============

function iniciarLluviaRayos() {
    const container = document.getElementById('bolt-rain');
    if (!container) return;

    // Crear un rayo cada 100ms para una lluvia mucho más intensa
    setInterval(() => {
        const bolt = document.createElement('i');
        bolt.className = 'fas fa-bolt falling-bolt';

        const posX = Math.random() * 100;
        const size = 0.5 + Math.random() * 1.5;
        const duration = 2 + Math.random() * 3; // Más rápidos
        const delay = Math.random() * 2;

        bolt.style.left = posX + 'vw';
        bolt.style.fontSize = size + 'rem';
        bolt.style.animationDuration = duration + 's';
        bolt.style.animationDelay = '-' + delay + 's';

        container.appendChild(bolt);

        setTimeout(() => {
            bolt.remove();
        }, 5000);
    }, 150);
}


// ============ FUNCIONES AUXILIARES ============

function mostrarNotificacion(mensaje, tipo = 'success') {
    const notif = document.getElementById('notification');
    if (!notif) return;

    const icon = tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    notif.innerHTML = `
        <i class="fas ${icon}"></i>
        <div class="notif-content">
            <span style="font-weight: 600;">${mensaje}</span>
        </div>
    `;
    
    notif.className = 'notification ' + tipo + ' show';
    
    setTimeout(() => {
        notif.classList.remove('show');
    }, 4000);
}

function revealOnScroll() {
    document.querySelectorAll('.card').forEach(card => {
        if (card.getBoundingClientRect().top < window.innerHeight - 50) {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }
    });
}

// Estilos extra para animaciones via JS
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
`;
document.head.appendChild(style);

// ============ SISTEMA DE MODALES PERSONALIZADOS ============

/**
 * Muestra un modal personalizado que devuelve una Promesa.
 * @param {Object} options { title, message, isPrompt, defaultValue, icon }
 */
function showCustomModal({ title, message, isPrompt = false, defaultValue = '', icon = 'fa-info-circle' }) {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-modal');
        const titleEl = document.getElementById('modal-title');
        const messageEl = document.getElementById('modal-message');
        const iconEl = document.getElementById('modal-icon');
        const inputContainer = document.getElementById('modal-input-container');
        const inputEl = document.getElementById('modal-input');
        const btnConfirm = document.getElementById('modal-btn-confirm');
        const btnCancel = document.getElementById('modal-btn-cancel');

        // Configurar contenido
        titleEl.textContent = title;
        messageEl.textContent = message;
        iconEl.className = 'fas ' + icon;
        
        if (isPrompt) {
            inputContainer.style.display = 'block';
            inputEl.value = defaultValue;
            setTimeout(() => inputEl.focus(), 50);
        } else {
            inputContainer.style.display = 'none';
        }

        // Mostrar modal
        modal.classList.add('show');

        // Handlers
        const onConfirm = () => {
            const value = isPrompt ? inputEl.value : true;
            cleanup();
            resolve(value);
        };

        const onCancel = () => {
            cleanup();
            resolve(null);
        };

        const cleanup = () => {
            modal.classList.remove('show');
            btnConfirm.removeEventListener('click', onConfirm);
            btnCancel.removeEventListener('click', onCancel);
        };

        btnConfirm.addEventListener('click', onConfirm);
        btnCancel.addEventListener('click', onCancel);
        
        // Cerrar al hacer clic fuera
        modal.onclick = (e) => {
            if (e.target === modal) onCancel();
        };
    });
}

// Helpers para reemplazar native methods
async function customConfirm(mensaje) {
    return await showCustomModal({
        title: 'Confirmación',
        message: mensaje,
        icon: 'fa-exclamation-triangle'
    });
}

async function customPrompt(titulo, placeholder = '') {
    return await showCustomModal({
        title: titulo,
        message: 'Por favor ingrese el dato solicitado:',
        isPrompt: true,
        defaultValue: placeholder,
        icon: 'fa-edit'
    });
}

