/**
 * OVA SENA - Motor de slides del modal
 *
 * Dibuja las slides de cada recurso (resources[].slides en content.json), las
 * pestañas de secciones de la columna derecha y sincroniza ambas con el scroll.
 *
 * Tipos de slide ("type"):
 *   text       párrafos ("paragraphs"), imagen, pregunta destacada y botón de enlace
 *              ("variant": "cta-hero" -> tarjeta de llamado a la acción)
 *   featured   texto destacado con cita opcional
 *   question   preguntas de selección única, múltiple o abiertas ("questions")
 *   matching   emparejar columna A con columna B ("pairs")
 *   flipcard   tarjetas que giran ("cards")
 *   carousel   tarjetas en carrusel ("items")
 *   video      video de YouTube ("youtubeUrl")
 *   podcast    reproductor de audio ("audioSrc") con puntos clave ("notes")
 *   bento      cajas con etiqueta, título y texto ("boxes")
 *   accordion  desplegables ("items")
 *
 * Campos comunes: id, title, tabTitle, tabNum, icon, subtitle, paragraph, hideHeader.
 * Si a una slide le falta su lista de contenido, se muestra vacía (no hay texto
 * de ejemplo de relleno).
 */

(function (window) {
  'use strict';

  class ModalSlidesEngine {
    constructor() {
      this.slides = [];
      this.activeSlideIndex = 0;
      this.observer = null;
      this.containerEl = null;
      this.tabsListEl = null;
      this.scrollParentEl = null;
    }

    /**
     * Inicializa las slides dentro del modal
     * @param {HTMLElement} scrollParent - Elemento con scroll (.rams-col-content)
     * @param {HTMLElement} container - Contenedor de slides (.modal-slides-container)
     * @param {HTMLElement} tabsList - Lista de la Columna 3 (#modalSubtopicsList)
     * @param {Array} slidesData - Lista de objetos de slide
     */
    init(scrollParent, container, tabsList, slidesData) {
      this.destroy(); // Limpiar listeners y observadores anteriores
      this.scrollParentEl = scrollParent;
      this.containerEl = container;
      this.tabsListEl = tabsList;
      this.slides = Array.isArray(slidesData) ? slidesData : [];

      if (!this.containerEl || this.slides.length === 0) return;

      this.containerEl.innerHTML = '';
      if (this.tabsListEl) {
        this.tabsListEl.innerHTML = '';
      }

      // 1. Renderizar cada slide en el contenedor
      this.slides.forEach((slide, idx) => {
        const slideEl = this.createSlideElement(slide, idx);
        this.containerEl.appendChild(slideEl);
      });

      // 2. Renderizar los tabs en Columna 3
      if (this.tabsListEl) {
        this.renderTabs();
      }

      // 3. Configurar Acordeón Interactivo de Secciones para móvil
      this.setupSubtopicsAccordion();

      // 4. Configurar IntersectionObserver para sincronizar el scroll con la pestaña activa
      this.setupScrollObserver();

      // 5. Inicializar micro-interacciones de cada tipo de slide
      this.initInteractions();

      // Seleccionar el primer tab inicialmente
      this.setActiveTab(0);
    }

    /**
     * Genera el elemento contenedor de cada slide
     */
    createSlideElement(slide, idx) {
      const isCtaHero = slide.variant === 'cta-hero';
      const section = document.createElement('article');
      section.className = `modal-slide slide-type-${slide.type} ${isCtaHero ? 'has-cta-hero' : ''}`;
      section.id = slide.id || `modalSlide_${idx}`;
      section.dataset.slideIndex = idx;

      // Título y párrafo opcional para cada slide
      const slideTitle = slide.title || slide.tabTitle || `Slide ${idx + 1}`;
      let slideParagraph = '';
      if (slide.paragraph !== null && slide.paragraph !== false && !slide.hideParagraph) {
        slideParagraph = slide.paragraph || slide.description || slide.lead || slide.intro || '';
      }

      const iconHtml = slide.icon ? `<img src="${slide.icon}" alt="" class="slide-intro-icon" />` : '';

      const showIntroHeader = !isCtaHero && !slide.hideHeader && !slide.hideTitle && slide.title !== null && slide.title !== false && slide.title !== '';
      const subtitleHtml = slide.subtitle ? `<span class="slide-intro-subtag">${slide.subtitle}</span>` : '';
      const introHtml = showIntroHeader ? `
        <header class="slide-intro-header">
          <div class="slide-intro-title-row">
            ${iconHtml}
            <div class="slide-intro-text-col">
              ${subtitleHtml}
              <h3 class="slide-intro-title">${slideTitle}</h3>
            </div>
          </div>
          ${slideParagraph ? `<p class="slide-intro-desc">${slideParagraph}</p>` : ''}
        </header>
      ` : '';

      let bodyHtml = '';
      switch (slide.type) {
        case 'text':
          bodyHtml = this.renderTextSlide(slide);
          break;
        case 'featured':
          bodyHtml = this.renderFeaturedSlide(slide);
          break;
        case 'question':
          bodyHtml = this.renderQuestionSlide(slide, idx);
          break;
        case 'matching':
          bodyHtml = this.renderMatchingSlide(slide, idx);
          break;
        case 'flipcard':
          bodyHtml = this.renderFlipcardSlide(slide, idx);
          break;
        case 'carousel':
          bodyHtml = this.renderCarouselSlide(slide, idx);
          break;
        case 'video':
          bodyHtml = this.renderVideoSlide(slide);
          break;
        case 'podcast':
          bodyHtml = this.renderPodcastSlide(slide, idx);
          break;
        case 'bento':
          bodyHtml = this.renderBentoSlide(slide);
          break;
        case 'accordion':
          bodyHtml = this.renderAccordionSlide(slide, idx);
          break;
        default:
          bodyHtml = this.renderTextSlide(slide);
      }

      section.innerHTML = `
        ${introHtml}
        <div class="slide-body-content">${bodyHtml}</div>
      `;
      return section;
    }

    // =========================================================================
    // 1. TIPO: TEXTO (Títulos, subtítulos, iconos y párrafos)
    // =========================================================================
    renderTextSlide(slide) {
      const paragraphs = Array.isArray(slide.paragraphs) ? slide.paragraphs : (slide.text ? [slide.text] : []);

      // "variant": "cta-hero" -> tarjeta de llamado a la acción con degradado azul, textura de puntos, halo circular con icono 3D
      if (slide.variant === 'cta-hero') {
        const headline = slide.headline || slide.title || paragraphs[0] || '';
        const rest = (slide.headline || slide.title) ? paragraphs : paragraphs.slice(1);
        const heroIconSrc = slide.heroIcon || slide.icon;
        const kickerText = slide.kicker || slide.subtitle;

        return `
          <div class="slide-cta-hero">
            ${heroIconSrc ? `
              <div class="cta-hero-visual" aria-hidden="true">
                <span class="cta-hero-halo"></span>
                <img src="${heroIconSrc}" alt="" class="cta-hero-icon" />
              </div>` : ''}
            <div class="cta-hero-body">
              ${kickerText ? `<p class="cta-hero-kicker">${kickerText}</p>` : ''}
              ${headline ? `<h4 class="cta-hero-headline">${headline}</h4>` : ''}
              ${rest.map(t => `<p class="cta-hero-text">${t}</p>`).join('')}
              ${this.renderCtaButton(slide)}
            </div>
          </div>
        `;
      }

      const imageHtml = slide.image ? `
        <figure class="slide-editorial-figure">
          <div class="slide-editorial-frame">
            <img src="${slide.image}" alt="${slide.imageAlt || ''}" class="slide-editorial-img" loading="lazy" />
          </div>
          ${slide.imageCaption ? `<figcaption class="slide-editorial-caption">${slide.imageCaption}</figcaption>` : ''}
        </figure>
      ` : '';

      const highlightQuestionHtml = slide.highlightQuestion ? `
        <div class="slide-question-callout">
          <div class="question-callout-accent"></div>
          <div class="question-callout-content">
            ${slide.highlightLead ? `<p class="question-callout-lead">${slide.highlightLead}</p>` : ''}
            <p class="question-callout-text">${slide.highlightQuestion}</p>
          </div>
        </div>
      ` : '';

      const hasIntroHeader = !slide.hideHeader && !slide.hideTitle && slide.title !== null && slide.title !== false && slide.title !== '';

      return `
        <div class="slide-text-layout ${slide.image ? 'has-editorial-media' : ''} ${slide.highlightQuestion ? 'has-question-callout' : ''}">
          ${(slide.subtitle && !hasIntroHeader) ? `<h4 class="slide-subtitle">${slide.subtitle}</h4>` : ''}
          ${highlightQuestionHtml}
          ${paragraphs.length > 0 ? `
            <div class="slide-editorial-paragraphs">
              ${paragraphs.map(p => `<p class="slide-paragraph">${p}</p>`).join('')}
            </div>
          ` : ''}
          ${imageHtml}
          ${this.renderCtaButton(slide)}
        </div>
      `;
    }

    // Botón que abre un enlace en una ventana nueva ("actionUrl" / "actionText")
    renderCtaButton(slide) {
      const url = slide.actionUrl || slide.buttonUrl;
      if (!url) return '';
      const text = slide.actionText || slide.buttonText || 'Ir a la actividad';
      return `
        <div class="slide-cta-wrapper">
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="btn-slide-cta" aria-label="${text} (se abre en una ventana nueva)">
            <span>${text}</span>
            <svg class="cta-arrow-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      `;
    }

    // =========================================================================
    // 2. TIPO: CONTENIDO DESTACADO (Callout llamativo con diseño que resalta)
    // =========================================================================
    renderFeaturedSlide(slide) {
      let iconHtml = '';
      if (slide.featuredIcon) {
        iconHtml = `<img src="${slide.featuredIcon}" alt="" class="slide-featured-icon" />`;
      } else if (slide.featuredIcon === null || slide.featuredIcon === false) {
        iconHtml = '';
      } else if (slide.title && slide.icon) {
        // El icono principal ya se muestra en la cabecera del slide (donde dice Unidad 1...)
        iconHtml = '';
      } else if (slide.icon) {
        iconHtml = `<img src="${slide.icon}" alt="" class="slide-featured-icon" />`;
      } else {
        iconHtml = '<span class="slide-featured-emoji">✦</span>';
      }
      const showBadgeRow = slide.showFeaturedBadge !== false && slide.showBadge !== false && slide.badge !== null && slide.badge !== false && (slide.badge || slide.category);

      return `
        <div class="slide-featured-banner">
          <div class="featured-banner-accent-bar"></div>
          <div class="featured-banner-content">
            ${showBadgeRow ? `
              <div class="featured-badge-row">
                <span class="featured-sparkle-badge">★ DESTACADO</span>
                ${slide.category ? `<span class="featured-subtag">${slide.category}</span>` : ''}
              </div>
            ` : ''}
            <div class="featured-title-wrap">
              ${iconHtml}
              <h3 class="featured-title">${slide.featuredTitle || slide.title || ''}</h3>
            </div>
            <p class="featured-text">${slide.text || ''}</p>
            ${slide.highlightQuote ? `
              <div class="featured-quote-box">
                <span class="quote-mark">“</span>
                <p class="quote-text">${slide.highlightQuote}</p>
              </div>
            ` : ''}
            ${this.renderCtaButton(slide)}
          </div>
        </div>
      `;
    }

    // =========================================================================
    // 3. TIPO: PREGUNTAS (Individuales, seleccionables por tipo y seguidas sin tabs)
    // =========================================================================
    renderQuestionSlide(slide, sIdx) {
      const questionsList = Array.isArray(slide.questions) ? slide.questions : [];

      // Renderizar preguntas seguidas una debajo de otra (sin pestañas/tabs)
      return `
        <div class="slide-questions-wrapper" data-slide-id="${sIdx}">
          ${questionsList.map((q, qIdx) => this.renderIndividualQuestion(q, sIdx, qIdx)).join('')}
          <div class="questions-summary-card" id="qSummary_${sIdx}" hidden aria-live="polite"></div>
        </div>
      `;
    }

    /**
     * Renderiza una pregunta individual según su tipo (single, multiple, open)
     */
    renderIndividualQuestion(q, sIdx, qIdx) {
      const qType = (q.type || q.questionType || 'single').toLowerCase();
      const qNum = qIdx + 1;
      let badgeLabel = q.badge;
      if (!badgeLabel) {
        if (qType === 'single') badgeLabel = `PREGUNTA ${qNum} • SELECCIÓN ÚNICA`;
        else if (qType === 'multiple') badgeLabel = `PREGUNTA ${qNum} • MÚLTIPLE RESPUESTA`;
        else if (qType === 'open') badgeLabel = `PREGUNTA ${qNum} • RESPUESTA ABIERTA`;
        else badgeLabel = `PREGUNTA ${qNum}`;
      }

      const promptText = q.question || q.title || `Pregunta ${qNum}`;
      const hintText = q.instructions || q.hint || '';

      // Botón idéntico y estandarizado para todos los tipos de preguntas
      const unifiedButtonHtml = `
        <button type="button" class="btn-check-question btn-submit-answer" data-q-type="${qType}" aria-label="Enviar respuesta a la pregunta ${qNum}">
          <svg class="btn-send-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          <span class="btn-text">Enviar respuesta</span>
        </button>
      `;

      // TIPO 1: SELECCIÓN ÚNICA
      if (qType === 'single') {
        const options = (q.options || []).map((opt, oIdx) => {
          if (typeof opt === 'string') {
            const isCorrect = Array.isArray(q.correctAnswers) ? q.correctAnswers.includes(oIdx) : (q.correctIndex === oIdx);
            return {
              id: `opt_${sIdx}_${qIdx}_${oIdx}`,
              text: opt,
              correct: isCorrect,
              feedback: isCorrect ? (q.explanation || '¡Excelente! Respuesta correcta.') : 'Opción incorrecta. Revisa el concepto.'
            };
          }
          return {
            id: opt.id || `opt_${sIdx}_${qIdx}_${oIdx}`,
            text: opt.text || '',
            correct: !!opt.correct,
            feedback: opt.feedback || (opt.correct ? '¡Excelente! Respuesta correcta.' : 'Opción incorrecta. Revisa el concepto.')
          };
        });

        return `
          <div class="question-card question-type-single" data-q-type="single" data-q-idx="${qIdx}">
            <div class="question-card-header">
              <span class="question-type-badge badge-single">${badgeLabel}</span>
            </div>
            <h4 class="question-prompt">${promptText}</h4>
            ${hintText ? `<p class="question-hint">${hintText}</p>` : ''}
            <div class="question-options-group" data-qtype="single">
              ${options.map((opt) => `
                <label class="q-option-label" data-opt-id="${opt.id}" data-correct="${opt.correct}">
                  <input type="radio" name="q_radio_${sIdx}_${qIdx}" value="${opt.id}" class="q-radio-input">
                  <span class="q-custom-radio"></span>
                  <span class="q-option-text">${opt.text}</span>
                  <span class="q-feedback-text">${opt.feedback}</span>
                </label>
              `).join('')}
            </div>
            <div class="question-action-bar">
              ${unifiedButtonHtml}
              <div class="question-result-toast" aria-live="polite"></div>
            </div>
          </div>
        `;
      }

      // TIPO 2: MÚLTIPLE RESPUESTA
      if (qType === 'multiple') {
        const options = (q.options || []).map((opt, oIdx) => {
          if (typeof opt === 'string') {
            const isCorrect = Array.isArray(q.correctAnswers) ? q.correctAnswers.includes(oIdx) : false;
            return {
              id: `opt_m_${sIdx}_${qIdx}_${oIdx}`,
              text: opt,
              correct: isCorrect
            };
          }
          return {
            id: opt.id || `opt_m_${sIdx}_${qIdx}_${oIdx}`,
            text: opt.text || '',
            correct: !!opt.correct
          };
        });

        return `
          <div class="question-card question-type-multiple" data-q-type="multiple" data-q-idx="${qIdx}">
            <div class="question-card-header">
              <span class="question-type-badge badge-multiple">${badgeLabel}</span>
            </div>
            <h4 class="question-prompt">${promptText}</h4>
            ${hintText ? `<p class="question-hint">${hintText}</p>` : ''}
            <div class="question-options-group" data-qtype="multiple">
              ${options.map((opt) => `
                <label class="q-option-label" data-opt-id="${opt.id}" data-correct="${opt.correct}">
                  <input type="checkbox" name="q_multi_${sIdx}_${qIdx}" value="${opt.id}" class="q-check-input">
                  <span class="q-custom-checkbox"></span>
                  <span class="q-option-text">${opt.text}</span>
                </label>
              `).join('')}
            </div>
            <div class="question-action-bar">
              ${unifiedButtonHtml}
              <div class="question-result-toast" aria-live="polite"></div>
            </div>
          </div>
        `;
      }

      // TIPO 3: RESPUESTA ABIERTA
      return `
        <div class="question-card question-type-open" data-q-type="open" data-q-idx="${qIdx}">
          <div class="question-card-header">
            <span class="question-type-badge badge-open">${badgeLabel}</span>
          </div>
          <h4 class="question-prompt">${promptText}</h4>
          ${hintText ? `<p class="question-hint">${hintText}</p>` : ''}
          <div class="open-textarea-wrapper">
            <textarea class="q-open-textarea" rows="4" placeholder="${q.placeholder || 'Escribe aquí tu análisis o propuesta pedagógica...'}"></textarea>
            <div class="open-textarea-footer">
              <span class="char-counter">0 caracteres (mínimo 10)</span>
            </div>
          </div>
          <div class="question-action-bar">
            ${unifiedButtonHtml}
            <div class="question-result-toast" aria-live="polite"></div>
          </div>
        </div>
      `;
    }

    // =========================================================================
    // 4. TIPO: EMPAREJAMIENTO (Columna A con Columna B interactivo)
    // =========================================================================
    renderMatchingSlide(slide, sIdx) {
      const pairs = Array.isArray(slide.pairs) ? slide.pairs : [];

      // Barajar columna B para que no aparezca en el mismo orden que A
      const shuffledB = [...pairs].sort(() => Math.sin(sIdx * 99 + 1) - 0.5);

      return `
        <div class="matching-game-container" id="matchingGame_${sIdx}" data-total="${pairs.length}">
          <div class="matching-instruction-bar">
            <span class="matching-badge">EMPAREJAMIENTO INTERACTIVO</span>
            <span class="matching-counter">Aciertos: <strong class="match-score">0</strong> de ${pairs.length}</span>
          </div>
          <p class="matching-help">Haz clic en un concepto de la <strong>Columna A</strong> y luego en su definición correspondiente de la <strong>Columna B</strong>.</p>
          
          <div class="matching-grid">
            <!-- COLUMNA A -->
            <div class="matching-col matching-col-a">
              <h5 class="matching-col-header">Columna A: Conceptos</h5>
              <div class="matching-items-list">
                ${pairs.map(p => `
                  <button type="button" class="match-item match-item-a" data-pair-id="${p.aId}" data-target-b="${p.bId}">
                    <span class="match-tag-dot"></span>
                    <span class="match-item-text">${p.aText}</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- CONECTOR VISUAL CENTRAL -->
            <div class="matching-col-divider" aria-hidden="true">
              <div class="matching-divider-line"></div>
              <span class="matching-swap-icon">⇄</span>
            </div>

            <!-- COLUMNA B -->
            <div class="matching-col matching-col-b">
              <h5 class="matching-col-header">Columna B: Definiciones</h5>
              <div class="matching-items-list">
                ${shuffledB.map(p => `
                  <button type="button" class="match-item match-item-b" data-pair-id="${p.bId}" data-target-a="${p.aId}">
                    <span class="match-tag-dot"></span>
                    <span class="match-item-text">${p.bText}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="matching-completion-card" hidden>
            <div class="matching-success-icon">🎉</div>
            <div class="matching-success-text">
              <h4>¡Excelente trabajo!</h4>
              <p>Has emparejado todos los conceptos de manera correcta.</p>
            </div>
            <button type="button" class="btn-reset-matching">Reiniciar ejercicio</button>
          </div>
        </div>
      `;
    }

    // =========================================================================
    // 5. TIPO: FLIP CARDS (Tarjetas 3D con giro al clic)
    // =========================================================================
    renderFlipcardSlide(slide, sIdx) {
      const cards = Array.isArray(slide.cards) ? slide.cards : [];

      return `
        <div class="slide-flipcards-layout">
          <p class="flipcards-instruction">Haz clic en cualquier tarjeta para girarla y explorar el contenido detallado:</p>
          <div class="flipcards-grid">
            ${cards.map((card, cIdx) => `
              <div class="flip-card-wrapper" data-card-idx="${cIdx}" tabindex="0" role="button" aria-label="Tarjeta ${card.frontTitle}">
                <div class="flip-card-inner">
                  <!-- CARA FRONTAL -->
                  <div class="flip-card-front">
                    <div class="card-front-header">
                      <span class="card-num-badge">${card.num}</span>
                      ${card.icon ? `<img src="${card.icon}" alt="" class="card-front-icon">` : ''}
                    </div>
                    <h4 class="card-front-title">${card.frontTitle}</h4>
                    <p class="card-front-desc">${card.frontDesc}</p>
                    <div class="card-flip-prompt">
                      <span>Girar tarjeta</span>
                      <span class="flip-arrow">↻</span>
                    </div>
                  </div>

                  <!-- CARA TRASERA -->
                  <div class="flip-card-back">
                    <span class="card-back-badge">PROFUNDIZACIÓN</span>
                    <h4 class="card-back-title">${card.backTitle}</h4>
                    <p class="card-back-desc">${card.backDesc}</p>
                    <div class="card-flip-prompt back-prompt">
                      <span>Volver al anverso</span>
                      <span class="flip-arrow">↺</span>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // =========================================================================
    // 6. TIPO: CARRUSEL DE CARDS (Texto, Imagen, Icono)
    // =========================================================================
    renderCarouselSlide(slide, sIdx) {
      const items = Array.isArray(slide.items) ? slide.items : [];

      return `
        <div class="slide-carousel-component" id="slideCarousel_${sIdx}">
          <div class="slide-carousel-viewport">
            <div class="slide-carousel-track">
              ${items.map((it, iIdx) => `
                <div class="carousel-card-item ${iIdx === 0 ? 'is-active' : ''}" data-item-idx="${iIdx}">
                  ${it.image ? `
                  <div class="carousel-card-media">
                    <img src="${it.image}" alt="${it.imageAlt || ''}" class="carousel-card-img">
                    ${it.category ? `<div class="carousel-card-tag">${it.category}</div>` : ''}
                  </div>` : ''}
                  <div class="carousel-card-info">
                    <div class="carousel-card-title-row">
                      ${it.icon ? `<img src="${it.icon}" alt="" class="carousel-card-icon">` : ''}
                      <h4 class="carousel-card-title">${it.title}</h4>
                    </div>
                    ${it.desc ? `<p class="carousel-card-desc">${it.desc}</p>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- CONTROLES DEL CARRUSEL -->
          <div class="slide-carousel-nav">
            <button type="button" class="carousel-nav-btn btn-prev" aria-label="Tarjeta anterior">‹</button>
            <div class="carousel-dots-row">
              ${items.map((_, iIdx) => `
                <button type="button" class="carousel-dot ${iIdx === 0 ? 'is-active' : ''}" data-goto="${iIdx}" aria-label="Ir a tarjeta ${iIdx + 1}"></button>
              `).join('')}
            </div>
            <span class="carousel-counter-badge">01 / ${items.length.toString().padStart(2, '0')}</span>
            <button type="button" class="carousel-nav-btn btn-next" aria-label="Tarjeta siguiente">›</button>
          </div>
        </div>
      `;
    }

    // =========================================================================
    // 7. TIPO: VIDEO EMBEBIDO
    // =========================================================================
    renderVideoSlide(slide) {
      const url = slide.youtubeUrl || '';
      let videoId = '';
      if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
      else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
      else if (url.includes('/embed/')) videoId = url.split('/embed/')[1].split('?')[0];
      if (!videoId) {
        console.warn(`[OVA] La slide de video "${slide.id || slide.title || ''}" no tiene un "youtubeUrl" válido.`);
        return '';
      }
      const hasCaption = slide.title || slide.description || slide.duration;

      return `
        <div class="slide-video-container">
          <div class="video-embed-wrapper">
            <iframe
              src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1"
              title="${slide.title || 'Video'}"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              class="video-embed-iframe"
            ></iframe>
          </div>
          ${hasCaption ? `
          <div class="video-caption-bar">
            <div>
              ${slide.title ? `<h4 class="video-caption-title">${slide.title}</h4>` : ''}
              ${slide.description ? `<p class="video-caption-desc">${slide.description}</p>` : ''}
            </div>
            ${slide.duration ? `<span class="video-duration-pill">⏱ ${slide.duration}</span>` : ''}
          </div>` : ''}
        </div>
      `;
    }

    // =========================================================================
    // 8. TIPO: PODCAST INTERACTIVO
    // =========================================================================
    renderPodcastSlide(slide, sIdx) {
      const podcastIcon = slide.icon || 'assets/icons/podcast.png';
      const notes = Array.isArray(slide.notes) ? slide.notes : [];
      const hasAudio = !!slide.audioSrc;
      return `
        <div class="slide-podcast-card" id="slidePodcast_${sIdx}">
          <div class="podcast-header-row">
            <div class="podcast-cover-box">
              <img src="${podcastIcon}" alt="" class="podcast-cover-img" />
            </div>
            <div class="podcast-info-meta">
              ${slide.tag !== '' ? `<span class="podcast-pill-tag">${slide.tag || 'CÁPSULA SONORA FORMATIVA'}</span>` : ''}
              ${slide.playerTitle ? `<h4 class="podcast-main-title">${slide.playerTitle}</h4>` : ''}
              ${slide.description ? `<p class="podcast-sub-desc">${slide.description}</p>` : ''}
            </div>
          </div>

          <!-- Reproductor: usa el archivo de "audioSrc" -->
          <div class="podcast-player-console">
            ${hasAudio ? `<audio class="podcast-audio" src="${slide.audioSrc}" preload="metadata"></audio>` : ''}
            <div class="podcast-controls-row">
              <button type="button" class="btn-podcast-play" aria-label="Reproducir episodio" ${hasAudio ? '' : 'disabled title="El audio aún no está disponible"'}>
                <span class="icon-play">▶</span>
                <span class="icon-pause" hidden>❚❚</span>
              </button>
              <div class="podcast-scrubber-group">
                <div class="scrubber-track" role="slider" aria-label="Posición del audio" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
                  <div class="scrubber-progress" style="width: 0%;"></div>
                </div>
                <div class="scrubber-time-row">
                  <span class="time-current">00:00</span>
                  <span class="time-total">${hasAudio ? (slide.duration || '00:00') : 'Audio no disponible todavía'}</span>
                </div>
              </div>
              <div class="podcast-speed-control">
                <button type="button" class="btn-speed-toggle" ${hasAudio ? '' : 'disabled'}>1x</button>
              </div>
            </div>
          </div>

          ${notes.length ? `
          <div class="podcast-notes-drawer">
            <h5 class="notes-header">${slide.notesTitle || 'Puntos clave del episodio:'}</h5>
            <ul class="notes-list">
              ${notes.map(n => `<li>${n}</li>`).join('')}
            </ul>
          </div>` : ''}
        </div>
      `;
    }

    // =========================================================================
    // 9. TIPO: BENTO GRID (Cajas modulares asimétricas con texto, título y labels)
    // =========================================================================
    renderBentoSlide(slide) {
      const boxes = Array.isArray(slide.boxes) ? slide.boxes : [];

      return `
        <div class="slide-bento-grid ${slide.variant ? `bento-variant-${slide.variant}` : ''}">
          ${boxes.map(box => `
            <div class="bento-box ${box.span || 'col-1'} ${slide.variant === 'questions' || box.isQuestion ? 'bento-question-box' : ''}">
              ${box.tag ? `
                <div class="bento-box-header">
                  <span class="bento-tag bento-tag-${box.tagColor || 'blue'}">${box.tag}</span>
                </div>
              ` : ''}
              ${box.title ? `<h4 class="bento-box-title">${box.title}</h4>` : ''}
              ${box.desc ? `<p class="bento-box-desc">${box.desc}</p>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }

    // =========================================================================
    // 10. TIPO: ACORDEÓN (Desplegables fluidos interactivos)
    // =========================================================================
    renderAccordionSlide(slide, sIdx) {
      const items = Array.isArray(slide.items) ? slide.items : [];

      return `
        <div class="slide-accordion-component" id="slideAccordion_${sIdx}">
          ${items.map((it, iIdx) => `
            <div class="accordion-item ${iIdx === 0 ? 'is-open' : ''}">
              <button type="button" class="accordion-trigger" aria-expanded="${iIdx === 0 ? 'true' : 'false'}">
                <span class="accordion-title">${it.title}</span>
                <span class="accordion-icon" aria-hidden="true">▾</span>
              </button>
              <div class="accordion-panel" ${iIdx === 0 ? '' : 'hidden'}>
                <div class="accordion-content-inner">
                  <p>${it.content}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // =========================================================================
    // NAVEGACIÓN EN COLUMNA 3 (TABS DINÁMICOS)
    // =========================================================================
    renderTabs() {
      if (!this.tabsListEl) return;
      this.tabsListEl.innerHTML = '';

      this.slides.forEach((slide, idx) => {
        const tabBtn = document.createElement('button');
        tabBtn.type = 'button';
        tabBtn.className = `slide-nav-tab ${idx === 0 ? 'is-active' : ''}`;
        tabBtn.id = `slideTab_${idx}`;
        const numText = slide.tabNum || (idx + 1).toString().padStart(2, '0');
        const iconHtml = slide.icon
          ? `<span class="slide-tab-icon"><img src="${slide.icon}" alt="" class="slide-tab-icon-img" /></span>`
          : '';
        const slideTitle = slide.tabTitle || slide.title || `Slide ${numText}`;

        tabBtn.setAttribute('aria-label', `Ir a slide ${idx + 1}: ${slideTitle}`);

        tabBtn.innerHTML = `
          <div class="slide-tab-meta">
            <span class="slide-tab-num">${numText}</span>
            ${iconHtml}
          </div>
          <span class="slide-tab-title">${slideTitle}</span>
        `;

        tabBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.goToSlide(idx);
        });

        this.tabsListEl.appendChild(tabBtn);
      });
    }

    /**
     * Navega a un slide por índice y hace scroll suave
     */
    goToSlide(index) {
      if (index < 0 || index >= this.slides.length) return;
      const targetSlideEl = document.getElementById(this.slides[index].id || `modalSlide_${index}`);
      if (!targetSlideEl) return;

      this.setActiveTab(index);

      // En móvil, cerrar el acordeón para que el usuario lea la slide inmediatamente
      if (window.innerWidth <= 768) {
        this.collapseAccordion();
      }

      // Scroll suave dentro del contenedor de scroll
      targetSlideEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * Configura el comportamiento de acordeón del menú de secciones en móvil
     */
    setupSubtopicsAccordion() {
      this.accordionAside = document.getElementById('ramsColSubtopics');
      this.accordionToggle = document.getElementById('subtopicsAccordionToggle');
      this.activePill = document.getElementById('subtopicsActivePill');

      if (!this.accordionAside || !this.accordionToggle) return;

      // Estado inicial: sin clases de scroll ni expandido
      this.accordionAside.classList.remove('is-scrolled');
      this.accordionAside.classList.remove('is-expanded');
      this.accordionToggle.setAttribute('aria-expanded', 'false');

      // Click toggle en el botón de cabecera
      if (this.onAccordionToggleClick) {
        this.accordionToggle.removeEventListener('click', this.onAccordionToggleClick);
      }
      this.onAccordionToggleClick = (e) => {
        if (window.innerWidth > 768) return;
        e.preventDefault();
        e.stopPropagation();
        const willExpand = !this.accordionAside.classList.contains('is-expanded');
        this.accordionAside.classList.toggle('is-expanded', willExpand);
        this.accordionToggle.setAttribute('aria-expanded', willExpand ? 'true' : 'false');
      };
      this.accordionToggle.addEventListener('click', this.onAccordionToggleClick);

      // Al hacer scroll en el modal (#ramsModalGrid), anclar y colapsar automáticamente
      this.modalGridEl = document.getElementById('ramsModalGrid');
      if (this.modalGridEl) {
        if (this.onModalScroll) {
          this.modalGridEl.removeEventListener('scroll', this.onModalScroll);
        }
        let ticking = false;
        let lastScrollTop = 0;

        this.onModalScroll = () => {
          if (window.innerWidth > 768) return;
          if (!ticking) {
            window.requestAnimationFrame(() => {
              const st = this.modalGridEl.scrollTop;
              const scrollDelta = Math.abs(st - lastScrollTop);

              if (st > 25) {
                if (!this.accordionAside.classList.contains('is-scrolled')) {
                  this.accordionAside.classList.add('is-scrolled');
                }
                // Solo colapsar si el usuario realmente se está desplazando mientras está desplegado
                if (this.accordionAside.classList.contains('is-expanded') && scrollDelta > 15) {
                  this.collapseAccordion();
                }
              } else {
                if (this.accordionAside.classList.contains('is-scrolled')) {
                  this.accordionAside.classList.remove('is-scrolled');
                  this.accordionAside.classList.remove('is-expanded');
                  this.accordionToggle.setAttribute('aria-expanded', 'false');
                }
              }
              lastScrollTop = st;
              ticking = false;
            });
            ticking = true;
          }
        };
        this.modalGridEl.addEventListener('scroll', this.onModalScroll, { passive: true });
      }

      // Cerrar si hace clic fuera del acordeón mientras está expandido
      if (this.onOutsideClick) {
        document.removeEventListener('click', this.onOutsideClick);
      }
      this.onOutsideClick = (e) => {
        if (window.innerWidth > 768) return;
        if (this.accordionAside && this.accordionAside.classList.contains('is-expanded')) {
          if (!this.accordionAside.contains(e.target)) {
            this.collapseAccordion();
          }
        }
      };
      document.addEventListener('click', this.onOutsideClick);
    }

    collapseAccordion() {
      if (this.accordionAside && this.accordionToggle) {
        this.accordionAside.classList.remove('is-expanded');
        this.accordionToggle.setAttribute('aria-expanded', 'false');
      }
    }

    /**
     * Actualiza la pestaña activa en Columna 3
     */
    setActiveTab(index) {
      this.activeSlideIndex = index;

      // Actualizar el texto del pill en la barra del acordeón
      if (this.activePill && this.slides && this.slides[index]) {
        const slide = this.slides[index];
        const numText = slide.tabNum || (index + 1).toString().padStart(2, '0');
        const slideTitle = slide.title || slide.tabTitle || `Slide ${numText}`;
        this.activePill.textContent = `${numText} ${slideTitle}`;
      }

      if (!this.tabsListEl) return;

      const tabs = this.tabsListEl.querySelectorAll('.slide-nav-tab');
      tabs.forEach((tab, i) => {
        if (i === index) {
          tab.classList.add('is-active');
          this.revealTabInList(tab);
        } else {
          tab.classList.remove('is-active');
        }
      });
    }

    /**
     * Desplaza la pestaña activa SOLO dentro de su lista (sin mover el modal completo).
     * En móvil (una columna) la lista no tiene scroll propio y no se mueve nada.
     */
    revealTabInList(tab) {
      const candidates = [this.tabsListEl, this.tabsListEl && this.tabsListEl.parentElement];
      const scroller = candidates.find(el => el &&
        (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2) &&
        /(auto|scroll)/.test(getComputedStyle(el).overflowY + getComputedStyle(el).overflowX));
      if (!scroller) return;

      const tabRect = tab.getBoundingClientRect();
      const boxRect = scroller.getBoundingClientRect();
      if (tabRect.top < boxRect.top) {
        scroller.scrollBy({ top: tabRect.top - boxRect.top - 8, behavior: 'smooth' });
      } else if (tabRect.bottom > boxRect.bottom) {
        scroller.scrollBy({ top: tabRect.bottom - boxRect.bottom + 8, behavior: 'smooth' });
      }
      if (tabRect.left < boxRect.left) {
        scroller.scrollBy({ left: tabRect.left - boxRect.left - 8, behavior: 'smooth' });
      } else if (tabRect.right > boxRect.right) {
        scroller.scrollBy({ left: tabRect.right - boxRect.right + 8, behavior: 'smooth' });
      }
    }

    /**
     * Configura el IntersectionObserver para detectar qué slide está a la vista
     */
    setupScrollObserver() {
      if (this.observer) {
        this.observer.disconnect();
      }

      if (!('IntersectionObserver' in window)) return;

      // Si la columna de contenido no tiene scroll propio (móvil, una columna), usar el viewport
      const parentScrolls = this.scrollParentEl &&
        /(auto|scroll)/.test(getComputedStyle(this.scrollParentEl).overflowY);

      const options = {
        root: parentScrolls ? this.scrollParentEl : null,
        rootMargin: '-10% 0px -60% 0px',
        threshold: 0.1
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const slideIndex = parseInt(entry.target.dataset.slideIndex, 10);
            if (!isNaN(slideIndex) && slideIndex !== this.activeSlideIndex) {
              this.setActiveTab(slideIndex);
            }
          }
        });
      }, options);

      const slideEls = this.containerEl.querySelectorAll('.modal-slide');
      slideEls.forEach(el => this.observer.observe(el));
    }

    // =========================================================================
    // MICRO-INTERACCIONES INTERNAS DE LOS COMPONENTES
    // =========================================================================
    initInteractions() {
      this.initQuestionInteractions();
      this.initMatchingInteractions();
      this.initFlipcardsInteractions();
      this.initCarouselInteractions();
      this.initAccordionInteractions();
      this.initPodcastInteractions();
    }

    // 1. Interacciones de Preguntas (Botón unificado, evaluación global y resumen)
    initQuestionInteractions() {
      this.containerEl.querySelectorAll('.slide-questions-wrapper').forEach(wrapper => {
        const slideId = wrapper.dataset.slideId || '0';
        const cards = Array.from(wrapper.querySelectorAll('.question-card'));
        const summaryCard = wrapper.querySelector('.questions-summary-card');
        const questionResults = new Map(); // qIdx -> { answered: boolean, correct: boolean }

        cards.forEach((card, qIdx) => {
          const qType = card.dataset.qType;
          const btnSubmit = card.querySelector('.btn-submit-answer');
          const toast = card.querySelector('.question-result-toast');

          if (!btnSubmit) return;

          btnSubmit.addEventListener('click', () => {
            if (btnSubmit.classList.contains('is-answered')) return;

            // Selección Única
            if (qType === 'single') {
              const selected = card.querySelector('input[type="radio"]:checked');
              if (!selected) {
                if (toast) {
                  toast.textContent = 'Por favor selecciona una opción antes de enviar tu respuesta.';
                  toast.className = 'question-result-toast is-warning';
                }
                return;
              }

              const label = selected.closest('.q-option-label');
              const isCorrect = label?.dataset.correct === 'true';

              // Marcar visualmente
              card.querySelectorAll('.q-option-label').forEach(l => {
                l.classList.remove('is-correct', 'is-incorrect');
                if (l === label) {
                  l.classList.add(isCorrect ? 'is-correct' : 'is-incorrect');
                }
              });

              // Inhabilitar radios de esta tarjeta
              card.querySelectorAll('input[type="radio"]').forEach(r => r.disabled = true);

              if (toast) {
                toast.textContent = isCorrect 
                  ? '✓ ¡Respuesta correcta! Buen análisis conceptual.' 
                  : '✗ Respuesta incorrecta. Revisa el concepto.';
                toast.className = `question-result-toast ${isCorrect ? 'is-correct' : 'is-error'}`;
              }

              btnSubmit.classList.add('is-answered');
              btnSubmit.disabled = true;
              btnSubmit.innerHTML = `<span>✓ Respuesta enviada</span>`;

              questionResults.set(qIdx, { answered: true, correct: isCorrect });
              checkAllAnswered();
            } 
            // Múltiple Respuesta
            else if (qType === 'multiple') {
              const checkedBoxes = Array.from(card.querySelectorAll('input[type="checkbox"]:checked'));
              if (checkedBoxes.length === 0) {
                if (toast) {
                  toast.textContent = 'Por favor selecciona al menos una opción antes de enviar tu respuesta.';
                  toast.className = 'question-result-toast is-warning';
                }
                return;
              }

              let allCorrect = true;
              const totalCorrectExpected = card.querySelectorAll('.q-option-label[data-correct="true"]').length;
              let correctSelectedCount = 0;

              card.querySelectorAll('.q-option-label').forEach(l => {
                const input = l.querySelector('input');
                const isOptionCorrect = l.dataset.correct === 'true';
                l.classList.remove('is-correct', 'is-incorrect');

                if (input.checked) {
                  if (isOptionCorrect) {
                    l.classList.add('is-correct');
                    correctSelectedCount++;
                  } else {
                    l.classList.add('is-incorrect');
                    allCorrect = false;
                  }
                }
              });

              // Inhabilitar checkboxes de esta tarjeta
              card.querySelectorAll('input[type="checkbox"]').forEach(c => c.disabled = true);

              const isPerfect = allCorrect && (correctSelectedCount === totalCorrectExpected);

              if (toast) {
                toast.textContent = isPerfect 
                  ? '✓ ¡Todas las opciones correctas fueron identificadas!' 
                  : '✗ Selección incorrecta o parcial.';
                toast.className = `question-result-toast ${isPerfect ? 'is-correct' : 'is-error'}`;
              }

              btnSubmit.classList.add('is-answered');
              btnSubmit.disabled = true;
              btnSubmit.innerHTML = `<span>✓ Respuesta enviada</span>`;

              questionResults.set(qIdx, { answered: true, correct: isPerfect });
              checkAllAnswered();
            } 
            // Respuesta Abierta
            else if (qType === 'open') {
              const textarea = card.querySelector('.q-open-textarea');
              const reflectionText = textarea?.value?.trim() || '';

              if (reflectionText.length < 10) {
                if (toast) {
                  toast.textContent = 'Por favor escribe al menos 10 caracteres para registrar tu reflexión.';
                  toast.className = 'question-result-toast is-warning';
                }
                return;
              }

              if (textarea) textarea.disabled = true;

              if (toast) {
                toast.textContent = '✓ ¡Reflexión registrada exitosamente en la sesión!';
                toast.className = 'question-result-toast is-correct';
              }

              btnSubmit.classList.add('is-answered');
              btnSubmit.disabled = true;
              btnSubmit.innerHTML = `<span>✓ Respuesta enviada</span>`;

              questionResults.set(qIdx, { answered: true, correct: true });
              checkAllAnswered();
            }
          });

          // Contador dinámico en textarea abierta
          if (qType === 'open') {
            const textarea = card.querySelector('.q-open-textarea');
            const counter = card.querySelector('.char-counter');
            if (textarea && counter) {
              textarea.addEventListener('input', () => {
                const len = textarea.value.length;
                counter.textContent = `${len} caracteres ${len >= 10 ? '✓' : '(mínimo 10)'}`;
              });
            }
          }
        });

        // Comprueba si todas las preguntas del slide fueron respondidas
        const checkAllAnswered = () => {
          if (questionResults.size < cards.length) return;

          const total = cards.length;
          let correctCount = 0;
          questionResults.forEach(r => {
            if (r.correct) correctCount++;
          });

          const percentage = Math.round((correctCount / total) * 100);
          const passed = percentage >= 80;

          if (!summaryCard) return;

          summaryCard.hidden = false;
          summaryCard.className = `questions-summary-card ${passed ? 'summary-approved' : 'summary-retry'}`;

          summaryCard.innerHTML = `
            ${passed ? `<canvas class="summary-confetti-canvas" id="confetti_${slideId}"></canvas>` : ''}
            <div class="summary-content">
              <div class="summary-header-row">
                <div class="summary-badge-icon" aria-hidden="true">${passed ? '🎉' : '⚠️'}</div>
                <div class="summary-header-info">
                  <span class="summary-tag ${passed ? 'tag-success' : 'tag-warning'}">
                    ${passed ? 'ACTIVIDAD SUPERADA' : 'REQUIERE REFUERZO'} • ${percentage}%
                  </span>
                  <h3 class="summary-title">
                    ${passed ? '¡Felicitaciones! Has aprobado la actividad' : 'No alcanzaste el puntaje mínimo de aprobación (80%)'}
                  </h3>
                </div>
              </div>

              <p class="summary-desc">
                ${passed 
                  ? `Has respondido correctamente <strong>${correctCount} de ${total}</strong> preguntas (<strong>${percentage}%</strong>). ¡Excelente dominio de los conceptos abordados en esta unidad formativa!`
                  : `Obtuviste <strong>${correctCount} de ${total}</strong> respuestas correctas (<strong>${percentage}%</strong>). Para aprobar la actividad necesitas un 80% o más de aciertos. ¡No te desanimes! Repasa los conceptos y vuelve a intentarlo.`}
              </p>

              <div class="summary-meter-container">
                <div class="summary-meter-header">
                  <span>Puntaje obtenido: ${correctCount}/${total}</span>
                  <span>${percentage}% / 100% (Mínimo: 80%)</span>
                </div>
                <div class="summary-meter-bar">
                  <div class="summary-meter-fill ${passed ? 'fill-success' : 'fill-warning'}" style="width: ${percentage}%"></div>
                </div>
              </div>

              <div class="summary-actions-row">
                <button type="button" class="btn-summary-retry ${passed ? 'btn-retry-soft' : 'btn-retry-primary'}" id="btnRetry_${slideId}">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>
                  <span>${passed ? 'Repasar y reintentar' : 'Volver a intentar'}</span>
                </button>
              </div>
            </div>
          `;

          // Si aprobó con >= 80%, lanzar animación de confeti festivo
          if (passed) {
            const canvas = summaryCard.querySelector('.summary-confetti-canvas');
            if (canvas) {
              this.launchConfetti(canvas);
            }
          }

          // Botón de reintento / reinicio de la actividad
          const btnRetry = summaryCard.querySelector(`#btnRetry_${slideId}`);
          if (btnRetry) {
            btnRetry.addEventListener('click', () => {
              questionResults.clear();
              summaryCard.hidden = true;
              summaryCard.className = 'questions-summary-card';
              summaryCard.innerHTML = '';

              cards.forEach(card => {
                const qType = card.dataset.qType;
                const toast = card.querySelector('.question-result-toast');
                const btn = card.querySelector('.btn-submit-answer');

                if (toast) {
                  toast.textContent = '';
                  toast.className = 'question-result-toast';
                }

                card.querySelectorAll('.q-option-label').forEach(l => {
                  l.classList.remove('is-correct', 'is-incorrect');
                });

                if (qType === 'single') {
                  card.querySelectorAll('input[type="radio"]').forEach(r => {
                    r.checked = false;
                    r.disabled = false;
                  });
                } else if (qType === 'multiple') {
                  card.querySelectorAll('input[type="checkbox"]').forEach(c => {
                    c.checked = false;
                    c.disabled = false;
                  });
                } else if (qType === 'open') {
                  const openTextarea = card.querySelector('.q-open-textarea');
                  const charCounter = card.querySelector('.char-counter');
                  if (openTextarea) {
                    openTextarea.value = '';
                    openTextarea.disabled = false;
                  }
                  if (charCounter) charCounter.textContent = '0 caracteres (mínimo 10)';
                }

                if (btn) {
                  btn.disabled = false;
                  btn.classList.remove('is-answered');
                  btn.innerHTML = `
                    <svg class="btn-send-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                    <span class="btn-text">Enviar respuesta</span>
                  `;
                }
              });

              wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
          }

          setTimeout(() => {
            summaryCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 150);
        };
      });
    }

    /**
     * Animación de confeti festivo mediante canvas HTML5
     */
    launchConfetti(canvas) {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width || 600;
      canvas.height = rect.height || 260;

      const colors = ['#094bcb', '#3aa735', '#5ebeb6', '#E6AC5A', '#2d54a0', '#b0ca22', '#FFFFFF'];
      const particles = [];
      const particleCount = 75;

      for (let confettiIndex = 0; confettiIndex < particleCount; confettiIndex++) {
        particles.push({
          x: canvas.width * 0.5 + (Math.random() - 0.5) * 140,
          y: canvas.height * 0.35 + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 11,
          vy: -Math.random() * 7 - 3.5,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 9,
          opacity: 1,
          shape: Math.random() > 0.4 ? 'rect' : 'circle'
        });
      }

      let animId = null;
      let frame = 0;
      const maxFrames = 190;

      const animate = () => {
        frame++;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.2; // gravedad suave
          p.vx *= 0.985;
          p.rotation += p.vRot;
          if (frame > 110) {
            p.opacity = Math.max(0, 1 - (frame - 110) / 80);
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;

          if (p.shape === 'rect') {
            ctx.fillRect(-p.size * 0.5, -p.size * 0.25, p.size, p.size * 0.5);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.35, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        });

        if (frame < maxFrames) {
          animId = requestAnimationFrame(animate);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          cancelAnimationFrame(animId);
        }
      };

      animate();
    }

    // 2. Interacciones de Emparejamiento
    initMatchingInteractions() {
      this.containerEl.querySelectorAll('.matching-game-container').forEach(game => {
        let selectedA = null;
        let matchedCount = 0;
        const totalPairs = parseInt(game.dataset.total, 10) || 3;
        const scoreEl = game.querySelector('.match-score');
        const successCard = game.querySelector('.matching-completion-card');

        const itemsA = game.querySelectorAll('.match-item-a');
        const itemsB = game.querySelectorAll('.match-item-b');

        // Clic en Columna A
        itemsA.forEach(itemA => {
          itemA.addEventListener('click', () => {
            if (itemA.classList.contains('is-matched')) return;
            itemsA.forEach(it => it.classList.remove('is-selected'));
            itemA.classList.add('is-selected');
            selectedA = itemA;
          });
        });

        // Clic en Columna B
        itemsB.forEach(itemB => {
          itemB.addEventListener('click', () => {
            if (itemB.classList.contains('is-matched')) return;
            if (!selectedA) {
              window.showToast?.('Primero selecciona un concepto en la Columna A');
              return;
            }

            const targetB = selectedA.dataset.targetB;
            const bId = itemB.dataset.pairId;

            if (targetB === bId) {
              // ¡Acierto!
              selectedA.classList.remove('is-selected');
              selectedA.classList.add('is-matched');
              itemB.classList.add('is-matched');

              matchedCount++;
              if (scoreEl) scoreEl.textContent = matchedCount;
              selectedA = null;

              if (matchedCount >= totalPairs) {
                if (successCard) successCard.hidden = false;
              }
            } else {
              // Error: shake feedback
              itemB.classList.add('is-wrong');
              selectedA.classList.add('is-wrong');
              setTimeout(() => {
                itemB.classList.remove('is-wrong');
                if (selectedA) selectedA.classList.remove('is-wrong');
              }, 600);
            }
          });
        });

        // Botón reiniciar emparejamiento
        const resetBtn = game.querySelector('.btn-reset-matching');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            matchedCount = 0;
            selectedA = null;
            if (scoreEl) scoreEl.textContent = '0';
            if (successCard) successCard.hidden = true;
            game.querySelectorAll('.match-item').forEach(it => {
              it.classList.remove('is-matched', 'is-selected', 'is-wrong');
            });
          });
        }
      });
    }

    // 3. Interacciones de Flip Cards
    initFlipcardsInteractions() {
      this.containerEl.querySelectorAll('.flip-card-wrapper').forEach(card => {
        card.addEventListener('click', () => {
          card.classList.toggle('is-flipped');
        });
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            card.classList.toggle('is-flipped');
          }
        });
      });
    }

    // 4. Interacciones de Carrusel de Cards con animación fluida deslizante
    initCarouselInteractions() {
      this.containerEl.querySelectorAll('.slide-carousel-component').forEach(car => {
        const track = car.querySelector('.slide-carousel-track');
        const items = car.querySelectorAll('.carousel-card-item');
        const dots = car.querySelectorAll('.carousel-dot');
        const btnPrev = car.querySelector('.btn-prev');
        const btnNext = car.querySelector('.btn-next');
        const counterEl = car.querySelector('.carousel-counter-badge');
        let currentIdx = 0;
        let isAnimating = false;
        let autoPlayTimer = null;

        const updateCarousel = (newIdx) => {
          if (isAnimating) return;
          if (newIdx < 0) newIdx = items.length - 1;
          if (newIdx >= items.length) newIdx = 0;
          currentIdx = newIdx;
          isAnimating = true;

          // Animación fluida de deslizamiento horizontal
          if (track) {
            track.style.transform = `translateX(-${currentIdx * 100}%)`;
          }

          items.forEach((item, i) => {
            item.classList.toggle('is-active', i === currentIdx);
          });
          dots.forEach((dot, i) => {
            dot.classList.toggle('is-active', i === currentIdx);
          });

          if (counterEl) {
            counterEl.textContent = `${(currentIdx + 1).toString().padStart(2, '0')} / ${items.length.toString().padStart(2, '0')}`;
          }

          setTimeout(() => {
            isAnimating = false;
          }, 500);
        };

        const startAutoPlay = () => {
          stopAutoPlay();
          autoPlayTimer = setInterval(() => {
            updateCarousel(currentIdx + 1);
          }, 5000);
        };

        const stopAutoPlay = () => {
          if (autoPlayTimer) {
            clearInterval(autoPlayTimer);
            autoPlayTimer = null;
          }
        };

        btnPrev?.addEventListener('click', (e) => {
          e.preventDefault();
          updateCarousel(currentIdx - 1);
          startAutoPlay();
        });

        btnNext?.addEventListener('click', (e) => {
          e.preventDefault();
          updateCarousel(currentIdx + 1);
          startAutoPlay();
        });

        dots.forEach(dot => {
          dot.addEventListener('click', (e) => {
            e.preventDefault();
            const dotTargetIndex = parseInt(dot.dataset.goto, 10);
            if (!isNaN(dotTargetIndex)) {
              updateCarousel(dotTargetIndex);
              startAutoPlay();
            }
          });
        });

        // Pausar rotación automática cuando el usuario pasa el mouse por encima
        car.addEventListener('mouseenter', stopAutoPlay);
        car.addEventListener('mouseleave', startAutoPlay);

        // Soporte para gestos táctiles (swipe)
        let touchStartX = 0;
        let touchEndX = 0;
        car.addEventListener('touchstart', (e) => {
          touchStartX = e.touches[0].clientX;
          touchEndX = touchStartX;
          stopAutoPlay();
        }, { passive: true });

        car.addEventListener('touchmove', (e) => {
          touchEndX = e.touches[0].clientX;
        }, { passive: true });

        car.addEventListener('touchend', () => {
          const diff = touchEndX - touchStartX;
          if (Math.abs(diff) > 40) {
            if (diff < 0) updateCarousel(currentIdx + 1);
            else updateCarousel(currentIdx - 1);
          }
          startAutoPlay();
        });

        // Iniciar autoplay inicial
        startAutoPlay();
      });
    }

    // 5. Interacciones de Acordeón
    initAccordionInteractions() {
      this.containerEl.querySelectorAll('.slide-accordion-component').forEach(acc => {
        const items = acc.querySelectorAll('.accordion-item');
        items.forEach(item => {
          const trigger = item.querySelector('.accordion-trigger');
          const panel = item.querySelector('.accordion-panel');

          trigger.addEventListener('click', () => {
            const isOpen = item.classList.contains('is-open');

            // Cerrar los demás para comportamiento de acordeón limpio
            items.forEach(it => {
              if (it !== item) {
                it.classList.remove('is-open');
                it.querySelector('.accordion-trigger')?.setAttribute('aria-expanded', 'false');
                const collapsedPanel = it.querySelector('.accordion-panel');
                if (collapsedPanel) collapsedPanel.hidden = true;
              }
            });

            item.classList.toggle('is-open', !isOpen);
            trigger.setAttribute('aria-expanded', String(!isOpen));
            if (panel) panel.hidden = isOpen;
          });
        });
      });
    }

    // 6. Reproductor de podcast (elemento <audio> con el archivo de "audioSrc")
    initPodcastInteractions() {
      const fmt = (sec) => {
        if (!isFinite(sec)) return '00:00';
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = Math.floor(sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
      };

      this.containerEl.querySelectorAll('.slide-podcast-card').forEach(pod => {
        const audio = pod.querySelector('.podcast-audio');
        if (!audio) return; // sin "audioSrc": el reproductor queda deshabilitado

        const btnPlay = pod.querySelector('.btn-podcast-play');
        const iconPlay = pod.querySelector('.icon-play');
        const iconPause = pod.querySelector('.icon-pause');
        const track = pod.querySelector('.scrubber-track');
        const progressBar = pod.querySelector('.scrubber-progress');
        const timeCurrent = pod.querySelector('.time-current');
        const timeTotal = pod.querySelector('.time-total');
        const btnSpeed = pod.querySelector('.btn-speed-toggle');
        const speeds = [1, 1.25, 1.5, 2];

        const setPlaying = (playing) => {
          if (iconPlay) iconPlay.hidden = playing;
          if (iconPause) iconPause.hidden = !playing;
          btnPlay?.setAttribute('aria-label', playing ? 'Pausar episodio' : 'Reproducir episodio');
        };

        audio.addEventListener('loadedmetadata', () => {
          if (timeTotal) timeTotal.textContent = fmt(audio.duration);
        });
        audio.addEventListener('timeupdate', () => {
          const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
          if (progressBar) progressBar.style.width = `${pct}%`;
          track?.setAttribute('aria-valuenow', String(Math.round(pct)));
          if (timeCurrent) timeCurrent.textContent = fmt(audio.currentTime);
        });
        audio.addEventListener('play', () => setPlaying(true));
        audio.addEventListener('pause', () => setPlaying(false));
        audio.addEventListener('ended', () => setPlaying(false));
        audio.addEventListener('error', () => {
          console.warn(`[OVA] No se pudo cargar el audio "${audio.getAttribute('src')}".`);
          if (btnPlay) btnPlay.disabled = true;
          if (timeTotal) timeTotal.textContent = 'Audio no disponible';
        });

        btnPlay?.addEventListener('click', () => {
          if (audio.paused) audio.play().catch(() => {});
          else audio.pause();
        });

        btnSpeed?.addEventListener('click', () => {
          const next = speeds[(speeds.indexOf(audio.playbackRate) + 1) % speeds.length] || 1;
          audio.playbackRate = next;
          btnSpeed.textContent = `${next}x`;
        });

        track?.addEventListener('click', (e) => {
          if (!audio.duration) return;
          const rect = track.getBoundingClientRect();
          const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          audio.currentTime = ratio * audio.duration;
        });
      });
    }

    // =========================================================================
    // UTILIDADES
    // =========================================================================
    destroy() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      if (this.modalGridEl && this.onModalScroll) {
        this.modalGridEl.removeEventListener('scroll', this.onModalScroll);
        this.onModalScroll = null;
      }
      if (this.accordionToggle && this.onAccordionToggleClick) {
        this.accordionToggle.removeEventListener('click', this.onAccordionToggleClick);
        this.onAccordionToggleClick = null;
      }
      if (this.onOutsideClick) {
        document.removeEventListener('click', this.onOutsideClick);
        this.onOutsideClick = null;
      }
    }
  }

  // Exportar instancia global
  window.modalSlidesEngine = new ModalSlidesEngine();

})(window);
