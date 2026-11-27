/**
 * Full-page loading indicator for same-site navigation (static HTML site).
 */
(function () {
  var STORAGE_KEY = 'axiom-page-loading';
  var overlay = null;

  function ensureOverlay() {
    if (overlay && overlay.isConnected) return overlay;
    overlay = document.getElementById('axiom-page-loader');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'axiom-page-loader';
    overlay.className = 'axiom-page-loader is-visible';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.setAttribute('aria-label', 'Loading page');
    overlay.innerHTML = '<div class="axiom-page-loader__spinner" aria-hidden="true"></div>';

    var parent = document.body || document.documentElement;
    parent.appendChild(overlay);
    return overlay;
  }

  function show() {
    document.documentElement.classList.add('axiom-page-loading');
    if (document.body) ensureOverlay().classList.add('is-visible');
  }

  function hide() {
    sessionStorage.removeItem(STORAGE_KEY);
    document.documentElement.classList.remove('axiom-page-loading');
    if (overlay) overlay.classList.remove('is-visible');
  }

  function isSameDocumentNavigation(url) {
    return (
      url.pathname === window.location.pathname &&
      url.search === window.location.search &&
      url.hash !== '' &&
      url.hash !== window.location.hash
    );
  }

  function isInternalNavLink(anchor) {
    if (!anchor || anchor.tagName !== 'A') return false;
    var href = anchor.getAttribute('href');
    if (!href || href.charAt(0) === '#') return false;
    if (anchor.target === '_blank' || anchor.hasAttribute('download')) return false;

    var url;
    try {
      url = new URL(anchor.href, window.location.href);
    } catch (err) {
      return false;
    }

    if (url.origin !== window.location.origin) return false;
    if (isSameDocumentNavigation(url)) return false;
    return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'file:';
  }

  if (sessionStorage.getItem(STORAGE_KEY) === '1') {
    show();
  }

  function onReady() {
    requestAnimationFrame(function () {
      requestAnimationFrame(hide);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }

  window.addEventListener('pageshow', function (event) {
    if (event.persisted) hide();
  });

  document.addEventListener(
    'click',
    function (event) {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

      var anchor = event.target.closest && event.target.closest('a[href]');
      if (!isInternalNavLink(anchor)) return;

      var url = new URL(anchor.href, window.location.href);
      if (url.href === window.location.href) return;

      sessionStorage.setItem(STORAGE_KEY, '1');
      show();
    },
    true
  );
})();