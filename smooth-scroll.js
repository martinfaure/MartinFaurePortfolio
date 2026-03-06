/**
 * smooth-scroll.js
 * Scroll smooth vers une ancre ou une position, avec easing personnalisable.
 * Usage :
 *   smoothScroll('#section2');
 *   smoothScroll(800);
 *   smoothScroll('#section2', { duration: 600, easing: 'easeInOutCubic', offset: -80 });
 */

const easings = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => --t * t * t + 1,
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInOutExpo: (t) => {
    if (t === 0 || t === 1) return t;
    return t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
};

/**
 * @param {string|number} target  - Sélecteur CSS ('#section') ou position en px
 * @param {object}        options
 * @param {number}        options.duration - Durée en ms (défaut: 700)
 * @param {string}        options.easing   - Nom de la fonction d'easing (défaut: 'easeInOutCubic')
 * @param {number}        options.offset   - Décalage vertical en px, utile pour les headers fixes (défaut: 0)
 * @returns {Promise<void>}       - Resolves quand l'animation est terminée
 */
function smoothScroll(target, options = {}) {
  const { duration = 700, easing = "easeInOutCubic", offset = 0 } = options;

  const easeFn = easings[easing] ?? easings.easeInOutCubic;

  // Résolution de la position cible
  let targetY;
  if (typeof target === "number") {
    targetY = target;
  } else if (typeof target === "string") {
    const el = document.querySelector(target);
    if (!el) {
      console.warn(`smoothScroll : élément introuvable → "${target}"`);
      return Promise.resolve();
    }
    targetY = el.getBoundingClientRect().top + window.scrollY;
  } else {
    console.warn(
      "smoothScroll : target doit être un sélecteur CSS ou un nombre.",
    );
    return Promise.resolve();
  }

  targetY = Math.max(0, targetY + offset);
  const startY = window.scrollY;
  const distance = targetY - startY;

  if (distance === 0) return Promise.resolve();

  return new Promise((resolve) => {
    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeFn(progress);

      window.scrollTo(0, startY + distance * ease);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(step);
  });
}

// ─── Auto-bind sur tous les liens <a href="#ancre"> ─────────────────────────

function initSmoothScrollLinks(options = {}) {
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href || href === "#") return;

    e.preventDefault();
    smoothScroll(href, options);

    // Met à jour l'URL sans rechargement
    history.pushState(null, "", href);
  });
}

// ─── Export ──────────────────────────────────────────────────────────────────

// Module ES
export { smoothScroll, initSmoothScrollLinks, easings };

// Fallback CommonJS / browser global
if (typeof module !== "undefined" && module.exports) {
  module.exports = { smoothScroll, initSmoothScrollLinks, easings };
} else if (typeof window !== "undefined") {
  window.smoothScroll = smoothScroll;
  window.initSmoothScrollLinks = initSmoothScrollLinks;
}
