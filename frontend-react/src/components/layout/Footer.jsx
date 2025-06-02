import { memo, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaArrowUp } from 'react-icons/fa';
import { footerLinks, socialLinks } from '../../config/footerConfig';

const Copyright = memo(({ currentYear }) => (
  <p className="text-center text-neutral-400 text-xs md:text-sm">
    &copy; {currentYear} Liga Acadêmica de Sinuca de Ciências Médicas de Minas Gerais. Todos os
    direitos reservados.
    <span className="inline-flex items-center ml-1.5">
      Feito com <FaHeart className="mx-1.5 text-red-500 h-3.5 w-3.5" aria-hidden="true" />
      no Brasil
    </span>
  </p>
));

Copyright.displayName = 'Copyright';

const ScrollToTopButton = memo(() => {
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <button
      onClick={scrollToTop}
      className="flex items-center space-x-1.5 text-xs text-neutral-400 hover:text-lime-400
                 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-lime-500
                 focus:ring-offset-2 focus:ring-offset-green-900 rounded-lg px-3 py-1.5
                 hover:bg-green-700/50"
      aria-label="Voltar ao topo da página"
      type="button"
    >
      <span>Voltar ao topo</span>
      <FaArrowUp className="h-3 w-3 text-lime-400" aria-hidden="true" />
    </button>
  );
});

ScrollToTopButton.displayName = 'ScrollToTopButton';

const FooterLogo = memo(() => (
  <div className="flex items-center justify-center md:justify-start">
    <Link to="/" aria-label="Ir para página inicial LASCMMG" className="group flex items-center">
      <img
        src="/assets/logo-lascmmg.png"
        alt="LASCMMG Logo"
        className="h-10 mr-3 transition-transform duration-200 group-hover:scale-105"
        width="40"
        height="40"
      />
      <div className="flex flex-col">
        <span className="font-semibold text-lg bg-gradient-to-r from-lime-400 via-amber-400 to-lime-300 bg-clip-text text-transparent">
          LASCMMG
        </span>
        <span className="text-neutral-400 text-xs">Liga Acadêmica de Sinuca CMMG</span>
      </div>
    </Link>
  </div>
));

FooterLogo.displayName = 'FooterLogo';

const FooterNavigation = memo(() => (
  <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2" aria-label="Links do rodapé">
    {footerLinks.map((link) => (
      <Link
        key={link.path}
        to={link.path}
        className="text-neutral-300 hover:text-lime-400 transition-colors duration-200
                   text-sm font-medium hover:underline focus:outline-none focus:ring-2
                   focus:ring-lime-500 focus:ring-offset-2 focus:ring-offset-green-900
                   rounded px-2 py-1"
      >
        {link.name}
      </Link>
    ))}
  </nav>
));

FooterNavigation.displayName = 'FooterNavigation';

const SocialLinks = memo(() => (
  <div className="flex items-center gap-3">
    {socialLinks.map((social) => (
      <a
        key={social.name}
        href={social.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-neutral-400 hover:text-lime-400 transition-colors duration-200
                   focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2
                   focus:ring-offset-green-900 rounded-full p-2 hover:bg-green-700/50"
        aria-label={social.label}
      >
        <social.icon className="w-5 h-5" />
      </a>
    ))}
  </div>
));

SocialLinks.displayName = 'SocialLinks';

const FooterDivider = memo(() => (
  <div className="h-px my-6 bg-gradient-to-r from-transparent via-green-700/50 to-transparent" />
));

FooterDivider.displayName = 'FooterDivider';

const Footer = () => {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <footer
      className="bg-green-900/80 backdrop-blur-lg border-t border-green-700/60 py-8 px-4 sm:px-6
                 mt-auto print:hidden"
      role="contentinfo"
      aria-label="Rodapé do site"
    >
      <div className="container mx-auto max-w-screen-xl">
        {/* Main content */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
          <FooterLogo />
          <FooterNavigation />
          <SocialLinks />
        </div>

        <FooterDivider />

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <Copyright currentYear={currentYear} />
          <ScrollToTopButton />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
