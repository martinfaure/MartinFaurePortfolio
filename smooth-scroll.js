/**
 * smooth-scroll.js
 * À inclure dans toutes vos pages HTML :
 * <script src="smooth-scroll.js"></script>
 *
 * Fonctionne automatiquement sans configuration.
 */

(function () {
  "use strict";

  /* ──────────────────────────────────────────────
     1. SCROLL FLUIDE NATIF (CSS)
     Active scroll-behavior: smooth sur toute la page.
  ────────────────────────────────────────────── */
  document.documentElement.style.scrollBehavior = "smooth";

  /* ──────────────────────────────────────────────
     2. SCROLL FLUIDE PERSONNALISÉ (JS)
     Remplace le scroll natif par une animation
     douce avec easing, pour les navigateurs qui
     ne supportent pas scroll-behavior ou pour
     les liens d'ancrage (#section).
  ────────────────────────────────────────────── */

  // Fonction d'easing : ease-in-out cubic
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Scroll animé vers une position Y cible
  function smoothScrollTo(targetY, duration) {
    duration = duration || 800;
    var startY = window.scrollY || window.pageYOffset;
    var distance = targetY - startY;
    var startTime = null;

    function step(currentTime) {
      if (!startTime) startTime = currentTime;
      var elapsed = currentTime - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var ease = easeInOutCubic(progress);

      window.scrollTo(0, startY + distance * ease);

      if (elapsed < duration) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  /* ──────────────────────────────────────────────
     3. LIENS D'ANCRAGE (#section)
     Intercepte les clics sur les liens internes
     et applique le scroll fluide JS.
  ────────────────────────────────────────────── */
  document.addEventListener("click", function (e) {
    var target = e.target.closest("a[href]");
    if (!target) return;

    var href = target.getAttribute("href");

    // Ignorer les liens externes, vides ou JavaScript
    if (
      !href ||
      href === "#" ||
      href.startsWith("http") ||
      href.startsWith("//") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    ) {
      return;
    }

    // Lien d'ancrage pur (#section) ou avec chemin + ancre (page.html#section)
    var hashIndex = href.indexOf("#");
    if (hashIndex === -1) return; // pas d'ancre → navigation normale

    var hash = href.slice(hashIndex + 1);
    var path = href.slice(0, hashIndex);

    // Si le chemin pointe vers une autre page, laisser le navigateur gérer
    var currentPath = window.location.pathname.split("/").pop() || "index.html";
    if (
      path &&
      path !== "" &&
      path !== currentPath &&
      path !== window.location.pathname
    ) {
      return;
    }

    var anchor =
      document.getElementById(hash) ||
      document.querySelector('[name="' + hash + '"]');
    if (!anchor) return;

    e.preventDefault();

    var offsetTop = anchor.getBoundingClientRect().top + window.scrollY;
    // Prend en compte un header fixe si présent
    var fixedHeader = document.querySelector(
      "header, nav, [data-fixed], .navbar, .header",
    );
    var headerHeight = 0;
    if (fixedHeader) {
      var style = window.getComputedStyle(fixedHeader);
      if (style.position === "fixed" || style.position === "sticky") {
        headerHeight = fixedHeader.offsetHeight;
      }
    }

    smoothScrollTo(offsetTop - headerHeight - 16, 800);

    // Met à jour l'URL sans déclencher un saut
    if (history.pushState) {
      history.pushState(null, null, "#" + hash);
    }
  });

  /* ──────────────────────────────────────────────
     4. SCROLL DE LA MOLETTE PERSONNALISÉ
     Rend le scroll à la molette plus doux et fluide.
  ────────────────────────────────────────────── */
  var isScrolling = false;
  var scrollQueue = 0;
  var scrollTarget = window.scrollY || 0;
  var scrollAnimFrame = null;
  var WHEEL_MULTIPLIER = 1.2; // Ajustez pour plus ou moins de vitesse

  function animateWheel() {
    var current = window.scrollY || window.pageYOffset;
    var distance = scrollTarget - current;

    if (Math.abs(distance) < 0.5) {
      window.scrollTo(0, scrollTarget);
      isScrolling = false;
      scrollAnimFrame = null;
      return;
    }

    window.scrollTo(0, current + distance * 0.12);
    scrollAnimFrame = requestAnimationFrame(animateWheel);
  }

  window.addEventListener(
    "wheel",
    function (e) {
      // Ignorer si l'élément sous le curseur est scrollable (textarea, div overflow, etc.)
      var el = e.target;
      while (el && el !== document.body) {
        var style = window.getComputedStyle(el);
        var overflow = style.overflow + style.overflowY;
        if (overflow.includes("scroll") || overflow.includes("auto")) {
          if (el.scrollHeight > el.clientHeight) return;
        }
        el = el.parentElement;
      }

      e.preventDefault();

      var delta = e.deltaY;
      // Normalisation selon le mode de delta
      if (e.deltaMode === 1) delta *= 33; // lignes → pixels
      if (e.deltaMode === 2) delta *= window.innerHeight; // pages → pixels

      scrollTarget += delta * WHEEL_MULTIPLIER;

      // Bornes : ne pas dépasser le haut ou le bas de la page
      var maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      scrollTarget = Math.max(0, Math.min(scrollTarget, maxScroll));

      if (!scrollAnimFrame) {
        scrollAnimFrame = requestAnimationFrame(animateWheel);
      }
    },
    { passive: false },
  );

  /* ──────────────────────────────────────────────
     5. BOUTON "RETOUR EN HAUT" (optionnel)
     Apparaît automatiquement après 300px de scroll.
     Supprimer ce bloc si vous n'en voulez pas.
  ────────────────────────────────────────────── */
  function createBackToTop() {
    var btn = document.createElement("button");
    btn.innerHTML = "&#8679;"; // flèche ↑
    btn.setAttribute("aria-label", "Retour en haut");
    btn.style.cssText = [
      "position:fixed",
      "bottom:2rem",
      "right:2rem",
      "width:3rem",
      "height:3rem",
      "border-radius:50%",
      "border:none",
      "background:rgba(0,0,0,0.7)",
      "color:#fff",
      "font-size:1.4rem",
      "cursor:pointer",
      "opacity:0",
      "transform:translateY(1rem)",
      "transition:opacity .3s,transform .3s",
      "z-index:9999",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "box-shadow:0 4px 12px rgba(0,0,0,0.25)",
      "line-height:1",
    ].join(";");

    document.body.appendChild(btn);

    window.addEventListener("scroll", function () {
      var scrolled = window.scrollY > 300;
      btn.style.opacity = scrolled ? "1" : "0";
      btn.style.transform = scrolled ? "translateY(0)" : "translateY(1rem)";
      btn.style.pointerEvents = scrolled ? "auto" : "none";
    });

    btn.addEventListener("click", function () {
      scrollTarget = 0;
      if (!scrollAnimFrame) {
        scrollAnimFrame = requestAnimationFrame(animateWheel);
      }
    });
  }

  // Créer le bouton une fois le DOM chargé
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createBackToTop);
  } else {
    createBackToTop();
  }
})();
