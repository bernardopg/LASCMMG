import {
  hslToHex,
  hexToRgb,
  hexToHsl,
  generateAccessiblePalette,
} from '../../utils/colorUtils.js';
import {
  detectSystemA11yPreferences,
  watchA11yPreferences,
} from '../accessibility/a11yDetector.js';

class DynamicColorSystem {
  constructor() {
    this.currentScheme = {};

    this.userPreferences = {
      contrastLevel: 'normal',
      colorIntensity: 'medium',
      preferredHue: null,
      reduceMotion: false,
    };

    this.loadUserPreferences();

    this.init();
  }

  init() {
    this.detectSystemPreferences();

    this.updateColorsByTimeOfDay();

    this.setupContextObservers();

    setInterval(() => this.updateColorsByTimeOfDay(), 1000 * 60 * 15);
  }

  detectSystemPreferences() {
    const preferences = detectSystemA11yPreferences();

    this.userPreferences.contrastLevel = preferences.contrastLevel;
    this.userPreferences.reduceMotion = preferences.reduceMotion;
    this.isDarkMode = preferences.isDarkMode;

    this.cleanupA11yWatcher = watchA11yPreferences((changes) => {
      if ('isDarkMode' in changes) {
        this.isDarkMode = changes.isDarkMode;
        this.updateColorsByTimeOfDay();
      }

      if ('contrastLevel' in changes) {
        this.userPreferences.contrastLevel = changes.contrastLevel;
        this.updateColorsByTimeOfDay();
      }

      if ('reduceMotion' in changes) {
        this.userPreferences.reduceMotion = changes.reduceMotion;
        this.updateColorsByTimeOfDay();
      }
    });
  }

  updateColorsByTimeOfDay() {
    const hour = new Date().getHours();
    let colorTemperature, primaryHue, accentHue;

    if (hour >= 6 && hour < 12) {
      colorTemperature = 'warm';
      primaryHue = this.userPreferences.preferredHue || 30;
      accentHue = (primaryHue + 210) % 360;
    } else if (hour >= 12 && hour < 18) {
      colorTemperature = 'neutral';
      primaryHue = this.userPreferences.preferredHue || 210;
      accentHue = (primaryHue + 180) % 360;
    } else if (hour >= 18 && hour < 22) {
      colorTemperature = 'cool';
      primaryHue = this.userPreferences.preferredHue || 260;
      accentHue = (primaryHue + 150) % 360;
    } else {
      colorTemperature = 'dark';
      primaryHue = this.userPreferences.preferredHue || 240;
      accentHue = (primaryHue + 120) % 360;
    }

    this.applyColorScheme(primaryHue, accentHue, colorTemperature);
  }

  applyColorScheme(primaryHue, accentHue, temperature) {
    const root = document.documentElement;

    const saturationLevels = {
      low: 65,
      medium: 80,
      high: 90,
    };

    const saturation = saturationLevels[this.userPreferences.colorIntensity];

    let baseLightness = this.isDarkMode ? 45 : 55;

    const tempAdjustment = {
      warm: 5,
      neutral: 0,
      cool: -3,
      dark: -8,
    };

    baseLightness += tempAdjustment[temperature];

    const contrastAdjustment = {
      normal: 0,
      high: 5,
      'very-high': 10,
    };

    const contrastBoost =
      contrastAdjustment[this.userPreferences.contrastLevel];

    const primaryColor = hslToHex(primaryHue, saturation, baseLightness);
    const primaryHover = hslToHex(primaryHue, saturation, baseLightness - 10);

    const accentColor = hslToHex(accentHue, saturation - 5, baseLightness + 5);
    const accentHover = hslToHex(accentHue, saturation, baseLightness - 5);

    const successColor = hslToHex(
      120,
      saturation - 10,
      35 + tempAdjustment[temperature] / 2
    );
    const dangerColor = hslToHex(
      0,
      saturation,
      45 + tempAdjustment[temperature] / 2
    );
    const warningColor = hslToHex(
      45,
      saturation,
      55 + tempAdjustment[temperature] / 2
    );

    const primaryRGB = hexToRgb(primaryColor);
    const accentRGB = hexToRgb(accentColor);

    root.style.setProperty('--primary-color', primaryColor);
    root.style.setProperty('--primary-hover', primaryHover);
    root.style.setProperty('--primary-rgb', primaryRGB);

    root.style.setProperty('--accent-color', accentColor);
    root.style.setProperty('--accent-hover', accentHover);
    root.style.setProperty('--accent-color-rgb', accentRGB);

    root.style.setProperty('--success-color', successColor);
    root.style.setProperty('--danger-color', dangerColor);
    root.style.setProperty('--warning-color', warningColor);

    if (this.userPreferences.contrastLevel !== 'normal') {
      const darkText = this.isDarkMode
        ? hslToHex(0, 0, 95 + contrastBoost)
        : hslToHex(0, 0, 15 - contrastBoost);

      const lightText = this.isDarkMode
        ? hslToHex(0, 0, 75 + contrastBoost)
        : hslToHex(0, 0, 35 - contrastBoost);

      root.style.setProperty('--dark-text', darkText);
      root.style.setProperty('--light-text', lightText);

      if (this.isDarkMode) {
        root.style.setProperty(
          '--surface-color',
          hslToHex(0, 0, 15 - contrastBoost)
        );
        root.style.setProperty(
          '--light-bg',
          hslToHex(0, 0, 10 - contrastBoost)
        );
        root.style.setProperty('--dark-bg', hslToHex(0, 0, 5));
      } else {
        root.style.setProperty('--surface-color', hslToHex(0, 0, 100));
        root.style.setProperty(
          '--light-bg',
          hslToHex(0, 0, 95 + contrastBoost)
        );
        root.style.setProperty('--dark-bg', hslToHex(0, 0, 15 - contrastBoost));
      }
    }

    if (this.userPreferences.reduceMotion) {
      root.style.setProperty('--transition-speed', '0s');
    } else {
      root.style.setProperty('--transition-speed', '0.2s');
    }

    this.currentScheme = {
      primaryHue,
      accentHue,
      temperature,
      timestamp: new Date().getTime(),
    };
  }

