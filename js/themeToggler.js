const DARK_MODE_CLASS = 'dark-theme';

const STORAGE_KEY = 'theme-preference';

const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

export function initThemeToggler(toggleBtnSelector = '.theme-toggle-btn') {
  applyThemeFromPreferences();

  document.querySelectorAll(toggleBtnSelector).forEach((btn) => {
    btn.addEventListener('click', toggleTheme);

    updateToggleButtonState(btn);
  });

  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    try {
      mediaQuery.addEventListener('change', handleSystemPreferenceChange);
    } catch {
      try {
        mediaQuery.addListener(handleSystemPreferenceChange);
      } catch (_err) {
        console.error(
          'Não foi possível adicionar listener para preferência de tema do sistema:',
          _err
        );
      }
    }
  }

  setupKeyboardToggle();
}

function toggleTheme() {
  const currentPref = getCurrentThemePreference();

  if (currentPref === THEME.DARK) {
    setThemePreference(THEME.LIGHT);
  } else {
    setThemePreference(THEME.DARK);
  }

  document
    .querySelectorAll('.theme-toggle-btn')
    .forEach(updateToggleButtonState);
}

function updateToggleButtonState(btn) {
  const currentTheme = getCurrentTheme();
  const isDark = currentTheme === THEME.DARK;

  if (btn.querySelector('.theme-icon')) {
    const iconElement = btn.querySelector('.theme-icon');
    iconElement.innerHTML = isDark ? '🌙' : '☀️';
  }

  if (btn.getAttribute('title')) {
    btn.setAttribute(
      'title',
      isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'
    );
  }

  btn.setAttribute(
    'aria-label',
    isDark ? 'Ativar modo claro' : 'Ativar modo escuro'
  );

  btn.setAttribute('aria-pressed', isDark.toString());
}

function getCurrentThemePreference() {
  try {
    return localStorage.getItem(STORAGE_KEY) || THEME.SYSTEM;
  } catch (e) {
    console.error('Erro ao acessar localStorage:', e);
    return THEME.SYSTEM;
  }
}

function getCurrentTheme() {
  const preference = getCurrentThemePreference();

  if (preference === THEME.SYSTEM) {
    return isSystemDarkMode() ? THEME.DARK : THEME.LIGHT;
  }

  return preference;
}

function isSystemDarkMode() {
  return (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

function setThemePreference(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {
    console.error('Erro ao salvar preferência de tema:', e);
  }

  applyTheme(theme);
}

function applyThemeFromPreferences() {
  const savedPreference = getCurrentThemePreference();
  applyTheme(savedPreference);
}

function applyTheme(preference) {
  let themeToApply = preference;

  if (preference === THEME.SYSTEM) {
    themeToApply = isSystemDarkMode() ? THEME.DARK : THEME.LIGHT;
  }

  if (themeToApply === THEME.DARK) {
    document.body.classList.add(DARK_MODE_CLASS);
  } else {
    document.body.classList.remove(DARK_MODE_CLASS);
  }

  document.documentElement.setAttribute('data-theme', themeToApply);

  document.dispatchEvent(
    new CustomEvent('themechange', {
      detail: { theme: themeToApply },
    })
  );
}

function handleSystemPreferenceChange(_event) {
  const currentPref = getCurrentThemePreference();

  if (currentPref === THEME.SYSTEM) {
    applyTheme(THEME.SYSTEM);

    document
      .querySelectorAll('.theme-toggle-btn')
      .forEach(updateToggleButtonState);
  }
}

function setupKeyboardToggle() {
  document.addEventListener('keydown', (event) => {
    if (event.altKey && event.key === 't') {
      toggleTheme();
      event.preventDefault();
    }
  });
}

export function addThemeToggleButton(
  targetSelector = '.sidebar-nav',
  position = 'append'
) {
  const target = document.querySelector(targetSelector);
  if (!target) return;

  if (document.querySelector('.theme-toggle-btn')) return;

  const btn = document.createElement('button');
  btn.className = 'theme-toggle-btn';
  btn.setAttribute('aria-label', 'Alternar tema');
  btn.setAttribute('title', 'Alternar entre modo claro e escuro');

  const icon = document.createElement('span');
  icon.className = 'theme-icon';
  icon.textContent = document.body.classList.contains(DARK_MODE_CLASS)
    ? '🌙'
    : '☀️';
  btn.appendChild(icon);

  const text = document.createElement('span');
  text.className = 'theme-text';
  text.textContent = 'Tema';
  btn.appendChild(text);

  switch (position) {
    case 'prepend':
      target.prepend(btn);
      break;
    case 'before':
      target.parentNode.insertBefore(btn, target);
      break;
    case 'after':
      target.parentNode.insertBefore(btn, target.nextSibling);
      break;
    case 'append':
    default:
      target.appendChild(btn);
  }

  btn.addEventListener('click', toggleTheme);
  updateToggleButtonState(btn);
}

export default {
  initThemeToggler,
  addThemeToggleButton,
  THEME,
};
