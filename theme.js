// =============================================================
// Theme runtime — include in <head> WITHOUT defer, before any
// stylesheets render content:
//     <script src="theme.js"></script>
// Sets html[data-theme] pre-paint from localStorage, keeps the
// browser chrome color in sync, syncs across tabs/iframes, and
// exposes window.appTheme {get, set, toggle}. Injects a floating
// toggle button on pages that have no top bar (topbar.js renders
// its own toggle when present).
// =============================================================
(function () {
  'use strict';

  var KEY = 'ui_theme_v1';
  var META_COLORS = { dark: '#0A0A0B', light: '#F4F3F0' };

  function stored() {
    try {
      var t = localStorage.getItem(KEY);
      return t === 'light' || t === 'dark' ? t : null;
    } catch (e) { return null; }
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', META_COLORS[theme]);
    var scheme = document.querySelector('meta[name="color-scheme"]');
    if (scheme) scheme.setAttribute('content', theme);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
  }

  function current() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function set(theme) {
    if (theme !== 'light' && theme !== 'dark') return;
    try { localStorage.setItem(KEY, theme); } catch (e) {}
    apply(theme);
  }

  window.appTheme = {
    get: current,
    set: set,
    toggle: function () { set(current() === 'dark' ? 'light' : 'dark'); }
  };

  // Pre-paint: dark is the default brand theme.
  apply(stored() || 'dark');

  // Follow changes made in other tabs or the parent page (iframe).
  window.addEventListener('storage', function (e) {
    if (e.key === KEY && (e.newValue === 'light' || e.newValue === 'dark')) apply(e.newValue);
  });

  function isEmbedded() {
    try { return window.self !== window.top; } catch (e) { return true; }
  }

  // Shared icon markup so topbar.js can reuse it.
  window.appTheme.icon = function (theme) {
    return theme === 'light'
      // moon (tap to go dark)
      ? '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>'
      // sun (tap to go light)
      : '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
  };

  function injectFloatingToggle() {
    if (isEmbedded()) return;
    if (document.getElementById('topbar') || document.getElementById('themeToggle')) return;
    var style = document.createElement('style');
    style.textContent =
      '.theme-fab{position:fixed;top:max(14px,env(safe-area-inset-top));right:14px;z-index:120;' +
      'width:38px;height:38px;display:flex;align-items:center;justify-content:center;' +
      'background:var(--card-glass,rgba(255,255,255,0.06));border:1px solid var(--border,rgba(255,255,255,0.08));' +
      'border-radius:999px;color:var(--text-secondary,#B8B6B0);cursor:pointer;' +
      'backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);' +
      'box-shadow:var(--shadow-card,0 8px 24px rgba(0,0,0,0.35));' +
      '-webkit-tap-highlight-color:transparent;transition:color 0.15s, transform 0.1s;}' +
      '.theme-fab:hover{color:var(--text-primary,#FAFAFA);}' +
      '.theme-fab:active{transform:scale(0.92);}';
    document.head.appendChild(style);
    var btn = document.createElement('button');
    btn.id = 'themeToggle';
    btn.className = 'theme-fab';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle light / dark theme');
    btn.innerHTML = window.appTheme.icon(current());
    btn.addEventListener('click', function () { window.appTheme.toggle(); });
    window.addEventListener('themechange', function () { btn.innerHTML = window.appTheme.icon(current()); });
    document.body.appendChild(btn);
  }

  function onReady() {
    // Enable theme transitions only after first paint.
    requestAnimationFrame(function () {
      document.documentElement.setAttribute('data-theme-ready', '');
    });
    // Wait a tick so deferred topbar.js can inject its bar first.
    setTimeout(injectFloatingToggle, 0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady, { once: true });
  } else {
    onReady();
  }
})();
