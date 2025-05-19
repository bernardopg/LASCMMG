import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer bg-white border-t border-gray-200 py-4 px-6 mt-auto">
      <div className="container mx-auto">
        <div className="footer-content flex flex-col md:flex-row justify-between items-center">
          <div className="footer-logo flex items-center mb-4 md:mb-0">
            <img
              src="/assets/logo.png"
              alt="Logo LASCMMG"
              className="footer-logo-img h-8 mr-2"
            />
            <span className="text-gray-800 font-medium">LASCMMG</span>
          </div>

          <div className="footer-links flex flex-wrap justify-center gap-4 my-3 md:my-0">
            <Link
              to="/"
              className="footer-link text-gray-600 hover:text-primary transition-colors"
            >
              Sobre
            </Link>
            <Link
              to="/"
              className="footer-link text-gray-600 hover:text-primary transition-colors"
            >
              Contato
            </Link>
            <Link
              to="/"
              className="footer-link text-gray-600 hover:text-primary transition-colors"
            >
              Política de Privacidade
            </Link>
          </div>

          <div className="footer-social flex items-center gap-3">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link text-gray-600 hover:text-primary transition-colors"
              aria-label="Facebook"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z"
                ></path>
              </svg>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link text-gray-600 hover:text-primary transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z"
                ></path>
              </svg>
            </a>
          </div>
        </div>

        <p className="copyright text-center text-gray-500 text-sm mt-4">
          &copy; {currentYear} Liga Acadêmica de Sinuca de Ciências Médicas de
          Minas Gerais. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
