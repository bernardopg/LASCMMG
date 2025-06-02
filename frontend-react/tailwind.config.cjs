const { defineConfig } = require('tailwindcss/config');

module.exports = defineConfig({
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,vue}', './public/**/*.html'],
  theme: {
    extend: {
      // Fontes customizadas
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'system-ui', 'sans-serif'],
        body: ['Montserrat', 'system-ui', 'sans-serif'],
      },

      // Cores customizadas - Esquema Verde/Lime (Modo Escuro)
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        secondary: {
          50: '#1a1a1a',
          100: '#2d2d2d',
          200: '#404040',
          300: '#525252',
          400: '#737373',
          500: '#a3a3a3',
          600: '#d4d4d4',
          700: '#e5e5e5',
          800: '#f5f5f5',
          900: '#fafafa',
          950: '#ffffff',
        },
        accent: {
          50: '#f7fee7',
          100: '#ecfccb',
          200: '#d9f99d',
          300: '#bef264',
          400: '#a3e635',
          500: '#84cc16',
          600: '#65a30d',
          700: '#4d7c0f',
          800: '#365314',
          900: '#1a2e05',
          950: '#0f1b02',
        },
      },

      // Gradientes customizados
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
        'gradient-accent': 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
        'gradient-hero': 'linear-gradient(135deg, #14532d 0%, #052e16 50%, #1a2e05 100%)',
        'gradient-overlay': 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.8) 100%)',
        'gradient-glass':
          'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },

      // Shadows customizadas
      boxShadow: {
        primary: '0 4px 6px -1px rgba(22, 163, 74, 0.1), 0 2px 4px -1px rgba(22, 163, 74, 0.06)',
        'primary-lg':
          '0 20px 25px -5px rgba(22, 163, 74, 0.1), 0 10px 10px -5px rgba(22, 163, 74, 0.04)',
        secondary: '0 4px 6px -1px rgba(45, 45, 45, 0.1), 0 2px 4px -1px rgba(45, 45, 45, 0.06)',
        'secondary-lg':
          '0 20px 25px -5px rgba(45, 45, 45, 0.1), 0 10px 10px -5px rgba(45, 45, 45, 0.04)',
        accent: '0 4px 6px -1px rgba(132, 204, 22, 0.1), 0 2px 4px -1px rgba(132, 204, 22, 0.06)',
        'accent-lg':
          '0 20px 25px -5px rgba(132, 204, 22, 0.1), 0 10px 10px -5px rgba(132, 204, 22, 0.04)',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glow-primary': '0 0 20px rgba(22, 163, 74, 0.4)',
        'glow-accent': '0 0 20px rgba(132, 204, 22, 0.4)',
        'inner-glow': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        neumorphism: '9px 9px 16px #0a0a0a, -9px -9px 16px #2a2a2a',
      },

      // Espaçamentos customizados
      spacing: {
        18: 'var(--spacing-18)',
        88: 'var(--spacing-88)',
        112: 'var(--spacing-112)',
        128: 'var(--spacing-128)',
      },

      // Border radius modernos
      borderRadius: {
        xl2: 'var(--radius-xl2)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        '4xl': 'var(--radius-4xl)',
      },

      // Z-index organizados
      zIndex: {
        header: 'var(--z-header)',
        sidebar: 'var(--z-sidebar)',
        overlay: 'var(--z-overlay)',
        modal: 'var(--z-modal)',
        tooltip: 'var(--z-tooltip)',
        dropdown: 'var(--z-dropdown)',
        notification: 'var(--z-notification)',
        max: 'var(--z-max)',
      },

      // Backdrop blur customizado
      backdropBlur: {
        xs: 'var(--backdrop-blur-xs)',
        sm: 'var(--backdrop-blur-sm)',
        md: 'var(--backdrop-blur-md)',
        lg: 'var(--backdrop-blur-lg)',
        xl: 'var(--backdrop-blur-xl)',
        '2xl': 'var(--backdrop-blur-2xl)',
      },

      // Tamanhos de containers responsivos
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
      },

      // Breakpoints customizados
      screens: {
        xs: '475px',
        '3xl': '1600px',
      },
    },
  },

  // Plugins para funcionalidades extras
  plugins: [
    // Plugin para forms melhorados
    function ({ addUtilities, theme }) {
      const newUtilities = {
        '.glass': {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-primary': {
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(134, 239, 172, 0.2)',
        },
        '.glass-accent': {
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(252, 211, 77, 0.2)',
        },
        '.text-gradient-primary': {
          background: 'var(--gradient-primary)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        },
        '.text-gradient-accent': {
          background: 'var(--gradient-accent)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        },
        '.text-gradient-hero': {
          background: 'var(--gradient-hero)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        },
      };
      addUtilities(newUtilities);
    },
  ],

  // Configurações de otimização
  corePlugins: {
    preflight: true,
  },

  // Configurações experimentais do v4.1
  experimental: {
    optimizeUniversalDefaults: true,
  },

  // Para melhor performance em desenvolvimento
  future: {
    hoverOnlyWhenSupported: true,
  },
});
