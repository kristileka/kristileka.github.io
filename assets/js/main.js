/* kristileka.github.io — progressive enhancement only.
   Every feature below degrades to working HTML if this file never loads. */
(function () {
  'use strict';

  /* --- Sticky header shadow ---------------------------------------------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var setStuck = function () {
      header.dataset.stuck = window.scrollY > 8 ? 'true' : 'false';
    };
    setStuck();
    window.addEventListener('scroll', setStuck, { passive: true });
  }

  /* --- Mobile nav --------------------------------------------------------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('primary-nav');

  if (toggle && nav) {
    var mq = window.matchMedia('(max-width: 720px)');

    var sync = function () {
      if (mq.matches) {
        nav.hidden = toggle.getAttribute('aria-expanded') !== 'true';
      } else {
        nav.hidden = false;
        toggle.setAttribute('aria-expanded', 'false');
      }
    };

    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      sync();
    });

    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && mq.matches) {
        toggle.setAttribute('aria-expanded', 'false');
        sync();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        toggle.setAttribute('aria-expanded', 'false');
        sync();
        toggle.focus();
      }
    });

    mq.addEventListener('change', sync);
    sync();
  }

  /* --- Reveal on scroll --------------------------------------------------- */
  var revealables = document.querySelectorAll('[data-reveal]');

  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealables.forEach(function (el) { io.observe(el); });
  }

  /* --- YouTube facade ------------------------------------------------------
     Cards ship as a poster + button. The real iframe (and Google's cookies)
     only load once someone actually clicks play.                            */
  document.querySelectorAll('[data-youtube]').forEach(function (frame) {
    var id = frame.dataset.youtube;
    if (!id || id.indexOf('YOUTUBE_ID') === 0) return;

    if (!frame.style.backgroundImage) {
      frame.style.backgroundImage =
        'url(https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/maxresdefault.jpg)';
    }

    frame.addEventListener('click', function () {
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
                   '?autoplay=1&rel=0&modestbranding=1';
      iframe.title = frame.dataset.title || 'Video player';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.loading = 'lazy';
      frame.replaceChildren(iframe);
      frame.style.cursor = 'default';
    }, { once: true });
  });

  /* --- Lightbox ----------------------------------------------------------- */
  var dialog = document.getElementById('lightbox');

  if (dialog && typeof dialog.showModal === 'function') {
    var lbImg = dialog.querySelector('img');
    var lbCap = dialog.querySelector('.lightbox__caption');

    document.querySelectorAll('.shot__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var figure = btn.closest('.shot');
        var source = figure && figure.querySelector('img');
        if (!source) return;

        lbImg.src = source.currentSrc || source.src;
        lbImg.alt = source.alt || '';
        var caption = figure.querySelector('figcaption');
        lbCap.textContent = caption ? caption.textContent.trim() : '';
        dialog.showModal();
      });
    });

    dialog.addEventListener('click', function (e) {
      if (e.target === dialog || e.target.closest('.lightbox__close')) dialog.close();
    });

    dialog.addEventListener('close', function () {
      lbImg.removeAttribute('src');
      lbCap.textContent = '';
    });
  }

  /* --- Footer year -------------------------------------------------------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
