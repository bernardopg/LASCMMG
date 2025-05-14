(function () {
  'use strict';

  const THEME_STORAGE_KEY = 'lascmmg_theme_preference';

  const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
  };

  let themeToggleBtn;

  function initialize() {
    const darkThemeLoaded =
      document.querySelectorAll('link[href*="dark-theme.css"]').length > 0;

    if (!darkThemeLoaded) {
      console.warn(
        'Tema escuro não encontrado. Carregando CSS do tema escuro...'
      );
      loadDarkThemeCSS();
    }

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme) {
      applyTheme(savedTheme);
    } else {
      if (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        applyTheme(THEMES.DARK);
      } else {
        applyTheme(THEMES.LIGHT);
      }
    }

    if (window.matchMedia) {
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
          if (!localStorage.getItem(THEME_STORAGE_KEY)) {
            applyTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
          }
        });
    }

    createThemeToggleButton();

    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  function loadDarkThemeCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/verde-escuro-theme.css'; // Modificado de dark-theme.css
    document.head.appendChild(link);
  }

  function createThemeToggleButton() {
    themeToggleBtn = document.querySelector('.theme-toggle');

    if (!themeToggleBtn) {
      themeToggleBtn = document.createElement('button');
      themeToggleBtn.className = 'theme-toggle';
      themeToggleBtn.title = 'Alternar tema claro/escuro';
      themeToggleBtn.setAttribute('aria-label', 'Alternar tema claro/escuro');

      if (document.querySelector('link[href*="font-awesome"]')) {
        const icon = document.createElement('i');
        icon.className = 'fas fa-moon';
        themeToggleBtn.appendChild(icon);
      } else {
        themeToggleBtn.textContent = '🌓';
      }

      document.body.appendChild(themeToggleBtn);
    }

    updateThemeToggleIcon();
  }

  function updateThemeToggleIcon() {
    if (!themeToggleBtn) return;

    const isDarkTheme =
      document.documentElement.classList.contains('dark-theme');

    const icon = themeToggleBtn.querySelector('i');
    if (icon) {
      icon.className = isDarkTheme ? 'fas fa-sun' : 'fas fa-moon';
    } else {
      themeToggleBtn.textContent = isDarkTheme ? '☀️' : '🌙';
    }
  }

  function applyTheme(theme) {
    if (theme === THEMES.DARK) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }

    localStorage.setItem(THEME_STORAGE_KEY, theme);

    updateThemeToggleIcon();

    const event = new CustomEvent('themechange', { detail: { theme } });
    document.dispatchEvent(event);
  }

  function toggleTheme() {
    const isDarkTheme =
      document.documentElement.classList.contains('dark-theme');
    applyTheme(isDarkTheme ? THEMES.LIGHT : THEMES.DARK);
  }

  function getCurrentTheme() {
    return document.documentElement.classList.contains('dark-theme')
      ? THEMES.DARK
      : THEMES.LIGHT;
  }

  window.ThemeManager = {
    initialize,
    applyTheme,
    toggleTheme,
    getCurrentTheme,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