  setupContextObservers() {
    document.addEventListener('DOMContentLoaded', () => {
      this.observeTournamentResults();

      this.observePageChanges();
    });
  }

  observeTournamentResults() {
    document.addEventListener('click', (e) => {
      const match = e.target.closest('.match');
      if (match) {
        const winner = match.querySelector('.player.winner');
        if (winner) {
          this.applyEmotionalColorScheme('celebration', match);
        }
      }
    });
  }

  observePageChanges() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.target.classList.contains('active-section')) {
          const sectionId = mutation.target.id;

          if (sectionId === 'bracket-section') {
            this.applyContextualScheme('focused');
          } else if (sectionId === 'scores-section') {
            this.applyContextualScheme('informative');
          }
        }
      }
    });

    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  applyEmotionalColorScheme(emotion, targetElement) {
    const emotionSchemes = {
      celebration: {
        background: hslToHex(45, 80, 90),
        border: hslToHex(45, 80, 50),
        glow: hexToRgb(hslToHex(45, 90, 50)),
      },
      warning: {
        background: hslToHex(0, 80, 95),
        border: hslToHex(0, 70, 50),
        glow: hexToRgb(hslToHex(0, 70, 50)),
      },
    };

    if (!targetElement || !emotionSchemes[emotion]) return;

    const scheme = emotionSchemes[emotion];

    const originalStyle = {
      background: targetElement.style.backgroundColor,
      border: targetElement.style.borderColor,
      boxShadow: targetElement.style.boxShadow,
    };

    targetElement.style.backgroundColor = scheme.background;
    targetElement.style.borderColor = scheme.border;
    targetElement.style.boxShadow = `0 0 15px rgba(${scheme.glow}, 0.5)`;

    targetElement.classList.add(`emotion-${emotion}`);

    setTimeout(() => {
      targetElement.style.backgroundColor = originalStyle.background;
      targetElement.style.borderColor = originalStyle.border;
      targetElement.style.boxShadow = originalStyle.boxShadow;

      targetElement.classList.remove(`emotion-${emotion}`);

      targetElement.style.transition = 'all 1s ease-out';
    }, 3000);
  }

  applyContextualScheme(context) {
    const root = document.documentElement;

    switch (context) {
      case 'focused':
        root.style.setProperty('--sidebar-bg', hslToHex(210, 30, 25));
        break;

      case 'informative': {
        const tableHeadingColor = this.isDarkMode
          ? hslToHex(210, 15, 30)
          : hslToHex(210, 15, 95);

        root.style.setProperty('--light-bg', tableHeadingColor);
        break;
      }

      default:
        this.updateColorsByTimeOfDay();
    }
  }

  loadUserPreferences() {
    try {
      const savedPrefs = localStorage.getItem('dynamicColorPreferences');
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        this.userPreferences = { ...this.userPreferences, ...prefs };
      }
    } catch (e) {
      console.warn('Erro ao carregar preferências de cor:', e);
    }
  }

  saveUserPreferences() {
    try {
      localStorage.setItem(
        'dynamicColorPreferences',
        JSON.stringify(this.userPreferences)
      );
    } catch (e) {
      console.warn('Erro ao salvar preferências de cor:', e);
    }
  }

  setUserPreference(key, value) {
    if (key in this.userPreferences) {
      this.userPreferences[key] = value;
      this.saveUserPreferences();

      this.updateColorsByTimeOfDay();

      return true;
    }
    return false;
  }

  hslToHex = hslToHex;
  hexToRgb = hexToRgb;
  hexToHsl = hexToHsl;
  generateAccessiblePalette = (baseColor) =>
    generateAccessiblePalette(baseColor, hslToHex, hexToHsl);
}

export const dynamicColorSystem = new DynamicColorSystem();
