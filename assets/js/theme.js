/* Theme toggle: auto -> light -> dark -> auto.
 *
 * "auto" means no data-theme attribute at all, so the prefers-color-scheme
 * block in style.css takes over. The <head> of every page carries a tiny
 * inline script that applies the saved choice before first paint; without it
 * a dark-mode user sees a white flash on every navigation. Keep both. */
(function () {
  'use strict';

  var ORDER = ['auto', 'light', 'dark'];
  var LABEL = {
    auto: 'Theme: system default. Switch to light.',
    light: 'Theme: light. Switch to dark.',
    dark: 'Theme: dark. Switch to system default.'
  };

  var ICONS =
    '<svg class="icon-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" stroke="none"/></svg>' +
    '<svg class="icon-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M4.22 4.22l1.77 1.77M18.01 18.01l1.77 1.77M2 12h2.5M19.5 12H22M4.22 19.78l1.77-1.77M18.01 5.99l1.77-1.77"/></svg>' +
    '<svg class="icon-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  function current() {
    try {
      var saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return 'auto';
  }

  function apply(mode, btn) {
    if (mode === 'auto') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', mode);
    }
    if (btn) btn.setAttribute('aria-label', LABEL[mode]);
  }

  function init() {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;

    btn.innerHTML = ICONS;
    apply(current(), btn);

    btn.addEventListener('click', function () {
      var next = ORDER[(ORDER.indexOf(current()) + 1) % ORDER.length];
      try {
        localStorage.setItem('theme', next);
      } catch (e) {}
      apply(next, btn);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
