/**
 * OVA SENA - Textura Animada e Interactiva de Fondo
 * Malla geométrica fluida que reacciona con física elástica y estela al pasar el cursor.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', initBackgroundTexture);

  function initBackgroundTexture() {
    const canvas = document.getElementById('bgTextureCanvas');
    const container = document.getElementById('bgInteractiveTexture');
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;

    let points = [];
    const spacing = 46; // Espaciado entre nodos de la malla
    const mouseRadius = 170; // Radio de interacción del cursor

    let mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      active: false
    };

    let parallax = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let animationFrameId = null;
    let isTabVisible = true;

    // Ajustar resolución del lienzo
    function resize() {
      const rect = container.getBoundingClientRect();
      width = Math.max(300, rect.width || window.innerWidth);
      height = Math.max(300, rect.height || window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
      createGrid();
    }

    // Crear la cuadrícula geométrica de nodos
    function createGrid() {
      points = [];
      const cols = Math.ceil(width / spacing) + 2;
      const rows = Math.ceil(height / spacing) + 2;

      for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
        for (let columnIndex = 0; columnIndex < cols; columnIndex++) {
          const originX = (columnIndex - 1) * spacing + (rowIndex % 2 === 0 ? 0 : spacing * 0.5);
          const originY = (rowIndex - 1) * spacing;
          points.push({
            originX,
            originY,
            x: originX,
            y: originY,
            vx: 0,
            vy: 0,
            col: columnIndex,
            row: rowIndex,
            phase: (columnIndex * 0.3) + (rowIndex * 0.25)
          });
        }
      }
    }

    // Escuchar el movimiento del cursor
    window.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.active = true;

      // Parallax relativo al centro del lienzo
      const normX = (e.clientX / window.innerWidth) - 0.5;
      const normY = (e.clientY / window.innerHeight) - 0.5;
      parallax.targetX = normX * -14;
      parallax.targetY = normY * -10;

      // Actualizar el resplandor de fondo mediante CSS Custom Properties
      container.style.setProperty('--mouse-glow-x', `${e.clientX}px`);
      container.style.setProperty('--mouse-glow-y', `${e.clientY}px`);
    }, { passive: true });

    document.documentElement.addEventListener('mouseleave', () => {
      mouse.active = false;
      mouse.targetX = -1000;
      mouse.targetY = -1000;
      parallax.targetX = 0;
      parallax.targetY = 0;
    });

    document.documentElement.addEventListener('mouseenter', () => {
      mouse.active = true;
    });

    // Pausar si la pestaña se oculta para ahorrar batería/GPU
    document.addEventListener('visibilitychange', () => {
      isTabVisible = !document.hidden;
      if (isTabVisible && !animationFrameId) {
        lastTime = performance.now();
        loop(lastTime);
      }
    });

    let lastTime = performance.now();

    // Bucle principal de renderizado a 60fps
    function loop(now) {
      if (!isTabVisible) {
        animationFrameId = null;
        return;
      }

      const deltaSeconds = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Interpolación suave del cursor
      mouse.x += (mouse.targetX - mouse.x) * 0.18;
      mouse.y += (mouse.targetY - mouse.y) * 0.18;

      // Interpolación de parallax
      parallax.x += (parallax.targetX - parallax.x) * 0.08;
      parallax.y += (parallax.targetY - parallax.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(parallax.x, parallax.y);

      const time = now * 0.0016;

      // Actualizar y dibujar cada punto de la textura
      const len = points.length;
      for (let pointIndex = 0; pointIndex < len; pointIndex++) {
        const point = points[pointIndex];

        // Movimiento orgánico ambiente tipo marea suave
        const waveX = Math.sin(time + point.phase) * 3;
        const waveY = Math.cos(time + point.phase * 0.8) * 3;
        const targetX = point.originX + waveX;
        const targetY = point.originY + waveY;

        // Reacción física elástica al cursor
        if (mouse.active) {
          const dx = point.x - mouse.x;
          const dy = point.y - mouse.y;
          const dist = Math.hypot(dx, dy);

          if (dist < mouseRadius && dist > 0) {
            const force = (1 - dist / mouseRadius);
            const angle = Math.atan2(dy, dx);
            // Empuje elástico hacia afuera con amortiguación
            point.vx += Math.cos(angle) * force * 16 * (deltaSeconds * 60);
            point.vy += Math.sin(angle) * force * 16 * (deltaSeconds * 60);
          }
        }

        // Recuperación hacia el punto de reposo (resorte amortiguado)
        const spring = 0.08;
        const friction = 0.82;
        point.vx += (targetX - point.x) * spring;
        point.vy += (targetY - point.y) * spring;
        point.vx *= friction;
        point.vy *= friction;

        point.x += point.vx;
        point.y += point.vy;

        // Calcular cercanía al cursor para iluminar el nodo
        let prox = 0;
        if (mouse.active) {
          const distanceToCursor = Math.hypot(point.x - mouse.x, point.y - mouse.y);
          if (distanceToCursor < mouseRadius * 1.2) {
            prox = 1 - (distanceToCursor / (mouseRadius * 1.2));
          }
        }

        // Dibujar nodo estilizado (punto sutil o micro-cruz)
        const baseAlpha = 0.12 + (prox * 0.35);
        const radius = 1.6 + (prox * 1.4);

        // Color institucional: turquesa (#28bab8) cerca del cursor, gris azulado en reposo
        if (prox > 0.05) {
          ctx.fillStyle = `rgba(40, 186, 184, ${baseAlpha.toFixed(2)})`;
        } else {
          ctx.fillStyle = `rgba(12, 51, 76, ${baseAlpha.toFixed(2)})`;
        }

        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Opcional: Micro-cruz editorial en nodos selectos
        if ((point.col + point.row) % 4 === 0 && prox > 0.1) {
          ctx.strokeStyle = `rgba(49, 146, 44, ${(prox * 0.25).toFixed(2)})`;
          ctx.lineWidth = 1;
          const crossSize = 3 + prox * 2;
          ctx.beginPath();
          ctx.moveTo(point.x - crossSize, point.y);
          ctx.lineTo(point.x + crossSize, point.y);
          ctx.moveTo(point.x, point.y - crossSize);
          ctx.lineTo(point.x, point.y + crossSize);
          ctx.stroke();
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(loop);
    }

    window.addEventListener('resize', () => {
      resize();
    });

    resize();
    lastTime = performance.now();
    loop(lastTime);
  }
})();
