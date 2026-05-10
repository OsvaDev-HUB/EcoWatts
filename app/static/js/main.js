document.addEventListener('DOMContentLoaded', () => {
    if (typeof iniciarLluviaRayos === 'function') iniciarLluviaRayos();
    if (typeof revealOnScroll === 'function') {
        revealOnScroll();
        window.addEventListener('scroll', revealOnScroll);
    }

    // Inicializar Modo Oscuro
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeButton(savedTheme);
    }

    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeButton(newTheme);
        });
    }

    function updateThemeButton(theme) {
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            if (theme === 'dark') {
                btn.innerHTML = '<i class="fas fa-sun"></i> <span>Activar Modo Claro</span>';
            } else {
                btn.innerHTML = '<i class="fas fa-moon"></i> <span>Activar Modo Oscuro</span>';
            }
        }
    }

    // Inicializar Menú Móvil
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const navbarContent = document.getElementById('navbar-content');
    
    if (mobileBtn && navbarContent) {
        mobileBtn.addEventListener('click', () => {
            navbarContent.classList.toggle('active');
            
            // Cambiar el icono de hamburguesa a cruz
            const icon = mobileBtn.querySelector('i');
            if (navbarContent.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // Cerrar menú al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!navbarContent.contains(e.target) && !mobileBtn.contains(e.target) && navbarContent.classList.contains('active')) {
                navbarContent.classList.remove('active');
                const icon = mobileBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }
});
