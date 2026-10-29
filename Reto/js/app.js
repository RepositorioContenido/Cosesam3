/**
 * OVA SENA - Aplicación principal
 *
 * Arranca el OVA con el contenido de content.json (window.courseData):
 * textos e imágenes de portada y encabezado, carrusel de recursos, modal,
 * dock (inicio, créditos, bibliografía) y barra de progreso.
 */

(function () {
  'use strict';

  // Clave de almacenamiento local
  const STORAGE_KEY = 'sena_ova_u1_state_v1';

  // Estado reactivo global
  window.appState = {
    activeIndex: 0,
    view: 'portada',
    completed: {}
  };

  // Cargar estado previo de localStorage si existe
  function loadPersistedState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        window.appState = {
          ...window.appState,
          ...parsed,
          view: 'portada', // Siempre iniciar en la Portada / Inicio al cargar o refrescar
          completed: { ...(parsed.completed || {}) }
        };
      }
    } catch (e) {
      console.warn('Error al cargar estado local:', e);
    }
    window.appState.view = 'portada';
    // Asegurar que activeIndex no exceda la cantidad de recursos disponibles
    const totalRes = window.courseData?.resources?.length || 2;
    if (typeof window.appState.activeIndex !== 'number' || window.appState.activeIndex >= totalRes || window.appState.activeIndex < 0) {
      window.appState.activeIndex = 0;
    }
    // Asegurar que nunca quede bloqueado en transición al iniciar o refrescar
    window.appState.isTransitioning = false;
  }

  // Guardar estado en localStorage
  window.appSaveState = function () {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(window.appState));
    } catch (e) {
      console.warn('Error al guardar estado local:', e);
    }
  };

  // Toast de notificación
  window.showToast = function (message) {
    const toast = document.getElementById('toastNotification');
    const msgEl = document.getElementById('toastMessage');
    if (!toast || !msgEl) return;

    msgEl.textContent = message;
    toast.hidden = false;

    clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => {
      toast.hidden = true;
    }, 2800);
  };

  // Sintetizador de audio háptico cibernético ultra-sutil (Web Audio API)
  window.playCyberHaptic = function() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!window._cyberAudioCtx) {
        window._cyberAudioCtx = new AudioCtx();
      }
      if (window._cyberAudioCtx.state === 'suspended') {
        window._cyberAudioCtx.resume();
      }
      const ctx = window._cyberAudioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      // Frecuencia futurista ascendente rápida (click electrónico sofisticado)
      osc.frequency.setValueAtTime(540, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1260, ctx.currentTime + 0.04);
      
      gain.gain.setValueAtTime(0.02, ctx.currentTime); // Volumen sutil e imperceptiblemente táctil
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.045);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      // Ignorar si autoplay está restringido
    }
  };

  // Inicialización cuando el DOM esté listo o interactivo
  function initApp() {
    loadPersistedState();

    const data = window.courseData;
    if (!data) {
      console.error('No se encontró window.courseData');
      return;
    }

    // 1. Logos, imagen de portada, pie de página y título de la pestaña
    applyBranding(data);

    // 2. Encabezado del menú
    const headerTitle = document.getElementById('headerCourseTitle');
    const headerUnit = document.getElementById('headerUnitBadge');
    if (headerTitle) headerTitle.textContent = data.courseTitle;
    if (headerUnit) headerUnit.textContent = data.unitCode;

    // Imagen central del menú ("heroImage" en content.json)
    const heroImage = document.getElementById('editorialCircularImg');
    if (heroImage) {
      if (data.heroImage) heroImage.src = data.heroImage;
      heroImage.alt = data.heroImageAlt || '';
    }

    // 3. Modal de recursos: abrir un recurso lo marca como visto
    const modalManager = new window.WoveModalManager({
      onOpen: (resource) => {
        if (window.appState.completed[resource.id]) return;
        window.appState.completed[resource.id] = true;
        window.appSaveState();
        updateGlobalProgress();
        carousel.updateNodeStatus(resource.id, true);
      }
    });

    // 4. Carrusel circular de recursos
    const carousel = new window.CircularCarousel({
      resources: data.resources,
      onSelect: (index, resource) => {
        window.appState.activeIndex = index;
        window.appSaveState();

        // A medida que el usuario navega en el carrusel y ve el contenido, avanza la barra de progreso
        if (resource && !window.appState.completed[resource.id] && window.appState.view === 'carrusel') {
          window.appState.completed[resource.id] = true;
          window.appSaveState();
          updateGlobalProgress();
          if (carousel) {
            carousel.updateNodeStatus(resource.id, true);
          }
        }
      }
    });

    // El carrusel abre el modal con esta función
    window.appOpenModal = (res) => {
      const target = res || data.resources[window.appState.activeIndex];
      modalManager.open(target);
    };

    // 5. Dock (inicio, créditos, bibliografía) y ventanas de créditos y bibliografía
    initDockMenuAndAmiePopup(data);

    // Sincronizar estado inicial de los nodos del carrusel
    data.resources.forEach(r => {
      if (window.appState.completed[r.id]) {
        carousel.updateNodeStatus(r.id, true);
      }
    });

    // Actualizar progreso global en encabezado
    updateGlobalProgress();

    // 7. Navegación entre Portada e Inicio y Menú carrusel
    const portadaScreen = document.getElementById('portadaScreen');
    const menuCarruselSection = document.getElementById('menuCarruselSection');
    const btnEnterCarrusel = document.getElementById('btnEnterCarrusel');
    const btnPortadaScroll = document.getElementById('btnPortadaScroll');
    const portadaHeroTitle = document.getElementById('portadaHeroTitle');
    const portadaUnitLabel = document.getElementById('portadaUnitLabel');

    if (portadaUnitLabel && data.unitCode) {
      portadaUnitLabel.textContent = data.unitCode;
    }
    if (portadaHeroTitle && data.courseTitle) {
      portadaHeroTitle.textContent = data.courseTitle;
    }

    // El orbe circular se dimensiona segun el contenido: si el titulo no entra,
    // el circulo crece en vez de deformarse en elipse.
    fitPortadaOrb();

    // Al redimensionar la ventana puede cambiar el punto de quiebre y con el la
    // cantidad de lineas del titulo, asi que hay que volver a medir.
    window.addEventListener('resize', fitPortadaOrb);

    // Las fuentes web tardan en cargar: medir antes daria la metrica de la
    // tipografia de respaldo y el circulo quedaria chico.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitPortadaOrb);
    }

    /**
     * Ajusta el orbe circular de la portada para que su contenido (titulo, badge
     * y boton) quepa sin deformarlo.
     *
     * El circulo se dibuja con `border-radius: 50%`, asi que el box tiene que ser
     * cuadrado. Como es flex item, su `min-height: auto` dejaba que el contenido
     * agrandara el alto y lo convirtiese en elipse. Aqui se mide el desborde real
     * y se crece el circulo solo lo necesario, manteniendo ancho = alto.
     */
    function fitPortadaOrb() {
      const orb = document.getElementById('portadaGlassOrb');
      const inner = orb && orb.querySelector('.orb-inner-content');
      if (!orb || !inner) return;

      // Sin layout (elemento oculto o sin dimensiones) no hay nada que medir:
      // se deja el tamaño que dicta el CSS.
      if (!orb.clientWidth || !orb.clientHeight) return;

      const orbStyles = getComputedStyle(orb);
      const padX = parseFloat(orbStyles.paddingLeft) || 0;
      const padY = parseFloat(orbStyles.paddingTop) || 0;

      // Limites: nunca menos que el minimo de diseno, nunca mas que la pantalla.
      const MIN_SIZE = 320;
      const maxByViewport = Math.min(window.innerWidth * 0.92, window.innerHeight * 0.78);

      let size = Math.min(Math.max(orb.clientWidth || 0, MIN_SIZE), maxByViewport);

      // Crecer hasta que el contenido entre. Pocas iteraciones: converge en 1-2.
      for (let attempt = 0; attempt < 6; attempt++) {
        orb.style.setProperty('--orb-size', size + 'px');
        const availableHeight = orb.clientHeight - padY * 2;
        const overflow = inner.scrollHeight - availableHeight;
        if (overflow <= 1) break;              // cabe: terminado
        const grown = size + overflow + 4;      // crecer exactamente lo que falta
        if (grown >= maxByViewport) { size = maxByViewport; break; }
        size = grown;
      }

      orb.style.setProperty('--orb-size', size + 'px');
    }

    function showMenuCarrusel(targetIndex, animate = true) {
      if (window.appState.isTransitioning) return;

      if (typeof targetIndex === 'number' && !isNaN(targetIndex)) {
        window.appState.activeIndex = targetIndex;
      }

      const dockNav = document.getElementById('dockNav') || document.querySelector('.purple-dock-nav');

      // Si no requiere animación o ya está en carrusel
      if (!animate || !portadaScreen || portadaScreen.classList.contains('is-hidden')) {
        if (portadaScreen) {
          portadaScreen.classList.add('is-hidden');
          portadaScreen.classList.remove('transition-out', 'transition-in');
        }
        if (menuCarruselSection) {
          menuCarruselSection.classList.remove('is-hidden', 'transition-in', 'transition-out');
        }
        if (dockNav) {
          dockNav.classList.remove('theme-white');
          dockNav.classList.add('theme-blue');
        }
        window.appState.view = 'carrusel';
        window.appSaveState();
        setTimeout(() => {
          carousel.updateGeometry();
          carousel.drawArc();
          carousel.goToIndex(window.appState.activeIndex || 0, false);
        }, 50);
        return;
      }

      window.appState.isTransitioning = true;

      // 1. Feedback táctil en el botón Comenzar
      if (btnEnterCarrusel) {
        btnEnterCarrusel.classList.add('is-clicked');
      }

      // 2. Preparar el carrusel para renderizar con su animación de entrada inmersiva
      menuCarruselSection.classList.remove('is-hidden', 'transition-out');
      menuCarruselSection.classList.add('transition-in');
      carousel.updateGeometry();
      carousel.drawArc();
      carousel.goToIndex(window.appState.activeIndex || 0, false);

      // 3. Activar animación de inmersión / fly-out en la portada
      portadaScreen.classList.remove('transition-in');
      portadaScreen.classList.add('transition-out');

      // 4. Cambiar el tema del dock hacia azul de forma sincronizada
      if (dockNav) {
        setTimeout(() => {
          dockNav.classList.remove('theme-white');
          dockNav.classList.add('theme-blue');
        }, 120);
      }

      // 5. Culminar la transición a los 550ms
      setTimeout(() => {
        if (portadaScreen) {
          portadaScreen.classList.add('is-hidden');
          portadaScreen.classList.remove('transition-out');
        }
        if (menuCarruselSection) {
          menuCarruselSection.classList.remove('transition-in');
        }
        if (btnEnterCarrusel) {
          btnEnterCarrusel.classList.remove('is-clicked');
        }

        // Recalibración milimétrica final tras finalizar cualquier animación
        carousel.updateGeometry();
        carousel.drawArc();
        carousel.goToIndex(window.appState.activeIndex || 0, false);

        window.appState.view = 'carrusel';
        window.appState.isTransitioning = false;
        window.appSaveState();

        const announcer = document.getElementById('a11y-announcer');
        if (announcer) {
          announcer.textContent = `Ingresaste al menú. Explora los ${data.resources.length} recursos.`;
        }
      }, 520);
    }

    function showPortada(animate = true) {
      if (window.appState.isTransitioning) return;

      const dockNav = document.getElementById('dockNav') || document.querySelector('.purple-dock-nav');

      if (!animate || !menuCarruselSection || menuCarruselSection.classList.contains('is-hidden')) {
        if (portadaScreen) {
          portadaScreen.classList.remove('is-hidden', 'transition-in', 'transition-out');
        }
        if (menuCarruselSection) {
          menuCarruselSection.classList.add('is-hidden');
          menuCarruselSection.classList.remove('transition-in', 'transition-out');
        }
        if (dockNav) {
          dockNav.classList.remove('theme-blue');
          dockNav.classList.add('theme-white');
        }
        window.appState.view = 'portada';
        window.appSaveState();
        return;
      }

      window.appState.isTransitioning = true;

      // 1. Salida fluida del carrusel
      menuCarruselSection.classList.remove('transition-in');
      menuCarruselSection.classList.add('transition-out');

      // 2. Entrada fluida de la portada
      portadaScreen.classList.remove('is-hidden', 'transition-out');
      portadaScreen.classList.add('transition-in');

      // 3. Dock regresa al tema blanco
      if (dockNav) {
        setTimeout(() => {
          dockNav.classList.remove('theme-blue');
          dockNav.classList.add('theme-white');
        }, 100);
      }

      // 4. Culminar retorno a los 500ms
      setTimeout(() => {
        if (menuCarruselSection) {
          menuCarruselSection.classList.add('is-hidden');
          menuCarruselSection.classList.remove('transition-out');
        }
        if (portadaScreen) {
          portadaScreen.classList.remove('transition-in');
        }

        window.appState.view = 'portada';
        window.appState.isTransitioning = false;
        window.appSaveState();

        const announcer = document.getElementById('a11y-announcer');
        if (announcer) {
          announcer.textContent = 'De vuelta en la Portada de bienvenida.';
        }
      }, 500);
    }

    window.appShowPortada = showPortada;
    window.appShowMenuCarrusel = showMenuCarrusel;

    btnEnterCarrusel?.addEventListener('click', () => showMenuCarrusel(undefined, true));
    btnPortadaScroll?.addEventListener('click', () => showMenuCarrusel(undefined, true));

    // Sistema de Partículas Interactivas al pasar el cursor por el botón "Comenzar"
    // Inspirado en la textura y nodos de la sección del carrusel (puntos brillantes, micro-cruces y aros cian/verde)
    function initCtaButtonParticles() {
      const canvas = document.getElementById('ctaParticlesCanvas');
      const button = document.getElementById('btnEnterCarrusel');
      if (!canvas || !button) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let width = 0;
      let height = 0;
      let dpr = 1;
      let particles = [];
      let isHovered = false;
      let animationFrame = null;
      let mousePos = { x: 0, y: 0 };

      function resize() {
        const rect = canvas.getBoundingClientRect();
        width = Math.max(200, rect.width || 440);
        height = Math.max(120, rect.height || 260);
        dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        ctx.scale(dpr, dpr);
      }

      // Colores de la textura de la sección (bg-texture.js): Turquesa, Verde SENA, Cian y Blanco
      const colorPalettes = [
        'rgba(40, 186, 184, ',  // Turquesa vibrante (#28bab8)
        'rgba(9, 75, 203, ',    // Verde SENA (#094bcb)
        'rgba(94, 190, 182, ',  // Cian suave (#5ebeb6)
        'rgba(255, 255, 255, ', // Blanco luminoso
        'rgba(49, 146, 44, '    // Azul eléctrico institucional
      ];

      function createParticle(fromCursor = false) {
        const centerX = width / 2;
        const centerY = height / 2;
        const btnRect = button.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();

        const halfW = (btnRect.width || 180) / 2;
        const halfH = (btnRect.height || 48) / 2;

        let particleX, particleY, particleAngle, particleSpeed;

        if (fromCursor && mousePos.x && mousePos.y) {
          particleX = mousePos.x - canvasRect.left + (Math.random() - 0.5) * 12;
          particleY = mousePos.y - canvasRect.top + (Math.random() - 0.5) * 12;
          particleAngle = Math.atan2(particleY - centerY, particleX - centerX) + (Math.random() - 0.5) * 0.9;
          particleSpeed = 0.9 + Math.random() * 1.8;
        } else {
          // Salen desde el perímetro del botón pastilla
          const perimeterAngle = Math.random() * Math.PI * 2;
          const rX = halfW + (Math.random() * 10 - 5);
          const rY = halfH + (Math.random() * 8 - 4);
          particleX = centerX + Math.cos(perimeterAngle) * rX;
          particleY = centerY + Math.sin(perimeterAngle) * rY;

          particleAngle = perimeterAngle + (Math.random() - 0.5) * 0.7;
          particleSpeed = 0.7 + Math.random() * 1.5;
        }

        // Tipo de partícula extraído directamente de la textura:
        // 'cross' (micro-cruz + como en bg-texture.js:208), 'ring' (micro-aro) o 'dot' (nodo brillante)
        const typeRoll = Math.random();
        let type = 'dot';
        if (typeRoll < 0.35) {
          type = 'cross';
        } else if (typeRoll < 0.55) {
          type = 'ring';
        }

        const colorBase = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
        const maxLife = 40 + Math.floor(Math.random() * 35);

        particles.push({
          x: particleX,
          y: particleY,
          vx: Math.cos(particleAngle) * particleSpeed,
          vy: Math.sin(particleAngle) * particleSpeed,
          radius: type === 'cross' ? (3 + Math.random() * 2.5) : (1.6 + Math.random() * 1.6),
          colorBase,
          type,
          rotation: Math.random() * Math.PI,
          rotSpeed: (Math.random() - 0.5) * 0.05,
          life: maxLife,
          maxLife,
          driftPhase: Math.random() * Math.PI * 2
        });
      }

      function loop(now) {
        ctx.clearRect(0, 0, width, height);

        // Generar partículas continuamente mientras el cursor está encima del botón
        if (isHovered) {
          const spawnCount = 2;
          for (let spawnIndex = 0; spawnIndex < spawnCount; spawnIndex++) {
            if (particles.length < 60) {
              createParticle(false);
            }
          }
        }

        // Actualizar y pintar
        for (let particleIndex = particles.length - 1; particleIndex >= 0; particleIndex--) {
          const particle = particles[particleIndex];
          particle.life--;

          if (particle.life <= 0) {
            particles.splice(particleIndex, 1);
            continue;
          }

          const progress = particle.life / particle.maxLife; // 1 -> 0
          const alpha = Math.sin(progress * Math.PI) * 0.92;

          // Física suave con fricción y oscilación ambiental
          particle.x += particle.vx + Math.sin(now * 0.003 + particle.driftPhase) * 0.35;
          particle.y += particle.vy + Math.cos(now * 0.003 + particle.driftPhase) * 0.35;
          particle.vx *= 0.982;
          particle.vy *= 0.982;
          particle.rotation += particle.rotSpeed;

          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate(particle.rotation);

          if (particle.type === 'cross') {
            // Micro-cruz como en la textura de la sección
            ctx.strokeStyle = `${particle.colorBase}${alpha.toFixed(2)})`;
            ctx.lineWidth = 1.2;
            const armLength = particle.radius;
            ctx.beginPath();
            ctx.moveTo(-armLength, 0);
            ctx.lineTo(armLength, 0);
            ctx.moveTo(0, -armLength);
            ctx.lineTo(0, armLength);
            ctx.stroke();
          } else if (particle.type === 'ring') {
            // Micro-aro tecnológico
            ctx.strokeStyle = `${particle.colorBase}${alpha.toFixed(2)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, particle.radius * 1.5, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = `${particle.colorBase}${(alpha * 0.8).toFixed(2)})`;
            ctx.beginPath();
            ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Nodo circular brillante con resplandor
            ctx.shadowBlur = 6;
            ctx.shadowColor = `${particle.colorBase}0.8)`;
            ctx.fillStyle = `${particle.colorBase}${alpha.toFixed(2)})`;
            ctx.beginPath();
            ctx.arc(0, 0, particle.radius, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }

        if (isHovered || particles.length > 0) {
          animationFrame = requestAnimationFrame(loop);
        } else {
          animationFrame = null;
        }
      }

      button.addEventListener('mouseenter', (e) => {
        isHovered = true;
        mousePos.x = e.clientX;
        mousePos.y = e.clientY;

        // Estallido inicial de 8 partículas al posar el cursor
        for (let burstIndex = 0; burstIndex < 8; burstIndex++) {
          createParticle(true);
        }

        if (!animationFrame) {
          animationFrame = requestAnimationFrame(loop);
        }
      });

      button.addEventListener('mousemove', (e) => {
        mousePos.x = e.clientX;
        mousePos.y = e.clientY;
        if (Math.random() < 0.4 && particles.length < 55) {
          createParticle(true);
        }
      });

      button.addEventListener('mouseleave', () => {
        isHovered = false;
      });

      resize();
      window.addEventListener('resize', resize);
    }

    initCtaButtonParticles();

    // Efecto Parallax interactivo con el puntero del mouse
    if (portadaScreen && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let rafId = null;
      let targetX = 0;
      let targetY = 0;
      let currentX = 0;
      let currentY = 0;

      portadaScreen.addEventListener('mousemove', (e) => {
        const rect = portadaScreen.getBoundingClientRect();
        const normX = (e.clientX - rect.left) / rect.width - 0.5;
        const normY = (e.clientY - rect.top) / rect.height - 0.5;
        targetX = normX * 24; // Desplazamiento de 24px
        targetY = normY * 24;

        if (!rafId) {
          rafId = requestAnimationFrame(updateParallax);
        }
      });

      portadaScreen.addEventListener('mouseleave', () => {
        targetX = 0;
        targetY = 0;
        if (!rafId) {
          rafId = requestAnimationFrame(updateParallax);
        }
      });

      function updateParallax() {
        currentX += (targetX - currentX) * 0.12;
        currentY += (targetY - currentY) * 0.12;
        portadaScreen.style.setProperty('--parallax-x', `${currentX.toFixed(2)}px`);
        portadaScreen.style.setProperty('--parallax-y', `${currentY.toFixed(2)}px`);

        if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
          rafId = requestAnimationFrame(updateParallax);
        } else {
          rafId = null;
        }
      }
    }

    // Estado inicial de pantalla: SIEMPRE abrir en Portada (Inicio)
    showPortada(false);
  }

  // Ejecutar inmediatamente si el DOM ya está listo (evita retrasos en redirect o caché)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  /**
   * Logos, imagen de fondo de la portada, aviso del pie de página y título de
   * la pestaña del navegador. Todo sale de "branding" en content.json.
   */
  function applyBranding(data) {
    const brand = data.branding || {};
    const setImg = (selector, src, alt) => {
      document.querySelectorAll(selector).forEach((img) => {
        if (src) img.src = src;
        if (alt !== undefined) img.alt = alt;
      });
    };
    setImg('.portada-logo-foe', brand.logoLeftWhite, brand.logoLeftAlt);
    setImg('.header-logo-foe', brand.logoLeft, brand.logoLeftAlt);
    setImg('.portada-logo-sena', brand.logoRightWhite, brand.logoRightAlt);
    setImg('.header-logo-sena', brand.logoRight, brand.logoRightAlt);
    setImg('.popup-logo-left', brand.popupLogoLeft, brand.popupLogoLeftAlt);
    setImg('.popup-logo-right', brand.popupLogoRight, brand.popupLogoRightAlt);

    const portadaBg = document.querySelector('.portada-bg-image');
    if (portadaBg && brand.portadaImage) {
      portadaBg.style.backgroundImage = `url('${brand.portadaImage}')`;
    }

    const footer = document.querySelector('.footer-legal-notice');
    if (footer && brand.footerNotice) footer.textContent = brand.footerNotice;

    if (brand.pageTitle) document.title = brand.pageTitle;
  }

  // Bloque institucional de créditos ("credits.institution" en content.json):
  // entidades en mayúsculas y datos como directora, edición y ciudad.
  function renderCreditsInstitution(info) {
    if (!info) return '';
    const entities = Array.isArray(info.entities) ? info.entities : [];
    const details = Array.isArray(info.details) ? info.details : [];
    if (!entities.length && !details.length) return '';
    return `
      <div class="credits-institution">
        ${entities.map(line => `<p class="credits-institution-entity">${line}</p>`).join('')}
        ${details.length ? `
        <div class="credits-institution-details">
          ${details.map(d => `<p class="credits-institution-detail"><span>${d.role}</span> ${d.names}</p>`).join('')}
        </div>` : ''}
      </div>
    `;
  }

  // Dock lateral (inicio, créditos, bibliografía) y ventanas emergentes
  function initDockMenuAndAmiePopup(data) {
    const btnDockHome = document.getElementById('btnDockHome');
    const btnDockCredits = document.getElementById('btnDockCredits');
    const btnDockBibliography = document.getElementById('btnDockBibliography');

    const popupOverlay = document.getElementById('amiePopupOverlay');
    const popupBackdrop = document.getElementById('amiePopupBackdrop');
    const btnAmieClose = document.getElementById('btnAmieClose');

    const leftStickers = document.getElementById('amieLeftStickers');
    const rightScrollContainer = document.getElementById('amieRightScrollContainer');

    function openAmiePopup(type) {
      const config = type === 'credits' ? data.credits : data.bibliography;
      if (!config) return;

      // 1. Columna 1 (Izquierda): Tarjetas flotantes estilo stickers Amie Calendar
      if (leftStickers) {
        leftStickers.innerHTML = `
          <!-- Card Superior: Ícono a la izquierda + etiqueta de unidad + Título + Subtítulo -->
          <div class="amie-info-sticker" style="transform: translateX(-76px) rotate(-4.5deg);">
            <img src="${config.iconSrc}" alt="Ícono ${config.title}" class="amie-sticker-left-icon">
            <div class="sticker-info-content">
              <span class="sticker-tag">${(data.unitCode || 'Unidad').toUpperCase()}</span>
              <h3 class="sticker-main-name" id="amiePopupTitle">${config.title}</h3>
            </div>
          </div>

          <!-- Card Inferior: Imagen de apoyo donde estaba el mapa -->
          <div class="amie-media-sticker" style="transform: translateX(-94px) rotate(3.8deg);">
            <div class="sticker-image-wrapper">
              <img src="${config.supportImageSrc}" alt="${config.supportImageAlt}" class="sticker-support-photo">
            </div>
          </div>
        `;
      }

      // 2. Columna 2 (Derecha): Información completa con contenedor scrollable independiente
      if (rightScrollContainer) {
        if (type === 'credits') {
          rightScrollContainer.innerHTML = `
            <div class="amie-credits-wrapper">
              ${renderCreditsInstitution(config.institution)}

              <div class="credits-header-center">
                <h3 class="credits-super-title">${config.heading || ''}</h3>
                ${config.coordination ? `<div class="credits-entity-lead">${config.coordination}</div>` : ''}
                ${config.subordination ? `<div class="credits-ut-badge">${config.subordination}</div>` : ''}
              </div>

              <div class="credits-sections-flow">
                ${config.sections.map(sec => `
                  <div class="credits-role-group">
                    <div class="credits-role-title">${sec.role}</div>
                    <div class="credits-role-members">${sec.names}</div>
                  </div>
                `).join('')}
              </div>

              ${config.legalNotice ? `
              <div class="credits-legal-box">
                <p class="credits-legal-text">${config.legalNotice}</p>
              </div>` : ''}
            </div>
          `;
        } else {
          const showLinks = data.features?.bibliographyPopup?.showLinks !== false;
          rightScrollContainer.innerHTML = `
            <div class="amie-biblio-wrapper">
              <div class="amie-section-heading">
                <h3 class="amie-heading-title">${config.heading || config.title || ''}</h3>
                ${config.description ? `<p class="amie-heading-desc">${config.description}</p>` : ''}
              </div>

              <div class="amie-biblio-list">
                ${config.entries.map((entry, idx) => `
                  <div class="amie-biblio-card">
                    <span class="biblio-item-num">${String(idx + 1).padStart(2, '0')}</span>
                    <div class="biblio-item-content">
                      <p class="biblio-citation-text">${entry.text}</p>
                      ${entry.url && showLinks ? `
                        <a href="${entry.url}" target="_blank" rel="noopener noreferrer" class="biblio-link-pill">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                          <span>${config.linkText || 'Consultar recurso fuente'}</span>
                        </a>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }
        // Restablecer scroll al inicio
        rightScrollContainer.scrollTop = 0;
      }

      // 3. Apertura accesible
      if (popupOverlay) {
        popupOverlay.hidden = false;
        document.body.style.overflow = 'hidden';
        btnAmieClose?.focus();
      }
    }

    function closeAmiePopup() {
      if (popupOverlay) {
        popupOverlay.hidden = true;
        document.body.style.overflow = '';
      }
    }

    // Botón Home: Retorna a la Portada de bienvenida
    btnDockHome?.addEventListener('click', () => {
      closeAmiePopup();
      const modalOverlay = document.getElementById('modalOverlay');
      if (modalOverlay) modalOverlay.hidden = true;

      if (typeof window.appShowPortada === 'function') {
        window.appShowPortada();
      }
    });

    // Botón Créditos: Despliega popup Amie
    btnDockCredits?.addEventListener('click', () => {
      openAmiePopup('credits');
    });

    // Botón Bibliografía: Despliega popup Amie
    btnDockBibliography?.addEventListener('click', () => {
      openAmiePopup('bibliography');
    });

    // Cerrar modal
    btnAmieClose?.addEventListener('click', closeAmiePopup);
    popupBackdrop?.addEventListener('click', closeAmiePopup);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && popupOverlay && !popupOverlay.hidden) {
        closeAmiePopup();
      }
    });
  }



  // Actualiza la barra de progreso lineal ubicada debajo del encabezado
  function updateGlobalProgress() {
    const resources = (window.courseData && window.courseData.resources) || [];
    const total = resources.length || 1;
    const completedCount = resources.filter(r => window.appState.completed[r.id]).length;
    const percent = Math.min(100, Math.round((completedCount / total) * 100));

    const barEl = document.getElementById('headerProgressBar');
    const parentLine = document.querySelector('.header-progress-line');

    if (barEl) {
      barEl.style.width = `${percent}%`;
      barEl.setAttribute('aria-valuenow', percent);
    }
    if (parentLine) {
      parentLine.setAttribute('aria-valuenow', percent);
    }
  }

})();
