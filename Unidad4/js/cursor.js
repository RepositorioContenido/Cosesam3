/**
 * OVA SENA - Cursor Dinámico e Interactivo
 * Sistema de cursor personalizado con física fluida (lerp), estados magnéticos
 * y retroalimentación interactiva sobre botones y enlaces.
 */

(function () {
  'use strict';

  // Desactivar en dispositivos puramente táctiles sin mouse
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(hover: hover)').matches) {
    return;
  }

  document.addEventListener('DOMContentLoaded', initDynamicCursor);

  function initDynamicCursor() {
    const dot = document.getElementById('cursorDot');
    const follower = document.getElementById('cursorFollower');
    const badgeText = document.getElementById('cursorBadgeText');

    if (!dot || !follower) return;

    let mouseX = -100;
    let mouseY = -100;
    let followerX = -100;
    let followerY = -100;
    let isVisible = false;
    let isHovered = false;
    let isClicked = false;
    let rafId = null;

    // Seguimiento del mouse
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // El punto central se actualiza al instante con cero latencia
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;

      if (!isVisible) {
        isVisible = true;
        dot.classList.add('is-visible');
        follower.classList.add('is-visible');
        followerX = mouseX;
        followerY = mouseY;
      }
    }, { passive: true });

    // Animación fluida con interpolación (lerp) para el seguidor exterior
    function animateFollower() {
      if (isVisible) {
        const ease = isHovered ? 0.22 : 0.16;
        followerX += (mouseX - followerX) * ease;
        followerY += (mouseY - followerY) * ease;

        follower.style.transform = `translate3d(${followerX}px, ${followerY}px, 0)`;
      }
      rafId = requestAnimationFrame(animateFollower);
    }
    rafId = requestAnimationFrame(animateFollower);

    // Detección de elementos interactivos al mover el cursor
    document.addEventListener('mouseover', (e) => {
      const interactiveTarget = e.target.closest(
        'button, a, input, textarea, select, [role="button"], .wove-node-item, .nav-dot-item, .nav-arrow-btn, .circular-image-ring, .clickable, .tab-item, .btn-primary-action, .sound-btn'
      );

      if (interactiveTarget) {
        isHovered = true;
        follower.classList.add('cursor-hover');
        dot.classList.add('cursor-hover');

        // Micro-etiqueta contextual para la imagen destacada central
        if (interactiveTarget.classList.contains('circular-image-ring') || interactiveTarget.closest('.editorial-circular-frame')) {
          follower.classList.add('cursor-explore');
          if (badgeText) badgeText.textContent = 'EXPLORAR';
        } else {
          follower.classList.remove('cursor-explore');
          if (badgeText) badgeText.textContent = '';
        }
      }
    });

    document.addEventListener('mouseout', (e) => {
      const interactiveTarget = e.target.closest(
        'button, a, input, textarea, select, [role="button"], .wove-node-item, .nav-dot-item, .nav-arrow-btn, .circular-image-ring, .clickable, .tab-item, .btn-primary-action, .sound-btn'
      );

      if (interactiveTarget) {
        isHovered = false;
        follower.classList.remove('cursor-hover', 'cursor-explore');
        dot.classList.remove('cursor-hover');
        if (badgeText) badgeText.textContent = '';
      }
    });

    // Efecto al presionar (click / mousedown)
    window.addEventListener('mousedown', () => {
      isClicked = true;
      follower.classList.add('cursor-active');
      dot.classList.add('cursor-active');
    });

    window.addEventListener('mouseup', () => {
      isClicked = false;
      follower.classList.remove('cursor-active');
      dot.classList.remove('cursor-active');
    });

    // Ocultar si el mouse sale de la ventana
    document.documentElement.addEventListener('mouseleave', () => {
      isVisible = false;
      dot.classList.remove('is-visible');
      follower.classList.remove('is-visible');
    });

    document.documentElement.addEventListener('mouseenter', () => {
      isVisible = true;
      dot.classList.add('is-visible');
      follower.classList.add('is-visible');
    });
  }
})();
