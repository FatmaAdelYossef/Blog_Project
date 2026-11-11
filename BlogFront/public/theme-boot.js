// Apply the saved theme and site accent before the first paint to avoid a
// flash of the default palette. External file (not inline) so the production
// CSP can keep `script-src 'self'`.
try {
  var storedTheme = localStorage.getItem('theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var isDark = storedTheme ? storedTheme === 'dark' : prefersDark;
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';

  var raw = localStorage.getItem('site-settings');
  if (raw) {
    var site = JSON.parse(raw);
    var accent = isDark
      ? site.accentColorDark || site.accentColorLight
      : site.accentColorLight;
    if (accent) {
      var root = document.documentElement.style;
      root.setProperty('--color-accent', accent);
      root.setProperty(
        '--color-accent-hover',
        isDark
          ? 'color-mix(in srgb, ' + accent + ' 85%, white)'
          : 'color-mix(in srgb, ' + accent + ' 78%, black)',
      );
      root.setProperty(
        '--color-accent-soft',
        isDark
          ? 'color-mix(in srgb, ' + accent + ' 16%, #12100e)'
          : 'color-mix(in srgb, ' + accent + ' 10%, #ffffff)',
      );
    }
  }
} catch (error) {
  // Storage or matchMedia unavailable: keep the default theme.
}
