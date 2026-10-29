/**
 * OVA SENA - Carrusel de recursos del menú
 *
 * Dibuja un botón por cada recurso de content.json (número, ícono y título)
 * sobre un arco. Con 2 recursos:
 *   - escritorio: arco a la derecha de la imagen, un botón arriba y otro abajo
 *   - móvil (<= 768px): círculo completo alrededor de la imagen, con un pin
 *     arriba y otro abajo y el texto de cada botón por fuera del círculo
 * Con más recursos gira como una rueda (flechas, rueda del mouse o deslizar).
 */

class CircularCarousel {
  constructor(options = {}) {
    this.wrapper = document.getElementById('carouselWrapper');
    this.nodesContainer = document.getElementById('wheelNodesContainer');
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
      arcSpanDeg: 62 // Ángulo total del arco visible (-62° a +62°)
    };

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
    const wrapperWidth = Math.max(300, this.wrapper.offsetWidth || this.wrapper.clientWidth || window.innerWidth * 0.55);
    const wrapperHeight = Math.max(340, this.wrapper.offsetHeight || this.wrapper.clientHeight || (window.innerHeight - 110));

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
    this.geometry.apexX = Math.min(240, Math.max(140, wrapperWidth * 0.22));
    this.geometry.cx = this.geometry.apexX - this.geometry.radius;
  }

  /**
   * Geometría del círculo móvil (2 recursos, pantalla <= 768px).
   * Devuelve centro, radio y posición de los pines en coordenadas del SVG
   * (píxeles CSS, el SVG no tiene viewBox) o null si no aplica.
   */
  mobileArcGeometry() {
    if (this.totalItems !== 2) return null;
    if (!window.matchMedia('(max-width: 768px)').matches) return null;
    const imageEl = document.getElementById('editorialCircularImg');
    const svgEl = this.svgPath && this.svgPath.ownerSVGElement;
    if (!imageEl || !svgEl) return null;

    const imgRect = imageEl.getBoundingClientRect();
    const svgRect = svgEl.getBoundingClientRect();
    if (!imgRect.width || !imgRect.height) return null;

    // Circulo completo alrededor de la imagen, algo mas grande que ella.
    // Los botones llevan un pin arriba y abajo del circulo.
    const ringGap = Math.round(Math.min(40, Math.max(24, imgRect.width * 0.16)));
    const radius = Math.max(imgRect.width, imgRect.height) / 2 + ringGap;
    const centerX = imgRect.left - svgRect.left + imgRect.width / 2;
    const centerY = imgRect.top - svgRect.top + imgRect.height / 2;

    return {
      centerX: centerX,
      centerY: centerY,
      radius: radius,
      top: centerY - radius,       // pin del boton de arriba
      bottom: centerY + radius     // pin del boton de abajo
    };
  }

  // Degradado del circulo movil: azul oscuro en los pines, cian a los lados
  ensureRingGradient() {
    const svgEl = this.svgPath && this.svgPath.ownerSVGElement;
    if (!svgEl || svgEl.querySelector('#senaRingGradient')) return;
    const NS = 'http://www.w3.org/2000/svg';
    let defs = svgEl.querySelector('defs');
    if (!defs) { defs = document.createElementNS(NS, 'defs'); svgEl.prepend(defs); }
    const grad = document.createElementNS(NS, 'linearGradient');
    grad.setAttribute('id', 'senaRingGradient');
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '100%');
    [['0%', '#0c334c'], ['18%', '#31922c'], ['50%', '#28bab8'], ['82%', '#31922c'], ['100%', '#0c334c']]
      .forEach(([offset, color]) => {
        const stop = document.createElementNS(NS, 'stop');
        stop.setAttribute('offset', offset);
        stop.setAttribute('stop-color', color);
        grad.appendChild(stop);
      });
    defs.appendChild(grad);
  }

  // Dibuja el arco SVG limpio continuo estilo WOVE
  drawArc() {
    if (!this.svgPath) return;

    // Móvil: círculo completo alrededor de la imagen
    const mobile = this.mobileArcGeometry();
    if (mobile) {
      const { centerX, centerY, radius } = mobile;
      const r = radius.toFixed(1);
      const left = (centerX - radius).toFixed(1);
      const y = centerY.toFixed(1);
      const d = (2 * radius).toFixed(1);
      this.ensureRingGradient();
      this.svgPath.classList.add('is-ring');
      this.svgPath.setAttribute('d', `M ${left} ${y} a ${r} ${r} 0 1 0 ${d} 0 a ${r} ${r} 0 1 0 -${d} 0`);
      return;
    }
    this.svgPath.classList.remove('is-ring');

    const { cx, cy, radius, arcSpanDeg } = this.geometry;
    const spanRad = (arcSpanDeg * Math.PI) / 180;

    // Punto superior del arco
    const arcStartX = cx + radius * Math.cos(-spanRad);
    const arcStartY = cy + radius * Math.sin(-spanRad);

    // Punto inferior del arco
    const arcEndX = cx + radius * Math.cos(spanRad);
    const arcEndY = cy + radius * Math.sin(spanRad);

    const pathD = `M ${arcStartX.toFixed(1)} ${arcStartY.toFixed(1)} A ${radius.toFixed(1)} ${radius.toFixed(1)} 0 0 1 ${arcEndX.toFixed(1)} ${arcEndY.toFixed(1)}`;
    this.svgPath.setAttribute('d', pathD);
  }

  // Genera el trazado SVG de un tramo circular entre dos ángulos específicos (respetando dirección de arco)
  getArcSegmentD(fromAngleDeg, toAngleDeg) {
    const { cx, cy, radius } = this.geometry;
    const radA = (fromAngleDeg * Math.PI) / 180;
    const radB = (toAngleDeg * Math.PI) / 180;
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

    // En móvil los botones van sobre el círculo: la línea animada no aplica.
    if (this.mobileArcGeometry()) {
      this.transitionLine.style.opacity = '0';
      this.transitionLine.classList.remove('is-active');
      return;
    }
    this.transitionLine.style.opacity = '1';

    const { angleStep } = this.geometry;

    let fromAngle = -angleStep;
    let toAngle = angleStep;
    if (this.totalItems === 2) {
      fromAngle = -17;
      toAngle = 17;
    }

    // Trazado circular continuo
    const arcPathData = this.getArcSegmentD(fromAngle, toAngle);
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

    if (this.totalItems === 2) {
      const isForward = toIndex > fromIndex;
      this.updateConnectingLine(true, isForward);
      return;
    }

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

    if (this.totalItems === 2 && this.wrapper) {
      this.wrapper.classList.add('two-items');
    }

    this.resources.forEach((res, index) => {
      const nodeBtn = document.createElement('button');
      nodeBtn.type = 'button';
      nodeBtn.className = 'wove-node-item';
      nodeBtn.id = `carouselNode_${index}`;
      nodeBtn.dataset.index = index;
      nodeBtn.setAttribute('aria-label', `Recurso ${res.number}: ${res.shortTitle}`);

      // "twoLineTitle" permite partir el título con <br>; si no, "shortTitle".
      const titleHtml = res.twoLineTitle || res.shortTitle || '';

      nodeBtn.innerHTML = `
        <span class="wove-node-dot" id="woveDot_${index}"></span>
        <div class="wove-node-content" id="woveContent_${index}">
          <span class="wove-node-num">${res.number}</span>
          <div class="wove-node-details">
            <div class="wove-title-row">
              ${res.icon ? `<img src="${res.icon}" alt="" class="wove-section-icon" />` : ''}
              <h4 class="wove-node-title">${titleHtml}</h4>
            </div>
          </div>
        </div>
      `;

      nodeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Cada botón abre su recurso; goToIndex sincroniza el estado activo.
        this.goToIndex(index);
        if (typeof window.appOpenModal === 'function') {
          window.appOpenModal(this.resources[index]);
        }
      });

      nodeBtn.addEventListener('mouseenter', () => {
        nodeBtn.classList.add('is-hovered');
      });

      nodeBtn.addEventListener('mouseleave', () => {
        nodeBtn.classList.remove('is-hovered');
      });

      this.nodesContainer.appendChild(nodeBtn);
    });
  }

  // Posiciona y anima los nodos a lo largo de la trayectoria curva
  goToIndex(index, animate = true, triggerSelect = true) {
    const previousIndex = this.currentIndex;
    this.currentIndex = ((index % this.totalItems) + this.totalItems) % this.totalItems;

    const { cx, cy, radius, angleStep } = this.geometry;

    if (this.totalItems === 2) {
      if (this.wrapper) {
        this.wrapper.classList.add('two-items');
      }

      // Escritorio: botón 1 arriba (-17°) y botón 2 abajo (+17°) sobre el arco.
      // Móvil: cada botón en su pin del círculo.
      const buttonAngles = [-17, 17];
      const mobile = this.mobileArcGeometry();
      const useImageLayout = !!mobile;

      this.resources.forEach((res, i) => {
        const nodeEl = document.getElementById(`carouselNode_${i}`);
        const contentEl = document.getElementById(`woveContent_${i}`);
        if (!nodeEl || !contentEl) return;

        const isActive = (i === this.currentIndex);
        const nodeAngleDeg = buttonAngles[i];
        const nodeAngleRad = (nodeAngleDeg * Math.PI) / 180;

        let posX, posY;
        if (useImageLayout) {
          posX = mobile.centerX;
          posY = i === 0 ? mobile.top : mobile.bottom;
        } else {
          posX = cx + radius * Math.cos(nodeAngleRad);
          posY = cy + radius * Math.sin(nodeAngleRad);
        }

        // En móvil los dos botones se ven iguales (sin atenuar el no activo).
        const scale = useImageLayout ? 1 : (isActive ? 1.05 : 0.94);
        const opacity = useImageLayout ? 1 : (isActive ? 1.0 : 0.88);
        const zIndex = isActive ? 10 : 5;

        if (isActive) {
          nodeEl.classList.add('is-active');
          nodeEl.style.pointerEvents = 'auto';

          if (animate) {
            contentEl.classList.remove('cyber-entrance');
            void contentEl.offsetWidth;
            contentEl.classList.add('cyber-entrance');
            setTimeout(() => {
              contentEl.classList.remove('cyber-entrance');
            }, 500);
          }
        } else {
          nodeEl.classList.remove('is-active');
          nodeEl.style.pointerEvents = 'auto';
          contentEl.classList.remove('cyber-entrance');
        }

        if (!animate) {
          nodeEl.style.transition = 'none';
          contentEl.style.transition = 'none';
        } else {
          nodeEl.style.transition = 'transform 550ms cubic-bezier(0.18, 0.92, 0.28, 1), opacity 450ms ease';
          contentEl.style.transition = 'transform 550ms cubic-bezier(0.18, 0.92, 0.28, 1)';
        }

        nodeEl.style.transform = `translate3d(${posX.toFixed(1)}px, ${posY.toFixed(1)}px, 0)`;
        nodeEl.style.opacity = opacity.toFixed(2);
        nodeEl.style.zIndex = zIndex;

        // Móvil: el texto va por fuera del círculo (encima del pin de arriba,
        // debajo del de abajo). Escritorio: a la derecha del punto del arco.
        contentEl.style.transform = useImageLayout
          ? (i === 0
              ? `translate(-50%, calc(-100% - 12px)) scale(${scale.toFixed(2)})`
              : `translate(-50%, 12px) scale(${scale.toFixed(2)})`)
          : `translateY(-50%) scale(${scale.toFixed(2)})`;
      });

      if (animate) {
        if (this.wrapper) {
          this.wrapper.classList.add('is-spinning');
          clearTimeout(this._spinTimer);
          this._spinTimer = setTimeout(() => {
            this.wrapper.classList.remove('is-spinning');
          }, 450);
        }
        if (typeof window.playCyberHaptic === 'function') {
          window.playCyberHaptic();
        }
        if (previousIndex !== this.currentIndex) {
          this.animateConnectingLine(previousIndex, this.currentIndex);
        }
      } else {
        this.updateConnectingLine(false);
      }

      if (triggerSelect && typeof this.onSelect === 'function') {
        this.onSelect(this.currentIndex, this.resources[this.currentIndex]);
      }
      return;
    }

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
      const nodeAngleRad = (nodeAngleDeg * Math.PI) / 180;

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
        tilt = -diff * 42; // diff=-1 -> +42deg; diff=1 -> -42deg
        scale = 0.88;
        opacity = 0.65;
        zIndex = 4;
        nodeEl.classList.remove('is-active');
        nodeEl.style.pointerEvents = 'auto';
        contentEl.classList.remove('cyber-entrance');
      } else {
        // NO VISIBLES (|diff| >= 2): Totalmente ocultos para mantener el diseño circular limpio
        tilt = -diff * 55;
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

      contentEl.style.transform = `translateY(-50%) rotate(${tilt.toFixed(1)}deg) scale(${scale.toFixed(2)})`;
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
    const idx = this.resources.findIndex(r => r.id === resourceId);
    if (idx !== -1) {
      const nodeEl = document.getElementById(`carouselNode_${idx}`);
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

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        this.next();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.prev();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (typeof window.appOpenModal === 'function') {
          window.appOpenModal(this.resources[this.currentIndex]);
        }
      }
    });


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

window.CircularCarousel = CircularCarousel;
