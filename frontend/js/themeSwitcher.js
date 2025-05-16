class ThemeSwitcher {
  constructor() {
    this.storageKey = 'lascmmg-theme-preference';
    this.faculdadeThemeClass = 'faculdade-theme';
    this.verdeEscuroThemeClass = 'verde-escuro-theme';
    this.themeOrder = ['faculdade', 'verde-escuro'];
    this.initialSetup();
  }

  initialSetup() {
    this.createToggleButton();

    this.setupEventListeners();

    this.applyPreferredTheme();

    this.observeSystemPreference();
  }

  createToggleButton() {
    if (document.querySelector('.theme-toggle-wrapper')) {
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'theme-toggle-wrapper';

    const button = document.createElement('button');
    button.className = 'theme-toggle-btn';
    button.setAttribute('aria-label', 'Alternar tema');
    button.setAttribute('title', 'Alternar tema');
    button.innerHTML = `
      <span class="theme-icon"></span>
      <span class="theme-label"></span>
    `;

    wrapper.appendChild(button);
    document.body.appendChild(wrapper);

    this.updateToggleButtonUI();
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.theme-toggle-btn')) {
        this.toggleTheme();
      }
    });
  }

  updateToggleButtonUI() {
    const button = document.querySelector('.theme-toggle-btn');
    if (!button) return;
    const iconSpan = button.querySelector('.theme-icon');
    const labelSpan = button.querySelector('.theme-label');
    const currentTheme = this.getCurrentTheme();

    if (iconSpan) {
      if (currentTheme === 'faculdade') {
        iconSpan.textContent = '🎨';
      } else if (currentTheme === 'verde-escuro') {
        iconSpan.textContent = '🌲';
      }
    }
    if (labelSpan) {
      if (currentTheme === 'faculdade') {
        labelSpan.textContent = 'Verdes/Dourados';
      } else if (currentTheme === 'verde-escuro') {
        labelSpan.textContent = 'Verde/Preto';
      }
    }
  }

  applyPreferredTheme() {
    const savedTheme = localStorage.getItem(this.storageKey);

    if (savedTheme === 'verde-escuro') {
      this.setVerdeEscuroTheme();
    } else if (savedTheme === 'faculdade') {
      this.setFaculdadeTheme();
    } else {
      if (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        this.setVerdeEscuroTheme();
      } else {
        this.setFaculdadeTheme();
      }
    }
  }

  observeSystemPreference() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', (e) => {
          if (!localStorage.getItem(this.storageKey)) {
            if (e.matches) {
              this.setVerdeEscuroTheme(false);
            } else {
              this.setFaculdadeTheme(false);
            }
          }
        });
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener((e) => {
          if (!localStorage.getItem(this.storageKey)) {
            if (e.matches) {
              this.setVerdeEscuroTheme(false);
            } else {
              this.setFaculdadeTheme(false);
            }
          }
        });
      }
    }
  }

  toggleTheme() {
    const currentTheme = this.getCurrentTheme();
    const idx = this.themeOrder.indexOf(currentTheme);
    const nextTheme = this.themeOrder[(idx + 1) % this.themeOrder.length];

    if (nextTheme === 'faculdade') {
      this.setFaculdadeTheme();
    } else if (nextTheme === 'verde-escuro') {
      this.setVerdeEscuroTheme();
    }
  }

  setVerdeEscuroTheme(savePreference = true) {
    document.documentElement.classList.remove(this.faculdadeThemeClass);
    document.documentElement.classList.add(this.verdeEscuroThemeClass);
    if (savePreference) {
      localStorage.setItem(this.storageKey, 'verde-escuro');
    }
    this.updateToggleButtonUI();
    document.dispatchEvent(
      new CustomEvent('themeChange', { detail: { theme: 'verde-escuro' } })
    );
  }

  setFaculdadeTheme(savePreference = true) {
    document.documentElement.classList.remove(this.verdeEscuroThemeClass);
    document.documentElement.classList.add(this.faculdadeThemeClass);
    if (savePreference) {
      localStorage.setItem(this.storageKey, 'faculdade');
    }
    this.updateToggleButtonUI();
    document.dispatchEvent(
      new CustomEvent('themeChange', { detail: { theme: 'faculdade' } })
    );
  }

  getCurrentTheme() {
    if (
      document.documentElement.classList.contains(this.verdeEscuroThemeClass)
    ) {
      return 'verde-escuro';
    }
    return 'faculdade';
  }
}

export const themeSwitcher = new ThemeSwitcher();
export default themeSwitcher;
