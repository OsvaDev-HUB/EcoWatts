document.addEventListener('DOMContentLoaded', () => {
    if (typeof iniciarLluviaRayos === 'function') iniciarLluviaRayos();
    if (typeof revealOnScroll === 'function') {
        revealOnScroll();
        window.addEventListener('scroll', revealOnScroll);
    }
});
