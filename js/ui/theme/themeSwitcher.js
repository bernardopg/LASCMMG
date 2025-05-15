/**
 * Gerenciador de alternância de temas
 * Para o Sistema de Gerenciamento de Torneios LASCMMG
 */

/**
 * Classe que gerencia a alternância entre os temas disponíveis
 */
class ThemeSwitcher {
  constructor() {
    this.storageKey = 'lascmmg-theme-preference';
    this.faculdadeThemeClass = 'faculdade-theme'; // Tema "Faculdade" (Verdes e Dourados)
    this.verdeEscuroThemeClass = 'verde-escuro-theme'; // Tema "Verde Escuro" (Verde e Preto)
    this.themeOrder = ['faculdade', 'verde-escuro']; // Ordem de alternância
    this.initialSetup();
  }

  /**
   * Configuração inicial do sistema de tema
   */
  initialSetup() {
    // Configurar os listeners de eventos
    this.setupEventListeners();

    // Aplicar o tema preferido do usuário (ou o padrão do sistema)
    this.applyPreferredTheme();

    // Monitorar mudanças na preferência do sistema
    this.observeSystemPreference();
  }

  /**
   * Configura os listeners de eventos
   */
  setupEventListeners() {
    // Adicionar listener para o botão de alternância
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
    const currentTheme = this.getCurrentTheme(); // 'faculdade' ou 'verde-escuro'

    if (iconSpan) {
      if (currentTheme === 'faculdade') {
        iconSpan.textContent = '🎨'; // Ícone para Faculdade (Verdes e Dourados)
      } else if (currentTheme === 'verde-escuro') {
        iconSpan.textContent = '🌲'; // Ícone para Verde Escuro (Verde e Preto)
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

  /**
   * Aplica o tema preferido do usuário ou o padrão do sistema
   */
  applyPreferredTheme() {
    // Verificar se há uma preferência salva
    const savedTheme = localStorage.getItem(this.storageKey);

    // Validar o tema salvo contra a lista de temas permitidos
    if (this.themeOrder.includes(savedTheme)) {
      if (savedTheme === 'verde-escuro') {
        this.setVerdeEscuroTheme();
      } else {
        // 'faculdade'
        this.setFaculdadeTheme();
      }
    } else {
      // Se não houver preferência salva ou for inválida, usar preferência do sistema
      // ou o primeiro tema da lista como padrão.
      if (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        this.setVerdeEscuroTheme(); // Padrão para Verde Escuro se o sistema preferir escuro
      } else {
        this.setFaculdadeTheme(); // Padrão para Faculdade (Verdes e Dourados)
      }
      // Opcional: limpar localStorage se o tema salvo for inválido
      if (savedTheme && !this.themeOrder.includes(savedTheme)) {
        localStorage.removeItem(this.storageKey);
      }
    }
  }

  /**
   * Observa mudanças na preferência de tema do sistema
   */
  observeSystemPreference() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleChange = (e) => {
        // Só aplicar a mudança automática se o usuário não tiver uma preferência explícita
        // e válida salva.
        const savedTheme = localStorage.getItem(this.storageKey);
        if (!savedTheme || !this.themeOrder.includes(savedTheme)) {
          if (e.matches) {
            this.setVerdeEscuroTheme(false); // Não salvar preferência
          } else {
            this.setFaculdadeTheme(false); // Não salvar preferência
          }
        }
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else if (mediaQuery.addListener) {
        // Fallback para navegadores mais antigos
        mediaQuery.addListener(handleChange);
      }
    }
  }

  /**
   * Alterna entre os temas configurados em themeOrder.
   */
  toggleTheme() {
    const currentTheme = this.getCurrentTheme();
    let currentIndex = this.themeOrder.indexOf(currentTheme);

    // Se o tema atual não estiver na lista (pode acontecer se o localStorage foi manipulado),
    // defina para o primeiro tema como padrão.
    if (currentIndex === -1) {
      currentIndex = 0;
    }

    const nextIndex = (currentIndex + 1) % this.themeOrder.length;
    const nextTheme = this.themeOrder[nextIndex];

    if (nextTheme === 'faculdade') {
      this.setFaculdadeTheme();
    } else if (nextTheme === 'verde-escuro') {
      this.setVerdeEscuroTheme();
    }
  }

  /**
   * Define o tema Verde Escuro
   * @param {boolean} savePreference Se deve salvar a preferência do usuário (padrão: true)
   */
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

  /**
   * Define o tema Faculdade (Verdes e Dourados)
   * @param {boolean} savePreference Se deve salvar a preferência do usuário (padrão: true)
   */
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

  /**
   * Retorna o tema atual com base nas classes do elemento HTML.
   * @returns {string} 'faculdade' ou 'verde-escuro'
   */
  getCurrentTheme() {
    if (
      document.documentElement.classList.contains(this.verdeEscuroThemeClass)
    ) {
      return 'verde-escuro';
    }
    // Se não for verde-escuro, assume faculdade como padrão ou se a classe estiver presente.
    // Isso também cobre o caso inicial onde nenhuma classe de tema específica pode estar no html.
    return 'faculdade';
  }
}

// Criar e exportar instância do gerenciador de temas
export const themeSwitcher = new ThemeSwitcher();
export default themeSwitcher;
