/**
 * Sistema de Cores Dinâmicas - LASCMMG
 * Versão 2.0 - Design System Moderno
 *
 * Este módulo implementa um sistema de cores dinâmicas que se adapta ao horário do dia
 * e às preferências do sistema do usuário para proporcionar uma experiência visual otimizada.
 */

export class DynamicColorSystem {
  constructor() {
    this.currentTimeOfDay = null;
    this.systemPrefersDark = false;
    this.root = document.documentElement;

    // Inicializa o sistema
    this.init();
  }

  /**
   * Inicializa o sistema de cores dinâmicas
   */
  init() {
    // Detecta preferência do sistema (claro/escuro)
    this.detectSystemPreference();

    // Aplica cores baseadas no horário atual
    this.updateTimeBasedColors();

    // Configura os observadores para mudanças
    this.setupObservers();

    // Agenda atualizações periódicas
    this.scheduleUpdates();
  }

  /**
   * Detecta se o sistema do usuário prefere tema escuro
   */
  detectSystemPreference() {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemPrefersDark = darkModeMediaQuery.matches;

    // Adiciona classe ao body para indicar preferência do sistema
    document.body.classList.toggle('system-prefers-dark', this.systemPrefersDark);
  }

  /**
   * Configura observadores para mudanças nas preferências do sistema
   */
  setupObservers() {
    // Observa mudanças na preferência de tema do sistema
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeMediaQuery.addEventListener('change', (e) => {
      this.systemPrefersDark = e.matches;
      document.body.classList.toggle('system-prefers-dark', this.systemPrefersDark);
      this.updateTimeBasedColors();
    });
  }

  /**
   * Agenda atualizações periódicas das cores
   */
  scheduleUpdates() {
    // Atualiza a cada hora
    setInterval(() => {
      this.updateTimeBasedColors();
    }, 60 * 60 * 1000); // 1 hora

    // Também atualiza à meia-noite para garantir transição entre dias
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeToMidnight = tomorrow - now;
    setTimeout(() => {
      this.updateTimeBasedColors();
      // Reinicia o agendamento diário
      setInterval(() => {
        this.updateTimeBasedColors();
      }, 24 * 60 * 60 * 1000); // 24 horas
    }, timeToMidnight);
  }

  /**
   * Atualiza as cores com base no horário do dia
   */
  updateTimeBasedColors() {
    const hour = new Date().getHours();
    let timeOfDay;

    // Determina o período do dia
    if (hour >= 5 && hour < 12) {
      timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 18) {
      timeOfDay = 'afternoon';
    } else {
      timeOfDay = 'evening';
    }

    // Só atualiza se o período mudou
    if (timeOfDay !== this.currentTimeOfDay) {
      this.currentTimeOfDay = timeOfDay;
      this.applyTimeBasedColors(timeOfDay);
    }
  }

  /**
   * Aplica as cores específicas para cada período do dia
   * @param {string} timeOfDay - Período do dia ('morning', 'afternoon', 'evening')
   */
  applyTimeBasedColors(timeOfDay) {
    // Remove classes anteriores
    document.body.classList.remove('time-morning', 'time-afternoon', 'time-evening');
    // Adiciona a classe atual
    document.body.classList.add(`time-${timeOfDay}`);

    // Aplica ajustes de cores específicos para cada período
    switch (timeOfDay) {
      case 'morning':
        this.applyMorningColors();
        break;
      case 'afternoon':
        this.applyAfternoonColors();
        break;
      case 'evening':
        this.applyEveningColors();
        break;
    }

    // Dispara evento para outros componentes poderem reagir
    document.dispatchEvent(new CustomEvent('timeOfDayChanged', {
      detail: { timeOfDay }
    }));
  }

