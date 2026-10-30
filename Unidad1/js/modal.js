/**
 * OVA SENA - Modal de recursos
 *
 * Abre cada recurso de content.json en el modal de 3 columnas:
 *   1. imagen de apoyo        -> resource.modalImage
 *   2. encabezado + slides    -> resource.label, resource.code, resource.typeLabel, resource.slides
 *   3. pestañas de secciones  -> una por slide (las dibuja slides-engine.js)
 *
 * Un recurso SIN "slides" y CON "youtubeUrl" se abre en modo video: el video
 * ocupa todo el modal, sin imagen, encabezado ni pestañas.
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
    this.videoBody = document.getElementById('modalDynamicBody');

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

  isVideoResource(resource) {
    const hasSlides = Array.isArray(resource.slides) && resource.slides.length > 0;
    return !hasSlides && !!resource.youtubeUrl;
  }

  open(resource) {
    if (!resource || !this.overlay) return;
    this.lastFocusedElement = document.activeElement;
    this.currentResource = resource;

    this.overlay.hidden = false;
    document.body.style.overflow = 'hidden';

    this.renderHeader(resource);
    if (this.isVideoResource(resource)) this.renderVideo(resource);
    else this.renderSlides(resource);

    setTimeout(() => this.container?.focus(), 50);

    if (typeof this.onOpen === 'function') this.onOpen(resource);
    this.announce(`Abierto el recurso ${resource.number}: ${resource.shortTitle || resource.code || ''}`);
  }

  close() {
    if (!this.isOpen()) return;

    // Vaciar el contenido detiene cualquier video o audio que estuviera sonando.
    this.slidesContainer?.querySelectorAll('audio').forEach(a => a.pause());
    if (this.slidesContainer) this.slidesContainer.innerHTML = '';
    if (this.videoBody) this.videoBody.innerHTML = '';

    this.overlay.hidden = true;
    document.body.style.overflow = '';
    this.container?.classList.remove('is-video-mode');

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

    this.renderCode(resource);

    if (this.resourceTitle) {
      // Subtítulo bajo el título ("typeLabel"). "hideResourceTitle": true lo oculta;
      // también se oculta solo si repite el título.
      const title = resource.typeLabel || resource.shortTitle || '';
      const norm = (t) => t.replace(/\s+/g, ' ').trim().toLowerCase();
      const code = norm(resource.code || '');
      const sub = norm(title);
      const repeats = code === sub || (code.length > 5 && sub.includes(code)) || (sub.length > 5 && code.includes(sub));
      this.resourceTitle.textContent = title;
      this.resourceTitle.style.display = (resource.hideResourceTitle || repeats || !title) ? 'none' : '';
    }
  }

  // Título grande del modal ("code").
  //  - "codeHighlight": palabra del título que se muestra en verde.
  //  - Títulos largos (más de 25 caracteres, con "?" o "isTextTitle": true) se
  //    muestran en un tamaño menor para que no ocupen demasiadas líneas.
  //  - Títulos cortos: tamaño grande, todo en el mismo color.
  renderCode(resource) {
    if (!this.codeSolid || !this.codeOutline) return;
    const code = resource.code || '';
    const box = this.codeSolid.parentElement;
    box?.classList.remove('is-text-title');
    this.codeOutline.classList.remove('code-green-solid');

    const highlight = resource.codeHighlight;
    const at = highlight ? code.toLowerCase().lastIndexOf(highlight.toLowerCase()) : -1;
    if (at >= 0) {
      this.codeSolid.textContent = `${code.slice(0, at).trimEnd()} `;
      this.codeOutline.textContent = code.slice(at);
      this.codeOutline.classList.add('code-green-solid');
      return;
    }

    if (resource.isTextTitle || code.length > 25 || code.includes('?')) {
      box?.classList.add('is-text-title');
      this.codeSolid.textContent = code;
      this.codeOutline.textContent = '';
      return;
    }

    this.codeSolid.textContent = code;
    this.codeOutline.textContent = '';
  }

  renderSlides(resource) {
    this.modalGrid?.classList.remove('is-video-pure-mode');
    this.container?.classList.remove('is-video-mode');
    if (this.videoBody) {
      this.videoBody.innerHTML = '';
      this.videoBody.style.display = 'none';
    }
    if (this.slidesContainer) this.slidesContainer.style.display = 'flex';

    const slides = Array.isArray(resource.slides) ? resource.slides : [];
    if (slides.length === 0) {
      console.warn(`[OVA] El recurso ${resource.id} no tiene "slides" ni "youtubeUrl" en content.json.`);
    }
    window.modalSlidesEngine?.init(this.colContent, this.slidesContainer, this.subtopicsList, slides);

    // Cada recurso abre desde el principio (en móvil el que hace scroll es la grilla).
    if (this.modalGrid) this.modalGrid.scrollTop = 0;
    if (this.colContent) this.colContent.scrollTop = 0;
  }

  // Modo video: solo el video de YouTube, a todo el ancho del modal
  renderVideo(resource) {
    window.modalSlidesEngine?.destroy();
    if (this.slidesContainer) {
      this.slidesContainer.innerHTML = '';
      this.slidesContainer.style.display = 'none';
    }
    if (this.subtopicsList) this.subtopicsList.innerHTML = '';
    this.modalGrid?.classList.add('is-video-pure-mode');
    this.container?.classList.add('is-video-mode');

    if (!this.videoBody) return;
    this.videoBody.style.display = 'flex';
    this.videoBody.innerHTML = `
      <div class="video-pure-theater">
        <iframe
          class="youtube-pure-iframe"
          src="${this.getYoutubeEmbedUrl(resource.youtubeUrl)}"
          title="${resource.typeLabel || resource.shortTitle || 'Video'}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen>
        </iframe>
      </div>
    `;
  }

  // Acepta enlaces de YouTube (watch, youtu.be, embed, shorts) o el ID del video
  getYoutubeEmbedUrl(url) {
    const value = String(url || '').trim();
    let videoId = '';
    if (/^[a-zA-Z0-9_-]{11}$/.test(value)) {
      videoId = value;
    } else {
      const match = value.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/);
      if (match) videoId = match[1];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : value;
  }

  announce(text) {
    const announcer = document.getElementById('a11y-announcer');
    if (announcer) announcer.textContent = text;
  }
}

window.WoveModalManager = WoveModalManager;
