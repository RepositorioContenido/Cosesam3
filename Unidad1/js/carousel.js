/**
 * OVA SENA - Menú circular
 *
 * Dibuja un botón por recurso de content.json (número, ícono "icon" y título
 * "twoLineTitle" o "shortTitle") sobre un arco. El botón activo abre el recurso;
 * los demás hacen girar el menú. También responde a flechas, rueda y deslizar.
 */

class CircularCarousel {
  constructor(options = {}) {
    this.wrapper = document.getElementById(options.wrapperId || 'carouselWrapper');
    this.nodesContainer = document.getElementById(options.nodesContainerId || 'wheelNodesContainer');
    this.svgPath = document.getElementById('woveArcPath');
    this.transitionLine = document.getElementById('woveNavTransitionPath');
    this.resources = options.resources || [];
    this.onSelect = options.onSelect || null;

    this.totalItems = this.resources.length;
    this.currentIndex = 0;
    this.wheelDebounce = false;

    // Configuración geométrica del arco estilo WOVE
    this.geometry = {
      cx: -320,
      cy: 300,
      radius: 490,
      apexX: 170,
      angleStep: 27, // Separación angular entre recursos
      arcSpanDeg: 62, // Ángulo total del arco visible (-62° a +62°)
      baseAngle: 0 // 0° = arco vertical (escritorio) | -90° = arco horizontal (móvil)
    };

    // Modo compacto (celular vertical, una columna): el arco se vuelve horizontal.
    // Un celular en horizontal usa el arco vertical de escritorio.
    this.compactQuery = window.matchMedia
      ? window.matchMedia('(max-width: 768px) and (orientation: portrait), (max-width: 768px) and (min-height: 501px)')
      : null;
    this.isCompact = false;

    this.init();
  }

  init() {
    this.updateGeometry();
    this.renderNodes();
    this.drawArc();
    this.setupEvents();
    this.goToIndex(0, false, false);
  }

  // Calcula centro, radio y ápice para que el carrusel ocupe toda la altura entre header y footer
  updateGeometry() {
    if (!this.wrapper) return;

    this.isCompact = !!(this.compactQuery && this.compactQuery.matches);
    this.wrapper.classList.toggle('is-compact', this.isCompact);

    // Orientar el degradé de la línea activa según la dirección del arco
    const navGradient = document.getElementById('senaNavArcGradient');
    if (navGradient) {
      navGradient.setAttribute('x2', this.isCompact ? '100%' : '0%');
      navGradient.setAttribute('y2', this.isCompact ? '0%' : '100%');
    }

    if (this.isCompact) {
      // MÓVIL: arco horizontal tipo "∩". El recurso activo queda arriba al centro
      // y los adyacentes descienden a izquierda y derecha.
      const w = Math.max(260, this.wrapper.clientWidth || window.innerWidth - 32);
      this.geometry.baseAngle = -90;
      this.geometry.arcSpanDeg = 62;
      const spanRad = (this.geometry.arcSpanDeg * Math.PI) / 180;
      this.geometry.radius = ((w / 2) + 6) / Math.sin(spanRad);
      this.geometry.angleStep = 38;
      const apexY = 22;
      this.geometry.cx = w / 2;
      this.geometry.cy = apexY + this.geometry.radius;
      return;
    }

    this.geometry.baseAngle = 0;
    const wrapperWidth = Math.max(300, this.wrapper.offsetWidth || this.wrapper.clientWidth || window.innerWidth * 0.55);
    // En pantallas bajas (celular en horizontal) el arco se ajusta al alto real disponible
    const wrapperHeight = Math.max(180, this.wrapper.offsetHeight || this.wrapper.clientHeight || (window.innerHeight - 110));

    // Centro vertical exactamente a la mitad del espacio
    this.geometry.cy = wrapperHeight / 2;

    // Ángulo de apertura del arco (66°): produce una curva circular natural y marcada
    this.geometry.arcSpanDeg = 66;
    const spanRad = (this.geometry.arcSpanDeg * Math.PI) / 180;

    // Radio calculado para que el arco se extienda con 0 margen, cruzando limpiamente los bordes superior e inferior
    this.geometry.radius = ((wrapperHeight / 2) + 4) / Math.sin(spanRad);

    // Separación angular de 44° para una distribución amplia y equilibrada de 05 y 02
    this.geometry.angleStep = 44;

    // Vértice del círculo (ápice): posición horizontal del recurso activo
    // En pantallas bajas el arco se corre a la izquierda para dejar sitio al título
    const minApex = wrapperHeight < 400 ? 70 : 140;
    this.geometry.apexX = Math.min(240, Math.max(minApex, wrapperWidth * 0.22));
    this.geometry.cx = this.geometry.apexX - this.geometry.radius;
  }

