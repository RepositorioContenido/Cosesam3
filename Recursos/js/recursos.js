/**
 * OVA SENA - Recursos de apoyo: menú superior y cuadrícula
 *
 * Dibuja, con la sección "recursos" de content.json:
 *   - el menú superior: pestañas por unidad y filtros por tipo de recurso
 *   - la cuadrícula de tarjetas, agrupada por tipo de recurso
 *
 * Cada tarjeta abre su enlace en una pestaña nueva y queda marcada como vista.
 * La unidad y el tipo elegidos se recuerdan en el navegador.
 *
 * Expone window.ResourceGrid con la misma interfaz que usaba el carrusel
 * (updateGeometry, drawArc, goToIndex, updateNodeStatus) para que app.js no
 * tenga que cambiar su flujo de portada -> menú.
 */
(function () {
  'use strict';

  const FILTER_KEY = 'sena_ova_recursos_filtros_v1';
  const ALL = 'todas';

  // Íconos en línea (SVG) para no depender de imágenes
  const ICONS = {
    anexos: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
    complementario: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
    glosario: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M9 7h6M9 11h4"/>',
    bibliografia: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
    pdf: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    video: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/>',
    web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    external: '<path d="M7 17L17 7M8 7h9v9"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>'
  };

  function icon(name, size) {
    const s = size || 18;
    return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
  }

  // Texto plano para atributos (aria-label, title)
  function plain(html) {
    const d = document.createElement('div');
    d.innerHTML = html || '';
    return (d.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function esc(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Dominio legible del enlace (ej. "who.int")
  function domainOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
  }

  function loadFilters() {
    try { return JSON.parse(localStorage.getItem(FILTER_KEY)) || {}; } catch (e) { return {}; }
  }
  function saveFilters(f) {
    try { localStorage.setItem(FILTER_KEY, JSON.stringify(f)); } catch (e) { /* sin almacenamiento */ }
  }

  class ResourceGrid {
    constructor(options) {
      this.rec = options.recursos || {};
      this.units = this.rec.units || [];
      this.types = this.rec.types || [];
      this.items = this.rec.items || [];
      this.buttons = Object.assign(
        { pdf: 'Abrir PDF', video: 'Ver video', web: 'Visitar sitio', reference: 'Consultar recurso' },
        this.rec.buttons || {}
      );
      this.completed = options.completed || {};
      this.onOpen = options.onOpen || null;

      this.unitTabs = document.getElementById('recUnitTabs');
      this.typeChips = document.getElementById('recTypeChips');
      this.groupsEl = document.getElementById('recGroups');
      this.emptyEl = document.getElementById('recEmpty');
      this.scrollEl = document.getElementById('recScroll');

      const saved = loadFilters();
      this.unit = this.unitExists(saved.unit) ? saved.unit : ALL;
      this.type = this.typeExists(saved.type) ? saved.type : ALL;

      this.renderIntroStatic();
      this.renderUnitTabs();
      this.render();
    }

    unitExists(id) { return id === ALL || this.units.some(u => u.id === id); }
    typeExists(id) { return id === ALL || this.types.some(t => t.id === id); }
    unitById(id) { return this.units.find(u => u.id === id); }

    // ---------------------------------------------------------------- menú
    renderIntroStatic() {
      const intro = document.getElementById('recIntro');
      if (intro) intro.textContent = this.rec.intro || '';
    }

    renderUnitTabs() {
      if (!this.unitTabs) return;
      const tabs = [{ id: ALL, label: 'Todas', title: 'Todas las unidades' }].concat(this.units);
      this.unitTabs.innerHTML = tabs.map(u => `
        <button type="button" class="topnav-tab" role="tab" data-unit="${esc(u.id)}"
          aria-selected="${u.id === this.unit}" title="${esc(u.title || u.label)}">
          <span class="topnav-tab-label">${esc(u.label)}</span>
        </button>`).join('');

      this.unitTabs.querySelectorAll('.topnav-tab').forEach(btn => {
        btn.addEventListener('click', () => this.setUnit(btn.dataset.unit));
      });

      // Flechas izquierda/derecha entre pestañas (patrón de tablist accesible)
      this.unitTabs.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const list = Array.from(this.unitTabs.querySelectorAll('.topnav-tab'));
        const i = list.indexOf(document.activeElement);
        if (i < 0) return;
        e.preventDefault();
        const next = list[(i + (e.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length];
        next.focus();
        this.setUnit(next.dataset.unit);
      });
    }

    renderTypeChips() {
      if (!this.typeChips) return;
      const inUnit = this.items.filter(it => this.unit === ALL || it.unit === this.unit);
      const chips = [{ id: ALL, label: 'Todos' }].concat(this.types);
      this.typeChips.innerHTML = chips.map(t => {
        const n = t.id === ALL ? inUnit.length : inUnit.filter(it => it.type === t.id).length;
        return `
        <button type="button" class="topnav-chip type-${esc(t.id)}" data-type="${esc(t.id)}"
          aria-pressed="${t.id === this.type}" ${n === 0 ? 'disabled' : ''}>
          ${t.id === ALL ? '' : `<span class="chip-icon">${icon(t.icon || t.id, 15)}</span>`}
          <span class="chip-label">${esc(t.label)}</span>
          <span class="chip-count">${n}</span>
        </button>`;
      }).join('');
      this.typeChips.querySelectorAll('.topnav-chip').forEach(btn => {
        btn.addEventListener('click', () => this.setType(btn.dataset.type));
      });
      // En móvil los filtros se desplazan en horizontal: mostrar el elegido
      [this.typeChips.querySelector('[aria-pressed="true"]'),
       this.unitTabs && this.unitTabs.querySelector('[aria-selected="true"]')].forEach(el => {
        if (!el) return;
        const box = el.parentElement;
        if (box.scrollWidth <= box.clientWidth) return;
        const left = el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2;
        box.scrollLeft = Math.max(0, left);
      });
    }

    setUnit(id) {
      if (!this.unitExists(id) || id === this.unit) return;
      this.unit = id;
      // Si el tipo elegido no tiene recursos en la nueva unidad, volver a "Todos"
      if (this.type !== ALL && !this.items.some(it => it.unit === id && it.type === this.type) && id !== ALL) {
        this.type = ALL;
      }
      this.unitTabs.querySelectorAll('.topnav-tab').forEach(b => {
        b.setAttribute('aria-selected', String(b.dataset.unit === id));
      });
      this.render(true);
    }

    setType(id) {
      if (!this.typeExists(id) || id === this.type) return;
      this.type = id;
      this.render(true);
    }

    // ---------------------------------------------------------- cuadrícula
    render(scrollTop) {
      saveFilters({ unit: this.unit, type: this.type });
      this.renderTypeChips();

      const unit = this.unitById(this.unit);
      const kicker = document.getElementById('recKicker');
      const heading = document.getElementById('recHeading');
      if (kicker) kicker.textContent = unit ? unit.label : 'Todas las unidades';
      if (heading) heading.textContent = unit ? unit.title : (this.rec.heading || 'Recursos de apoyo');

      const visible = this.items.filter(it =>
        (this.unit === ALL || it.unit === this.unit) && (this.type === ALL || it.type === this.type));

      const count = document.getElementById('recCount');
      if (count) count.textContent = `${visible.length} ${visible.length === 1 ? 'recurso' : 'recursos'}`;

      const groups = this.types
        .map(t => ({ type: t, list: visible.filter(it => it.type === t.id) }))
        .filter(g => g.list.length);

      this.groupsEl.innerHTML = groups.map(g => `
        <section class="rec-group type-${esc(g.type.id)}" aria-labelledby="recGroup-${esc(g.type.id)}">
          <h3 class="rec-group-title" id="recGroup-${esc(g.type.id)}">
            <span class="rec-group-icon">${icon(g.type.icon || g.type.id, 18)}</span>
            ${esc(g.type.label)}
            <span class="rec-group-count">${g.list.length}</span>
          </h3>
          <div class="rec-grid rec-grid-${esc(g.type.id)}">
            ${g.list.map(it => this.cardHtml(it)).join('')}
          </div>
        </section>`).join('');

      if (this.emptyEl) this.emptyEl.hidden = visible.length > 0;

      this.groupsEl.querySelectorAll('[data-open]').forEach(a => {
        a.addEventListener('click', () => {
          const item = this.items.find(i => i.id === a.dataset.open);
          if (item && this.onOpen) this.onOpen(item);
        });
      });

      if (scrollTop) {
        // En escritorio hace scroll la cuadrícula; en móvil, todo el escenario
        [this.scrollEl, this.scrollEl && this.scrollEl.parentElement].forEach(el => {
          if (el && el.scrollTop > 0) el.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    }

    cardHtml(it) {
      const seen = !!this.completed[it.id];
      const unit = this.unitById(it.unit);
      const unitTag = this.unit === ALL && unit
        ? `<span class="rec-unit-tag" title="${esc(unit.title || '')}">${esc(unit.label)}</span>` : '';
      const seenTag = `<span class="rec-seen" ${seen ? '' : 'hidden'} title="Recurso consultado">${icon('check', 14)}<span class="sr-only">Consultado</span></span>`;

      // Glosario: término y definición, sin enlace
      if (it.type === 'glosario') {
        return `
        <article class="rec-card rec-card-glosario" data-id="${esc(it.id)}">
          <div class="rec-card-top">${unitTag}</div>
          <h4 class="rec-term">${it.title || ''}</h4>
          <p class="rec-definition">${it.text || ''}</p>
        </article>`;
      }

      const format = it.format || 'web';
      const btnText = it.type === 'bibliografia' ? this.buttons.reference : (this.buttons[format] || this.buttons.web);
      const label = plain(it.title || it.reference);
      const link = it.url ? `
          <a class="rec-btn" href="${esc(it.url)}" target="_blank" rel="noopener noreferrer"
             data-open="${esc(it.id)}" aria-label="${esc(btnText)}: ${esc(label)} (se abre en una pestaña nueva)">
            <span>${esc(btnText)}</span>${icon('external', 15)}
          </a>` : '';

      // Bibliografía: referencia completa y botón
      if (it.type === 'bibliografia') {
        return `
        <article class="rec-card rec-card-biblio ${seen ? 'is-seen' : ''}" data-id="${esc(it.id)}">
          <div class="rec-card-top">${unitTag}${seenTag}</div>
          <p class="rec-reference">${it.reference || ''}</p>
          <div class="rec-card-foot">
            ${it.url ? `<span class="rec-domain">${esc(domainOf(it.url))}</span>` : ''}
            ${link}
          </div>
        </article>`;
      }

      // Anexos y material complementario
      return `
        <article class="rec-card rec-card-feature format-${esc(format)} ${seen ? 'is-seen' : ''}" data-id="${esc(it.id)}">
          <div class="rec-card-top">
            <span class="rec-format">${icon(format, 16)}<span>${format === 'pdf' ? 'PDF' : format === 'video' ? 'Video' : 'Sitio web'}</span></span>
            ${unitTag}${seenTag}
          </div>
          <h4 class="rec-title">${it.title || ''}</h4>
          ${it.text ? `<p class="rec-text">${it.text}</p>` : ''}
          ${it.reference ? `<p class="rec-reference rec-reference-small">${it.reference}</p>` : ''}
          <div class="rec-card-foot">
            ${it.url ? `<span class="rec-domain">${esc(domainOf(it.url))}</span>` : ''}
            ${link}
          </div>
        </article>`;
    }

    // ----------------------------------------- interfaz que espera app.js
    updateNodeStatus(id, done) {
      if (!done) return;
      this.completed[id] = true;
      const card = this.groupsEl && this.groupsEl.querySelector(`.rec-card[data-id="${CSS.escape(id)}"]`);
      if (card) {
        card.classList.add('is-seen');
        const tag = card.querySelector('.rec-seen');
        if (tag) tag.hidden = false;
      }
    }
    updateGeometry() {}
    drawArc() {}
    goToIndex() {}
  }

  window.ResourceGrid = ResourceGrid;
})();
