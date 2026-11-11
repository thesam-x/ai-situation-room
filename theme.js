(function () {
  var root = document.documentElement;
  var key = root.getAttribute('data-theme-key') || 'theme';
  var btn = document.getElementById('themeBtn');

  function current() {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function apply(t) {
    if (t !== 'light' && t !== 'dark') t = 'dark';
    root.setAttribute('data-theme', t);
    root.style.colorScheme = t;
    root.style.backgroundColor = t === 'light' ? '#e8eef5' : '#04080f';
    try { localStorage.setItem(key, t); } catch (e) {}
    if (btn) {
      var toLight = t === 'dark';
      btn.setAttribute('aria-label', toLight ? 'Switch to light theme' : 'Switch to dark theme');
      btn.title = toLight ? 'Light theme' : 'Dark theme';
    }
    window.dispatchEvent(new CustomEvent('themechange', { detail: t }));
  }

  if (btn) {
    btn.addEventListener('click', function () {
      apply(current() === 'light' ? 'dark' : 'light');
    });
  }
  apply(current());
  window.__setTheme = apply;
})();