  // Dibuja el arco SVG limpio continuo estilo WOVE
  drawArc() {
    if (!this.svgPath) return;
    const { cx, cy, radius, arcSpanDeg, baseAngle } = this.geometry;
    const startRad = ((baseAngle - arcSpanDeg) * Math.PI) / 180;
    const endRad = ((baseAngle + arcSpanDeg) * Math.PI) / 180;

    // Punto inicial del arco (superior en escritorio / izquierdo en móvil)
    const arcStartX = cx + radius * Math.cos(startRad);
    const arcStartY = cy + radius * Math.sin(startRad);

    // Punto final del arco (inferior en escritorio / derecho en móvil)
    const arcEndX = cx + radius * Math.cos(endRad);
    const arcEndY = cy + radius * Math.sin(endRad);

    const pathD = `M ${arcStartX.toFixed(1)} ${arcStartY.toFixed(1)} A ${radius.toFixed(1)} ${radius.toFixed(1)} 0 0 1 ${arcEndX.toFixed(1)} ${arcEndY.toFixed(1)}`;
    this.svgPath.setAttribute('d', pathD);
  }

  // Genera el trazado SVG de un tramo circular entre dos ángulos específicos (respetando dirección de arco)
  getArcSegmentD(fromAngleDeg, toAngleDeg) {
    const { cx, cy, radius, baseAngle } = this.geometry;
    const radA = ((baseAngle + fromAngleDeg) * Math.PI) / 180;
    const radB = ((baseAngle + toAngleDeg) * Math.PI) / 180;
    const segmentStartX = cx + radius * Math.cos(radA);
    const segmentStartY = cy + radius * Math.sin(radA);
    const segmentEndX = cx + radius * Math.cos(radB);
    const segmentEndY = cy + radius * Math.sin(radB);
    const sweepFlag = toAngleDeg >= fromAngleDeg ? 1 : 0;
    return `M ${segmentStartX.toFixed(1)} ${segmentStartY.toFixed(1)} A ${radius.toFixed(1)} ${radius.toFixed(1)} 0 0 ${sweepFlag} ${segmentEndX.toFixed(1)} ${segmentEndY.toFixed(1)}`;
  }

  // Dibuja la línea animada con el degradé institucional:
  // Extremo botón anterior (transparencia -> cian -> azul oscuro centro) e invertido al siguiente (azul oscuro -> cian -> transparencia)
  updateConnectingLine(animate = true, isForward = true) {
    if (!this.transitionLine) return;
    const { angleStep } = this.geometry;

    // Trazado circular continuo: desde el botón anterior (-angleStep) pasando por el activo (0°) hasta el siguiente (+angleStep)
    const arcPathData = this.getArcSegmentD(-angleStep, angleStep);
    this.transitionLine.setAttribute('d', arcPathData);
    this.transitionLine.style.stroke = 'url(#senaNavArcGradient)';

    const len = this.transitionLine.getTotalLength() || 460;

    if (!animate) {
      this.transitionLine.style.transition = 'none';
      this.transitionLine.style.strokeDasharray = 'none';
      this.transitionLine.style.strokeDashoffset = '0';
      this.transitionLine.classList.add('is-active');
      return;
    }

    // Reiniciar animación con barrido fluido en la dirección del desplazamiento
    this.transitionLine.style.transition = 'none';
    this.transitionLine.style.strokeDasharray = `${len} ${len}`;
    this.transitionLine.style.strokeDashoffset = isForward ? `${len}` : `${-len}`;
    this.transitionLine.classList.remove('is-active');

    // Forzar reflow para reiniciar la animación
    void this.transitionLine.getBoundingClientRect();

    // Activar animación que dibuja la línea con su degradé simétrico
    this.transitionLine.classList.add('is-active');
    this.transitionLine.style.transition = 'stroke-dashoffset 650ms cubic-bezier(0.18, 0.92, 0.28, 1), opacity 320ms ease';
    this.transitionLine.style.strokeDashoffset = '0';
  }

