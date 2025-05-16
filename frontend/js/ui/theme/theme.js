import dynamicColorSystem from './dynamicColorSystem.js';

/**
 * ThemeManager moderno: aplica o tema institucional moderno da LASCMMG.
 * Implementa o sistema de design atualizado com cores dinâmicas e melhor experiência visual.
 */
class ThemeManager {
  constructor() {
    this.currentTheme = 'verde-escuro-theme-modern';
    this.systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.timeOfDay = this.getTimeOfDay();
  }

  /**
   * Configura o tema inicial e inicia os listeners para mudanças
   */
  initialSetup() {
    // Aplica o tema moderno institucional
    document.body.classList.add(this.currentTheme);

    // Atualiza as cores com base no horário do dia
    this.updateDynamicColors();

    // Configura listener para mudanças de preferência do sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      this.systemPrefersDark = e.matches;
      this.updateDynamicColors();
    });

    // Configura listener para mudanças de horário (a cada hora)
    setInterval(() => {
      const newTimeOfDay = this.getTimeOfDay();
      if (newTimeOfDay !== this.timeOfDay) {
        this.timeOfDay = newTimeOfDay;
        this.updateDynamicColors();
      }
    }, 60 * 60 * 1000); // Verifica a cada hora

    // Notifica outros componentes sobre a mudança de tema
    this.dispatchThemeChangeEvent();
  }

  /**
   * Atualiza as cores dinâmicas com base no horário e preferências do sistema
   */
  updateDynamicColors() {
    // O dynamicColorSystem já gerencia automaticamente as cores com base no horário
    // Este método é mantido para compatibilidade com código existente
    if (dynamicColorSystem) {
      dynamicColorSystem.updateTimeBasedColors();
    }
  }

  /**
   * Determina o período do dia (manhã, tarde, noite)
   * @returns {string} Período do dia ('morning', 'afternoon', 'evening', 'night')
   */
  getTimeOfDay() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return 'morning';
    } else if (hour >= 12 && hour < 18) {
      return 'afternoon';
    } else if (hour >= 18 && hour < 22) {
      return 'evening';
    } else {
      return 'night';
    }
  }

  /**
   * Notifica outros componentes sobre a mudança de tema
   */
  dispatchThemeChangeEvent() {
    document.dispatchEvent(
      new CustomEvent('themeChange', {
        detail: {
          theme: this.currentTheme,
          timeOfDay: this.timeOfDay,
          systemPrefersDark: this.systemPrefersDark
        }
      })
    );
  }

  /**
   * Aplica ajustes de contraste para melhorar a acessibilidade
   * @param {boolean} highContrast - Se deve aplicar alto contraste
   */
  setAccessibilityContrast(highContrast) {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    this.dispatchThemeChangeEvent();
  }
}

export const themeManager = new ThemeManager();
export default themeManager;
