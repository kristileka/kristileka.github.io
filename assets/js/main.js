/* Progressive enhancement only — the pages work without this file.
   With JS off, every reel is a plain link straight to the Instagram post. */
(function () {
  'use strict';

  var dialog = document.getElementById('lightbox');
  var body = dialog && dialog.querySelector('.lightbox__inner');
  var supported = dialog && typeof dialog.showModal === 'function';

  function open(node) {
    body.replaceChildren(node);
    dialog.showModal();
  }

  /* Instagram reels — nothing is requested from Instagram until a click. */
  if (supported) {
    document.querySelectorAll('[data-embed]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();

        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.instagram.com/p/' +
                     encodeURIComponent(link.dataset.embed) + '/embed/captioned/';
        iframe.title = link.dataset.title || 'Instagram video';
        iframe.allow = 'autoplay; clipboard-write; encrypted-media; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.scrolling = 'no';
        open(iframe);
      });
    });
  }

  /* Photographs */
  if (supported) {
    document.querySelectorAll('.shot__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var figure = btn.closest('.shot');
        var source = figure && figure.querySelector('img');
        if (!source) return;

        var wrap = document.createElement('div');
        var img = document.createElement('img');
        img.src = source.currentSrc || source.src;
        img.alt = source.alt || '';
        wrap.appendChild(img);

        var figcaption = figure.querySelector('figcaption');
        if (figcaption) {
          var p = document.createElement('p');
          p.className = 'lightbox__caption';
          p.textContent = figcaption.textContent.trim();
          wrap.appendChild(p);
        }
        open(wrap);
      });
    });
  }

  if (dialog) {
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog || e.target.closest('.lightbox__close')) dialog.close();
    });
    /* Drop the iframe on close so the video actually stops. */
    dialog.addEventListener('close', function () { body.replaceChildren(); });
  }

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