  animateConnectingLine(fromIndex, toIndex) {
    if (!this.transitionLine) return;
    if (fromIndex === toIndex) return;

    let diff = toIndex - fromIndex;
    while (diff > this.totalItems / 2) diff -= this.totalItems;
    while (diff < -this.totalItems / 2) diff += this.totalItems;

    const isForward = diff > 0;
    this.updateConnectingLine(true, isForward);
  }

  // Renderiza los nodos interactivos
  renderNodes() {
    if (!this.nodesContainer) return;
    this.nodesContainer.innerHTML = '';

    this.resources.forEach((res, index) => {
      const nodeBtn = document.createElement('button');
      nodeBtn.type = 'button';
      nodeBtn.className = 'wove-node-item';
      nodeBtn.id = `carouselNode_${index}`;
      nodeBtn.dataset.index = index;
      nodeBtn.setAttribute('aria-label', `Recurso ${res.number}: ${res.shortTitle}`);

      const iconSrc = res.icon || '';
      // "twoLineTitle" admite <br> para partir el título en dos líneas
      const titleHtml = res.twoLineTitle || res.shortTitle || '';

      nodeBtn.innerHTML = `
        <span class="wove-node-dot" id="woveDot_${index}">
          <span class="cyber-reticle-ring" aria-hidden="true"></span>
          <span class="cyber-reticle-ping" aria-hidden="true"></span>
        </span>
        <div class="wove-node-content" id="woveContent_${index}">
          <span class="wove-node-num">${res.number}</span>
          <div class="wove-node-details">
            <div class="wove-title-row">
              ${iconSrc ? `<img src="${iconSrc}" alt="" class="wove-section-icon" />` : ''}
              <h4 class="wove-node-title">${titleHtml}</h4>
            </div>
          </div>
        </div>
      `;

      nodeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Si el nodo ya está activo, abrir su recurso en el modal.
        // Si no, solo rota el carrusel hasta él.
        if (index === this.currentIndex) {
          if (typeof window.appOpenModal === 'function') {
            window.appOpenModal(this.resources[index]);
          }
        } else {
          this.goToIndex(index);
        }
      });


      this.nodesContainer.appendChild(nodeBtn);
    });
  }

  // Posiciona y anima los nodos a lo largo de la trayectoria curva
  goToIndex(index, animate = true, triggerSelect = true) {
    const previousIndex = this.currentIndex;
    this.currentIndex = ((index % this.totalItems) + this.totalItems) % this.totalItems;

    const { cx, cy, radius, angleStep, baseAngle } = this.geometry;
    const compact = this.isCompact;

    this.resources.forEach((res, i) => {
      const nodeEl = document.getElementById(`carouselNode_${i}`);
      const contentEl = document.getElementById(`woveContent_${i}`);
      if (!nodeEl || !contentEl) return;

      // Calcular distancia cíclica más corta respecto al índice activo (-2, -1, 0, 1, 2)
      let diff = i - this.currentIndex;
      while (diff > 2) diff -= this.totalItems;
      while (diff < -2) diff += this.totalItems;

      // Ángulo en radianes según su diferencia con el nodo activo
      const nodeAngleDeg = diff * angleStep;
      const nodeAngleRad = ((baseAngle + nodeAngleDeg) * Math.PI) / 180;

      // Coordenadas cartesianas sobre la circunferencia
      const posX = cx + radius * Math.cos(nodeAngleRad);
      const posY = cy + radius * Math.sin(nodeAngleRad);

      // Inclinación tangencial de los números inactivos (Inspiración WOVE)
      // Arriba (diff < 0): tilt horario (+). Abajo (diff > 0): tilt antihorario (-).
      let tilt = 0;
      let scale = 1.0;
      let opacity = 1.0;
      let zIndex = 5;

      if (diff === 0) {
        // ACTIVO: Horizontal (0°), prominente, retículo cibernético y detalles holográficos
        tilt = 0;
        scale = 1.0;
        opacity = 1.0;
        zIndex = 10;
        nodeEl.classList.add('is-active');
        nodeEl.style.pointerEvents = 'auto';

        if (animate) {
          contentEl.classList.remove('cyber-entrance');
          void contentEl.offsetWidth; // Forzar reflow para reiniciar la animación
          contentEl.classList.add('cyber-entrance');
          setTimeout(() => {
            contentEl.classList.remove('cyber-entrance');
          }, 500);
        }
      } else if (Math.abs(diff) === 1) {
        // ADYACENTES (Anterior y Siguiente): Inclinación tangencial a 42° a lo largo del círculo
        // Móvil: el número se inclina siguiendo la tangente del arco horizontal
        tilt = compact ? diff * angleStep : -diff * 42; // diff=-1 -> +42deg; diff=1 -> -42deg
        scale = 0.88;
        opacity = 0.65;
        zIndex = 4;
        nodeEl.classList.remove('is-active');
        nodeEl.style.pointerEvents = 'auto';
        contentEl.classList.remove('cyber-entrance');
      } else {
        // NO VISIBLES (|diff| >= 2): Totalmente ocultos para mantener el diseño circular limpio
        tilt = compact ? diff * 55 : -diff * 55;
        scale = 0.65;
        opacity = 0;
        zIndex = 1;
        nodeEl.classList.remove('is-active');
        nodeEl.style.pointerEvents = 'none';
        contentEl.classList.remove('cyber-entrance');
      }

      if (!animate) {
        nodeEl.style.transition = 'none';
        contentEl.style.transition = 'none';
      } else {
        nodeEl.style.transition = 'transform 620ms cubic-bezier(0.18, 0.92, 0.28, 1), opacity 480ms ease, filter 480ms ease';
        contentEl.style.transition = 'transform 620ms cubic-bezier(0.18, 0.92, 0.28, 1), filter 480ms ease';
      }

      nodeEl.style.transform = `translate3d(${posX.toFixed(1)}px, ${posY.toFixed(1)}px, 0)`;
      nodeEl.style.opacity = opacity.toFixed(2);
      nodeEl.style.zIndex = zIndex;

      // Escritorio: contenido a la derecha del punto | Móvil: contenido centrado debajo del punto
      const anchor = compact ? 'translateX(-50%)' : 'translateY(-50%)';
      contentEl.style.transform = `${anchor} rotate(${tilt.toFixed(1)}deg) scale(${scale.toFixed(2)})`;
    });

    if (animate) {
      if (this.wrapper) {
        this.wrapper.classList.add('is-spinning');
        clearTimeout(this._spinTimer);
        this._spinTimer = setTimeout(() => {
          this.wrapper.classList.remove('is-spinning');
        }, 550);
      }
      if (typeof window.playCyberHaptic === 'function') {
        window.playCyberHaptic();
      }

      // Activar la línea animada que une el botón anterior con el nuevo usando el degradé
      if (previousIndex !== this.currentIndex) {
        this.animateConnectingLine(previousIndex, this.currentIndex);
      }
    } else {
      // Estado estático inicial / resize: posicionar la línea sin animación
      this.updateConnectingLine(false);
    }

    if (triggerSelect && typeof this.onSelect === 'function') {
      this.onSelect(this.currentIndex, this.resources[this.currentIndex]);
    }
  }

  next() {
    this.goToIndex(this.currentIndex + 1);
  }

  prev() {
    this.goToIndex(this.currentIndex - 1);
  }

  updateNodeStatus(resourceId, isCompleted) {
    const resourceIndex = this.resources.findIndex(resource => resource.id === resourceId);
    if (resourceIndex !== -1) {
      const nodeEl = document.getElementById(`carouselNode_${resourceIndex}`);
      if (nodeEl) {
        nodeEl.classList.toggle('is-completed', !!isCompleted);
      }
    }
  }

  setupEvents() {
    // Teclado accesible y atajos de rotación / exploración
    window.addEventListener('keydown', (e) => {
      if (['TEXTAREA', 'INPUT'].includes(document.activeElement.tagName)) return;
      const modal = document.getElementById('modalOverlay');
      if (modal && !modal.hidden) return;
      const amieModal = document.getElementById('amiePopupOverlay');
      if (amieModal && !amieModal.hidden) return;

      const kbdPrev = document.getElementById('hintKbdPrev');
      const kbdNext = document.getElementById('hintKbdNext');
      const kbdEnter = document.getElementById('hintKbdEnter');

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        if (kbdNext) {
          kbdNext.classList.add('is-pressed');
          setTimeout(() => kbdNext.classList.remove('is-pressed'), 180);
        }
        this.next();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (kbdPrev) {
          kbdPrev.classList.add('is-pressed');
          setTimeout(() => kbdPrev.classList.remove('is-pressed'), 180);
        }
        this.prev();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (kbdEnter) {
          kbdEnter.classList.add('is-pressed');
          setTimeout(() => kbdEnter.classList.remove('is-pressed'), 180);
        }
        if (typeof window.appOpenModal === 'function') {
          window.appOpenModal(this.resources[this.currentIndex]);
        }
      }
    });

    // Clics interactivos en los botones de indicación de teclado
    const kbdPrev = document.getElementById('hintKbdPrev');
    if (kbdPrev) {
      kbdPrev.addEventListener('click', (e) => {
        e.stopPropagation();
        kbdPrev.classList.add('is-pressed');
        setTimeout(() => kbdPrev.classList.remove('is-pressed'), 180);
        this.prev();
      });
    }

    const kbdNext = document.getElementById('hintKbdNext');
    if (kbdNext) {
      kbdNext.addEventListener('click', (e) => {
        e.stopPropagation();
        kbdNext.classList.add('is-pressed');
        setTimeout(() => kbdNext.classList.remove('is-pressed'), 180);
        this.next();
      });
    }

    const kbdEnter = document.getElementById('hintKbdEnter');
    if (kbdEnter) {
      kbdEnter.addEventListener('click', (e) => {
        e.stopPropagation();
        kbdEnter.classList.add('is-pressed');
        setTimeout(() => kbdEnter.classList.remove('is-pressed'), 180);
        if (typeof window.appOpenModal === 'function') {
          window.appOpenModal(this.resources[this.currentIndex]);
        }
      });
    }

    // Rueda del ratón / trackpad con debounce suave
    if (this.wrapper) {
      this.wrapper.addEventListener('wheel', (e) => {
        if (this.wheelDebounce) return;
        this.wheelDebounce = true;
        setTimeout(() => { this.wheelDebounce = false; }, 380);

        if (e.deltaY > 15 || e.deltaX > 15) {
          this.next();
        } else if (e.deltaY < -15 || e.deltaX < -15) {
          this.prev();
        }
      }, { passive: true });

      // Soporte táctil / Swipe
      let touchStartY = 0;
      let touchStartX = 0;

      this.wrapper.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      this.wrapper.addEventListener('touchend', (e) => {
        const diffX = e.changedTouches[0].clientX - touchStartX;
        const diffY = e.changedTouches[0].clientY - touchStartY;

        // Móvil: solo el deslizamiento horizontal rota el carrusel (el vertical hace scroll)
        if (this.isCompact) {
          if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX < 0) this.next();
            else this.prev();
          }
          return;
        }

        if (Math.abs(diffY) > 35 || Math.abs(diffX) > 35) {
          if (Math.abs(diffY) > Math.abs(diffX)) {
            if (diffY < 0) this.next();
            else this.prev();
          } else {
            if (diffX < 0) this.next();
            else this.prev();
          }
        }
      }, { passive: true });
    }

    // Ajuste responsivo ultra-fluido en tiempo real mediante ResizeObserver y requestAnimationFrame
    let rafResize = null;
    const onStageResize = () => {
      if (rafResize) cancelAnimationFrame(rafResize);
      rafResize = requestAnimationFrame(() => {
        this.updateGeometry();
        this.drawArc();
        this.goToIndex(this.currentIndex, false);
      });
    };

    if (window.ResizeObserver && this.wrapper) {
      this.resizeObserver = new ResizeObserver(() => onStageResize());
      this.resizeObserver.observe(this.wrapper);
    }
    window.addEventListener('resize', onStageResize, { passive: true });
    window.addEventListener('orientationchange', onStageResize, { passive: true });
  }
}

// Exportar globalmente
if (typeof window !== "undefined") {
  window.CircularCarousel = CircularCarousel;
}
