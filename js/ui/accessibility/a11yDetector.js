export function detectSystemA11yPreferences() {
  const preferences = {
    contrastLevel: 'normal',

    isDarkMode: false,

    reduceMotion: false,

    baseFontSize: parseInt(
      window.getComputedStyle(document.documentElement).fontSize,
      10
    ),
  };

  if (window.matchMedia('(prefers-contrast: more)').matches) {
    preferences.contrastLevel = 'high';
  } else if (window.matchMedia('(prefers-contrast: custom)').matches) {
    preferences.contrastLevel = 'high';
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    preferences.reduceMotion = true;
  }

  preferences.isDarkMode = window.matchMedia(
    '(prefers-color-scheme: dark)'
  ).matches;

  return preferences;
}

export function watchA11yPreferences(onChange) {
  if (typeof onChange !== 'function') {
    throw new Error('O parâmetro onChange deve ser uma função');
  }

  const mediaQueries = [
    {
      query: '(prefers-color-scheme: dark)',
      handler: (e) => onChange({ isDarkMode: e.matches }),
    },
    {
      query: '(prefers-contrast: more)',
      handler: (e) =>
        onChange({ contrastLevel: e.matches ? 'high' : 'normal' }),
    },
    {
      query: '(prefers-reduced-motion: reduce)',
      handler: (e) => onChange({ reduceMotion: e.matches }),
    },
  ];

  const mediaQueryLists = mediaQueries.map((item) => {
    const mql = window.matchMedia(item.query);
    mql.addEventListener('change', item.handler);
    return { mql, handler: item.handler };
  });

  return function cleanup() {
    mediaQueryLists.forEach((item) => {
      item.mql.removeEventListener('change', item.handler);
    });
  };
}

export function applyAccessibilityAdjustments(preferences) {
  const root = document.documentElement;

  if (preferences.reduceMotion) {
    root.style.setProperty('--transition-speed', '0s');
    root.style.setProperty('--animation-speed', '0s');

    document.body.classList.add('reduced-motion');
  } else {
    root.style.setProperty('--transition-speed', '0.2s');
    root.style.setProperty('--animation-speed', '0.3s');
    document.body.classList.remove('reduced-motion');
  }

  document.body.classList.remove('high-contrast', 'very-high-contrast');
  if (preferences.contrastLevel === 'high') {
    document.body.classList.add('high-contrast');
  } else if (preferences.contrastLevel === 'very-high') {
    document.body.classList.add('very-high-contrast');
  }

  if (preferences.isDarkMode) {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
  } else {
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
  }
}
