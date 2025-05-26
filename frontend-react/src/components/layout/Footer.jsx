import { useEffect, useRef } from 'react';
import { FaArrowUp, FaFacebook, FaGithub, FaHeart, FaInstagram, FaTwitter } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Footer = () => {
  // Referencias DOM
  const footerRef = useRef(null);
  const firstLinkRef = useRef(null);
  const scrollButtonRef = useRef(null);

  // Dados estáticos
  const currentYear = new Date().getFullYear();

  // Configuração de links de redes sociais
  const socialLinks = [
    {
      name: 'Facebook',
      url: 'https://facebook.com', // Atualizar com link real
      icon: <FaFacebook className="w-5 h-5" />,
      label: 'Visite nossa página no Facebook',
    },
    {
      name: 'Instagram',
      url: 'https://instagram.com', // Atualizar com link real
      icon: <FaInstagram className="w-5 h-5" />,
      label: 'Siga-nos no Instagram',
    },
    {
      name: 'Twitter',
      url: 'https://twitter.com', // Atualizar com link real
      icon: <FaTwitter className="w-5 h-5" />,
      label: 'Siga-nos no Twitter',
    },
    {
      name: 'GitHub',
      url: 'https://github.com', // Atualizar com link real
      icon: <FaGithub className="w-5 h-5" />,
      label: 'Acesse nosso repositório no GitHub',
    },
  ];

  // Configuração de links de navegação do rodapé
  const footerLinks = [
    { name: 'Sobre', path: '/about' },
    { name: 'Contato', path: '/contact' },
    { name: 'Política de Privacidade', path: '/privacy' },
    { name: 'Termos de Uso', path: '/terms' },
  ];

  // Gerenciamento de navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Só processa eventos se o foco estiver no rodapé
      if (!footerRef.current?.contains(document.activeElement)) return;

      const focusableElements = Array.from(
        footerRef.current?.querySelectorAll('a[href], button') || []
      ).filter((el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));

      if (!focusableElements.length) return;

      const currentIndex = focusableElements.indexOf(document.activeElement);

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown': {
          e.preventDefault();
          const nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
          focusableElements[nextIndex]?.focus();
          break;
        }
        case 'ArrowLeft':
        case 'ArrowUp': {
          e.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
          focusableElements[prevIndex]?.focus();
          break;
        }
        case 'Home':
          e.preventDefault();
          focusableElements[0]?.focus();
          break;
        case 'End':
          e.preventDefault();
          focusableElements[focusableElements.length - 1]?.focus();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Função para scroll suave ao topo com melhor acessibilidade
  const scrollToTop = () => {
    // Anuncia para leitores de tela
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.classList.add('sr-only');
    announcement.textContent = 'Voltando ao topo da página';
    document.body.appendChild(announcement);

    // Adiciona animação ao botão
    if (scrollButtonRef.current) {
      scrollButtonRef.current.classList.add('animate-bounce');

      // Remove classe de animação após conclusão
      setTimeout(() => {
        scrollButtonRef.current?.classList.remove('animate-bounce');
      }, 500);
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    // Após scroll, foca no primeiro elemento focalizável do documento
    setTimeout(() => {
      const firstFocusable = document.querySelector('a[href], button, input, select, textarea');
      if (firstFocusable) {
        firstFocusable.focus();
      }
      // Remove anúncio após mudança de foco
      document.body.removeChild(announcement);
    }, 800);
  };

  // Renderiza seção do logo e título
  const renderLogoSection = () => (
    <div className="flex items-center justify-center md:justify-start mb-4 md:mb-0">
      <Link to="/" aria-label="Ir para página inicial LASCMMG">
        <img
          src="/assets/logo-lascmmg.png"
          alt="LASCMMG Logo"
          className="h-10 mr-3 transition-transform duration-300 hover:scale-105"
          width="40"
          height="40"
        />
      </Link>
      <div className="flex flex-col">
        <span className="text-gray-800 dark:text-gray-100 font-semibold text-lg bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
          LASCMMG
        </span>
        <span className="text-gray-600 dark:text-gray-300 text-xs">
          Liga Acadêmica de Sinuca CMMG
        </span>
      </div>
    </div>
  );

  // Renderiza navegação do rodapé
  const renderFooterNavigation = () => (
    <nav
      className="footer-links flex flex-wrap justify-center gap-3 sm:gap-5 my-4 md:my-0"
      aria-label="Links do rodapé"
    >
      {footerLinks.map((link, index) => (
        <Link
          key={link.path}
          ref={index === 0 ? firstLinkRef : null}
          to={link.path}
          className="footer-link text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light transition-all duration-200 text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-800 rounded px-2 py-1 hover:translate-y-[-2px]"
        >
          {link.name}
        </Link>
      ))}
    </nav>
  );

  // Renderiza seção de redes sociais
  const renderSocialSection = () => (
    <div className="footer-social flex items-center gap-4 mb-4 md:mb-0">
      {socialLinks.map((social) => (
        <a
          key={social.name}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          className="social-link text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-800 rounded-full p-2 hover:bg-gray-100 dark:hover:bg-slate-700"
          aria-label={social.label}
        >
          {social.icon}
        </a>
      ))}
    </div>
  );

  // Renderiza divisor com gradiente
  const renderDivider = () => (
    <div className="relative h-px my-4">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent"></div>
    </div>
  );

  // Renderiza seção de copyright
  const renderCopyrightSection = () => (
    <p className="copyright text-center text-gray-500 dark:text-gray-400 text-xs md:text-sm">
      &copy; {currentYear} Liga Acadêmica de Sinuca de Ciências Médicas de Minas Gerais. Todos os
      direitos reservados.
      <span className="inline-flex items-center ml-1">
        Feito com <FaHeart className="mx-1 text-red-500 animate-pulse h-3 w-3" aria-hidden="true" />{' '}
        no Brasil
      </span>
    </p>
  );

  // Renderiza botão de voltar ao topo
  const renderScrollToTopButton = () => (
    <div className="mt-2 md:mt-0">
      <button
        ref={scrollButtonRef}
        onClick={scrollToTop}
        className="group flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-800 rounded px-3 py-1 hover:bg-gray-50 dark:hover:bg-slate-700"
        aria-label="Voltar ao topo da página"
      >
        <span>Voltar ao topo</span>
        <FaArrowUp
          className="h-3 w-3 transition-transform duration-300 group-hover:-translate-y-1"
          aria-hidden="true"
        />
      </button>
    </div>
  );

  // Renderiza conteúdo principal do rodapé
  const renderFooterContent = () => (
    <div className="footer-content flex flex-col md:flex-row justify-between items-center gap-4">
      {/* Logo e título */}
      {renderLogoSection()}

      {/* Links de navegação */}
      {renderFooterNavigation()}

      {/* Redes sociais */}
      {renderSocialSection()}
    </div>
  );

  // Renderiza seção inferior com copyright e botão de scroll
  const renderBottomSection = () => (
    <div className="flex flex-col md:flex-row justify-between items-center gap-3">
      {/* Copyright */}
      {renderCopyrightSection()}

      {/* Botão de voltar ao topo */}
      {renderScrollToTopButton()}
    </div>
  );

  return (
    <footer
      ref={footerRef}
      className="footer bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 py-6 px-4 sm:px-6 mt-auto transition-all duration-300 print:hidden shadow-inner"
      role="contentinfo"
      aria-label="Rodapé do site"
    >
      <div className="container mx-auto">
        {/* Conteúdo principal do rodapé */}
        {renderFooterContent()}

        {/* Divisor */}
        {renderDivider()}

        {/* Seção inferior */}
        {renderBottomSection()}
      </div>
    </footer>
  );
};

export default Footer;
