// Apply the saved theme before the first paint to avoid a light flash.
// External file (not inline) so the production CSP can keep `script-src 'self'`.
try {
  var storedTheme = localStorage.getItem('theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var isDark = storedTheme ? storedTheme === 'dark' : prefersDark;
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
} catch (error) {
  // Storage or matchMedia unavailable: keep the light default.
}