  /**
   * Aplica cores para o período da manhã (mais vibrantes e energéticas)
   */
  applyMorningColors() {
    // Ajusta variáveis CSS para cores mais vibrantes
    this.root.style.setProperty('--primary-color', '#217a2b');
    this.root.style.setProperty('--primary-hover', '#17611f');
    this.root.style.setProperty('--primary-active', '#0f4c16');
    this.root.style.setProperty('--primary-rgb', '33, 122, 43');
    
    this.root.style.setProperty('--secondary-color', '#bfa14a');
    this.root.style.setProperty('--secondary-hover', '#a88c36');
    this.root.style.setProperty('--secondary-rgb', '191, 161, 74');

    // Ajusta o contraste e brilho para a manhã
    if (!this.systemPrefersDark) {
      // Versão clara - fundo mais claro e refrescante
      this.root.style.setProperty('--bg-color', '#f8faf8');
      this.root.style.setProperty('--bg-color-secondary', '#edf3ed');
      this.root.style.setProperty('--bg-color-tertiary', '#e2ebe2');
      this.root.style.setProperty('--text-color', '#1a2a1a');
      this.root.style.setProperty('--text-color-muted', '#3a4a3a');
    } else {
      // Versão escura - tons mais vibrantes
      this.root.style.setProperty('--bg-color', '#1a2a1a');
      this.root.style.setProperty('--bg-color-secondary', '#223322');
      this.root.style.setProperty('--bg-color-tertiary', '#2c3e2c');
      this.root.style.setProperty('--text-color', '#ffffff');
      this.root.style.setProperty('--text-color-muted', 'rgba(255, 255, 255, 0.8)');
    }
  }

  /**
   * Aplica cores para o período da tarde (esquema padrão institucional)
   */
  applyAfternoonColors() {
    // Cores institucionais padrão
    this.root.style.setProperty('--primary-color', '#217a2b');
    this.root.style.setProperty('--primary-hover', '#17611f');
    this.root.style.setProperty('--primary-active', '#0f4c16');
    this.root.style.setProperty('--primary-rgb', '33, 122, 43');

    this.root.style.setProperty('--secondary-color', '#bfa14a');
    this.root.style.setProperty('--secondary-hover', '#a88c36');
    this.root.style.setProperty('--secondary-rgb', '191, 161, 74');

    // Ajusta o contraste para a tarde
    if (!this.systemPrefersDark) {
      // Versão clara - padrão institucional
      this.root.style.setProperty('--bg-color', '#ffffff');
      this.root.style.setProperty('--bg-color-secondary', '#f5f5f5');
      this.root.style.setProperty('--bg-color-tertiary', '#ebebeb');
      this.root.style.setProperty('--text-color', '#1a2a1a');
      this.root.style.setProperty('--text-color-muted', '#3a4a3a');
    } else {
      // Versão escura - padrão institucional
      this.root.style.setProperty('--bg-color', '#1a2a1a');
      this.root.style.setProperty('--bg-color-secondary', '#223322');
      this.root.style.setProperty('--bg-color-tertiary', '#2c3e2c');
      this.root.style.setProperty('--text-color', '#ffffff');
      this.root.style.setProperty('--text-color-muted', 'rgba(255, 255, 255, 0.7)');
    }
  }

  /**
   * Aplica cores para o período da noite (tons mais suaves para reduzir fadiga visual)
   */
  applyEveningColors() {
    // Cores mais suaves para a noite
    this.root.style.setProperty('--primary-color', '#1b6824');
    this.root.style.setProperty('--primary-hover', '#14541c');
    this.root.style.setProperty('--primary-active', '#0d4014');
    this.root.style.setProperty('--primary-rgb', '27, 104, 36');

    this.root.style.setProperty('--secondary-color', '#a89042');
    this.root.style.setProperty('--secondary-hover', '#8f7a38');
    this.root.style.setProperty('--secondary-rgb', '168, 144, 66');

    // Ajusta o contraste para a noite
    if (!this.systemPrefersDark) {
      // Versão clara - tons mais suaves
      this.root.style.setProperty('--bg-color', '#f5f7f5');
      this.root.style.setProperty('--bg-color-secondary', '#eaefea');
      this.root.style.setProperty('--bg-color-tertiary', '#dfe7df');
      this.root.style.setProperty('--text-color', '#1a2a1a');
      this.root.style.setProperty('--text-color-muted', '#3a4a3a');
    } else {
      // Versão escura - tons mais escuros e suaves
      this.root.style.setProperty('--bg-color', '#162216');
      this.root.style.setProperty('--bg-color-secondary', '#1e2e1e');
      this.root.style.setProperty('--bg-color-tertiary', '#263826');
      this.root.style.setProperty('--text-color', '#f0f0f0');
      this.root.style.setProperty('--text-color-muted', 'rgba(240, 240, 240, 0.7)');
    }

    // Reduz a intensidade das cores para diminuir a fadiga visual
    this.root.style.setProperty('--success-color', '#267a4b');
    this.root.style.setProperty('--warning-color', '#e6cc5c');
    this.root.style.setProperty('--error-color', '#c82333');
  }
}

// Inicializa o sistema de cores dinâmicas
const dynamicColorSystem = new DynamicColorSystem();
export default dynamicColorSystem;
