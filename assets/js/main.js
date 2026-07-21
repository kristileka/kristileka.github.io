/* Progressive enhancement only — the pages work without this file. */
(function () {
  'use strict';

  /* YouTube facade: the poster frame is all that loads until someone presses
     play, so Google's iframe and cookies stay out of the page until asked for. */
  document.querySelectorAll('[data-youtube]').forEach(function (frame) {
    var id = frame.dataset.youtube;
    if (!id || id.indexOf('YOUTUBE_ID') === 0) return;

    frame.style.backgroundImage =
      'url(https://i.ytimg.com/vi/' + encodeURIComponent(id) + '/maxresdefault.jpg)';

    frame.addEventListener('click', function () {
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
                   '?autoplay=1&rel=0&modestbranding=1';
      iframe.title = frame.dataset.title || 'Video player';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      frame.replaceChildren(iframe);
      frame.style.cursor = 'default';
    }, { once: true });
  });

  /* Lightbox */
  var dialog = document.getElementById('lightbox');

  if (dialog && typeof dialog.showModal === 'function') {
    var img = dialog.querySelector('img');
    var caption = dialog.querySelector('.lightbox__caption');

    document.querySelectorAll('.shot__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var figure = btn.closest('.shot');
        var source = figure && figure.querySelector('img');
        if (!source) return;

        img.src = source.currentSrc || source.src;
        img.alt = source.alt || '';
        var figcaption = figure.querySelector('figcaption');
        caption.textContent = figcaption ? figcaption.textContent.trim() : '';
        dialog.showModal();
      });
    });

    dialog.addEventListener('click', function (e) {
      if (e.target === dialog || e.target.closest('.lightbox__close')) dialog.close();
    });

    dialog.addEventListener('close', function () {
      img.removeAttribute('src');
      caption.textContent = '';
    });
  }

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
