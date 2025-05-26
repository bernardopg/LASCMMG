import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

// Hook personalizado para facilitar o uso do contexto
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

// Temas disponíveis
const THEMES = {
  light: 'light',
  dark: 'dark',
  system: 'system',
  custom: 'custom', // Adicionando suporte para temas personalizados
};

// Paletas de cores para temas personalizados
const DEFAULT_THEME_COLORS = {
  light: {
    primary: '#1a73e8',
    secondary: '#4285f4',
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#202124',
    border: '#e0e0e0',
  },
  dark: {
    primary: '#8ab4f8',
    secondary: '#4285f4',
    background: '#202124',
    surface: '#303134',
    text: '#e8eaed',
    border: '#5f6368',
  },
};

export const ThemeProvider = ({ children }) => {
  // Estado para armazenar a preferência de tema
  const [themePreference, setThemePreference] = useState(() => {
    // Verifica se existe um tema salvo no localStorage
    const savedTheme = localStorage.getItem('appTheme');
    if (savedTheme) {
      return savedTheme;
    }
    return THEMES.system; // Padrão: usar preferência do sistema
  });

  // Estado para armazenar o tema atual mostrado (light ou dark)
  const [currentTheme, setCurrentTheme] = useState(THEMES.light);

  // Estado para armazenar cores personalizadas
  const [customColors, setCustomColors] = useState(() => {
    const savedCustomColors = localStorage.getItem('customThemeColors');
    if (savedCustomColors) {
      try {
        return JSON.parse(savedCustomColors);
      } catch (error) {
        console.error('Erro ao carregar cores personalizadas:', error);
      }
    }
    return DEFAULT_THEME_COLORS;
  });

  // Detecta mudanças na preferência de cor do sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (themePreference === THEMES.system) {
        setCurrentTheme(mediaQuery.matches ? THEMES.dark : THEMES.light);
      }
    };

    // Configuração inicial
    handleChange();

    // Listener para mudanças na preferência do sistema
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themePreference]);

  // Efeito para aplicar o tema atual
  useEffect(() => {
    const root = window.document.documentElement;
    let actualTheme = themePreference;

    // Se a preferência for 'system', determina o tema com base na preferência do sistema
    if (themePreference === THEMES.system) {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? THEMES.dark
        : THEMES.light;
    }

    // Atualiza o tema atual
    setCurrentTheme(actualTheme);

    // Aplica a classe 'dark' ao elemento HTML quando o tema é escuro
    if (actualTheme === THEMES.dark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    }

    // Aplicar cores personalizadas se estiver usando tema personalizado
    if (themePreference === THEMES.custom) {
      // Aplicar variáveis CSS para o tema personalizado
      const colors = customColors[actualTheme === THEMES.dark ? 'dark' : 'light'];
      Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
      });
    } else {
      // Remover variáveis CSS personalizadas
      const colorVars = ['primary', 'secondary', 'background', 'surface', 'text', 'border'];
      colorVars.forEach((key) => {
        root.style.removeProperty(`--color-${key}`);
      });
    }

    // Salva a preferência no localStorage
    localStorage.setItem('appTheme', themePreference);

    // Atualizar meta tag de tema para dispositivos móveis
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        actualTheme === THEMES.dark ? customColors.dark.background : customColors.light.background
      );
    }
  }, [themePreference, customColors]);

  // Função para alternar entre os temas light e dark
  const toggleTheme = useCallback(() => {
    setThemePreference((prev) => {
      if (prev === THEMES.dark) return THEMES.light;
      if (prev === THEMES.light) return THEMES.dark;

      // Se for 'system', verifica o tema atual e muda para o oposto
      return currentTheme === THEMES.dark ? THEMES.light : THEMES.dark;
    });
  }, [currentTheme]);

  // Função para definir um tema específico
  const setTheme = useCallback((theme) => {
    if (Object.values(THEMES).includes(theme)) {
      setThemePreference(theme);
    } else {
      console.warn(
        `Tema inválido: ${theme}. Use um dos seguintes: ${Object.values(THEMES).join(', ')}`
      );
    }
  }, []);

  // Função para usar o tema do sistema
  const useSystemTheme = useCallback(() => {
    setThemePreference(THEMES.system);
  }, []);

  // Função para atualizar cores personalizadas
  const updateCustomColors = useCallback((newColors) => {
    setCustomColors((prev) => {
      const updated = {
        ...prev,
        ...newColors,
      };

      localStorage.setItem('customThemeColors', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Função para aplicar tema personalizado
  const applyCustomTheme = useCallback(
    (colors) => {
      if (colors) {
        updateCustomColors(colors);
      }
      setThemePreference(THEMES.custom);
    },
    [updateCustomColors]
  );

  // Função para resetar para as cores padrão
  const resetToDefaultColors = useCallback(() => {
    setCustomColors(DEFAULT_THEME_COLORS);
    localStorage.setItem('customThemeColors', JSON.stringify(DEFAULT_THEME_COLORS));
  }, []);

  const value = {
    theme: currentTheme,
    themePreference,
    toggleTheme,
    setTheme,
    useSystemTheme,
    isSystemTheme: themePreference === THEMES.system,
    isDarkTheme: currentTheme === THEMES.dark,
    isLightTheme: currentTheme === THEMES.light,
    isCustomTheme: themePreference === THEMES.custom,
    customColors,
    updateCustomColors,
    applyCustomTheme,
    resetToDefaultColors,
    THEMES, // Exporta constantes de tema para uso em componentes
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;
