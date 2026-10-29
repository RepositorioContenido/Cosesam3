/**
 * OVA SENA - Modal de recursos
 *
 * Abre cada recurso de content.json en el modal de 3 columnas:
 *   1. imagen de apoyo        -> resource.modalImage
 *   2. encabezado + slides    -> resource.label, resource.code, resource.typeLabel, resource.slides
 *   3. pestañas de secciones  -> una por slide (las dibuja slides-engine.js)
 *
 * Accesibilidad: foco al abrir y al cerrar, Escape y clic en el fondo cierran,
 * y los cambios se anuncian a lectores de pantalla.
 */

class WoveModalManager {
  constructor(options = {}) {
    this.overlay = document.getElementById('modalOverlay');
    this.container = document.getElementById('modalContainer');
    this.backdrop = document.getElementById('modalBackdrop');
    this.btnClose = document.getElementById('btnModalClose');

    this.modalGrid = document.getElementById('ramsModalGrid');
    this.colContent = document.getElementById('ramsColContent');
    this.slidesContainer = document.getElementById('modalSlidesContainer');
    this.subtopicsList = document.getElementById('modalSubtopicsList');

    this.supportImg = document.getElementById('modalSupportImage');
    this.codeSolid = document.getElementById('modalCodeSolid');
    this.codeOutline = document.getElementById('modalCodeOutline');
    this.labelBadge = document.getElementById('modalLabelBadge');
    this.resourceTitle = document.getElementById('modalResourceTitle');
    this.modalTopUnit = document.getElementById('modalTopDate');
    this.modalTopCourse = document.getElementById('modalTopCourse');

    // Se llama al abrir un recurso para marcarlo como visto (barra de progreso).
    this.onOpen = options.onOpen || null;

    this.currentResource = null;
    this.lastFocusedElement = null;

    this.btnClose?.addEventListener('click', () => this.close());
    this.backdrop?.addEventListener('click', () => this.close());
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) this.close();
    });
  }

  isOpen() {
    return !!this.overlay && !this.overlay.hidden;
  }

  open(resource) {
    if (!resource || !this.overlay) return;
    this.lastFocusedElement = document.activeElement;
    this.currentResource = resource;

    this.overlay.hidden = false;
    document.body.style.overflow = 'hidden';

    this.renderHeader(resource);
    this.renderSlides(resource);

    setTimeout(() => this.container?.focus(), 50);

    if (typeof this.onOpen === 'function') this.onOpen(resource);
    this.announce(`Abierto el recurso ${resource.number}: ${resource.shortTitle || resource.code || ''}`);
  }

  close() {
    if (!this.isOpen()) return;

    // Vaciar las slides detiene cualquier video o audio que estuviera sonando.
    if (this.slidesContainer) this.slidesContainer.innerHTML = '';

    this.overlay.hidden = true;
    document.body.style.overflow = '';
    if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
      this.lastFocusedElement.focus();
    }
    this.announce('Modal cerrado. De vuelta en el menú.');
  }

  // Barra superior, imagen de apoyo y títulos del recurso
  renderHeader(resource) {
    if (this.modalTopUnit) this.modalTopUnit.textContent = window.courseData?.unitCode || '';
    if (this.modalTopCourse) this.modalTopCourse.textContent = resource.typeLabel || resource.shortTitle || '';

    if (this.supportImg) {
      this.supportImg.src = resource.modalImage || '';
      this.supportImg.alt = resource.modalImageAlt || '';
    }

    if (this.labelBadge) this.labelBadge.textContent = resource.label || '';

    if (this.codeSolid && this.codeOutline) {
      // Título del modal ("code"). Un título largo (frase o pregunta) se muestra
      // completo y sólido; uno corto conserva el juego sólido / contorno.
      const code = resource.code || '';
      const isLongTitle = code.length > 24;
      this.codeSolid.parentElement?.classList.toggle('is-long-title', isLongTitle);
      if (isLongTitle || !code.includes(' ')) {
        this.codeSolid.textContent = code;
        this.codeOutline.textContent = '';
      } else {
        const [first, ...rest] = code.split(' ');
        this.codeSolid.textContent = `${first} `;
        this.codeOutline.textContent = rest.join(' ');
      }
    }

    if (this.resourceTitle) {
      this.resourceTitle.textContent = resource.typeLabel || resource.shortTitle || '';
      // "hideModalSubtitle": true oculta el subtítulo azul bajo el título.
      this.resourceTitle.hidden = !!resource.hideModalSubtitle;
    }
  }

  renderSlides(resource) {
    const slides = Array.isArray(resource.slides) ? resource.slides : [];
    if (slides.length === 0) {
      console.warn(`[OVA] El recurso ${resource.id} no tiene "slides" en content.json.`);
    }
    window.modalSlidesEngine?.init(this.colContent, this.slidesContainer, this.subtopicsList, slides);

    // Cada recurso abre desde el principio (en móvil el que hace scroll es la grilla).
    if (this.modalGrid) this.modalGrid.scrollTop = 0;
    if (this.colContent) this.colContent.scrollTop = 0;
  }

  announce(text) {
    const announcer = document.getElementById('a11y-announcer');
    if (announcer) announcer.textContent = text;
  }
}

window.WoveModalManager = WoveModalManager;
