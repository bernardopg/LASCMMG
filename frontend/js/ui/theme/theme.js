import { dynamicColorSystem } from './dynamicColorSystem.js';

const THEME_STORAGE_KEY = 'lascmmg-theme-preference';
const FACULDADE_THEME_CLASS = 'faculdade-theme'; // Tema "Faculdade" (Verdes e Dourados)
const VERDE_ESCURO_THEME_CLASS = 'verde-escuro-theme'; // Tema "Verde Escuro" (Verde e Preto)
const THEME_ORDER = ['faculdade', 'verde-escuro']; // Ordem de alternância

/**
 * Classe que gerencia a alternância entre os temas disponíveis
 */
class ThemeManager {
  constructor() {
    this.initialSetup();
  }

  /**
   * Configuração inicial do sistema de tema
   */
  initialSetup() {
    // Aplicar o tema preferido do usuário (ou o padrão do sistema)
    this.applyPreferredTheme();

    // Configurar os listeners de eventos (botão e preferência do sistema)
    this.setupEventListeners();

    // Configurar atalho de teclado
    this.setupKeyboardToggle();
  }

  /**
   * Configura os listeners de eventos
   */
  setupEventListeners() {
    // Adicionar listener para o botão de alternância (espera que o botão já exista)
    document.addEventListener('click', (e) => {
      if (e.target.closest('.theme-toggle-btn')) {
        this.toggleTheme();
      }
    });

    // Monitorar mudanças na preferência de tema do sistema
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleChange = (e) => {
        // Só aplicar a mudança automática se o usuário não tiver uma preferência explícita
        // e válida salva.
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        if (!savedTheme || !THEME_ORDER.includes(savedTheme)) {
          if (e.matches) {
            this.setTheme('verde-escuro', false); // Não salvar preferência
          } else {
            this.setTheme('faculdade', false); // Não salvar preferência
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
   * Configura o atalho de teclado (Alt + T) para alternar o tema.
   */
  setupKeyboardToggle() {
    document.addEventListener('keydown', (event) => {
      if (event.altKey && event.key === 't') {
        this.toggleTheme();
        event.preventDefault();
      }
    });
  }

  /**
   * Aplica o tema preferido do usuário ou o padrão do sistema
   */
  applyPreferredTheme() {
    // Verificar se há uma preferência salva
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    // Validar o tema salvo contra a lista de temas permitidos
    if (THEME_ORDER.includes(savedTheme)) {
      this.setTheme(savedTheme, false); // Aplicar tema salvo sem salvar novamente
    } else {
      // Se não houver preferência salva ou for inválida, usar preferência do sistema
      // ou o primeiro tema da lista como padrão.
      if (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      ) {
        this.setTheme('verde-escuro', false); // Padrão para Verde Escuro se o sistema preferir escuro
      } else {
        this.setTheme('faculdade', false); // Padrão para Faculdade (Verdes e Dourados)
      }
      // Opcional: limpar localStorage se o tema salvo for inválido
      if (savedTheme && !THEME_ORDER.includes(savedTheme)) {
        localStorage.removeItem(THEME_STORAGE_KEY);
      }
    }
  }

  /**
   * Alterna entre os temas configurados em THEME_ORDER.
   */
  toggleTheme() {
    const currentTheme = this.getCurrentTheme();
    let currentIndex = THEME_ORDER.indexOf(currentTheme);

    // Se o tema atual não estiver na lista (pode acontecer se o localStorage foi manipulado),
    // defina para o primeiro tema como padrão.
    if (currentIndex === -1) {
      currentIndex = 0;
    }

    const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
    const nextTheme = THEME_ORDER[nextIndex];

    this.setTheme(nextTheme); // Alterna e salva a nova preferência
  }

  setTheme(themeName, savePreference = true) {
    document.documentElement.classList.remove(
      FACULDADE_THEME_CLASS,
      VERDE_ESCURO_THEME_CLASS
    );

    if (themeName === 'faculdade') {
      document.documentElement.classList.add(FACULDADE_THEME_CLASS);
    } else if (themeName === 'verde-escuro') {
      document.documentElement.classList.add(VERDE_ESCURO_THEME_CLASS);
    } else {
      document.documentElement.classList.add(THEME_ORDER[0]);
      themeName = THEME_ORDER[0];
    }

    if (savePreference) {
      localStorage.setItem(THEME_STORAGE_KEY, themeName);
    }

    this.updateToggleButtonUI();

    // Integração: recalcula esquema de cor ao mudar tema
    if (dynamicColorSystem && typeof dynamicColorSystem.updateColorsByTimeOfDay === 'function') {
      dynamicColorSystem.updateColorsByTimeOfDay();
    }

    document.dispatchEvent(
      new CustomEvent('themeChange', { detail: { theme: themeName } })
    );
  }

  /**
   * Atualiza o ícone e o texto do botão de alternância de tema.
   */
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

    // Atualizar aria-label e title do botão
    button.setAttribute(
      'title',
      currentTheme === 'verde-escuro'
        ? 'Mudar para tema Verdes/Dourados'
        : 'Mudar para tema Verde/Preto'
    );

    button.setAttribute(
      'aria-label',
      currentTheme === 'verde-escuro'
        ? 'Ativar tema Verdes/Dourados'
        : 'Ativar tema Verde/Preto'
    );

    button.setAttribute(
      'aria-pressed',
      (currentTheme === 'verde-escuro').toString()
    );
  }

  /**
   * Retorna o tema atual com base nas classes do elemento HTML.
   * @returns {string} 'faculdade' ou 'verde-escuro'
   */
  getCurrentTheme() {
    if (document.documentElement.classList.contains(VERDE_ESCURO_THEME_CLASS)) {
      return 'verde-escuro';
    }
    // Se não for verde-escuro, assume faculdade como padrão ou se a classe estiver presente.
    // Isso também cobre o caso inicial onde nenhuma classe de tema específica pode estar no html.
    return 'faculdade';
  }
}

// Instância única do gerenciador de temas
export const themeManager = new ThemeManager();
export default themeManager;

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
  btn.setAttribute('title', 'Alternar tema');

  const icon = document.createElement('span');
  icon.className = 'theme-icon';
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

  themeManager.updateToggleButtonUI();
}
