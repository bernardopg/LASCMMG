import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="page-not-found flex items-center justify-center pt-16 pb-32 bg-gray-50 dark:bg-slate-900">
      <div className="text-center max-w-lg px-6">
        <div className="error-code text-9xl font-bold text-primary dark:text-primary-light mb-6 opacity-25 dark:opacity-40">
          404
        </div>

        <h1 className="text-4xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          Página não encontrada
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>

        <div className="error-actions flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="btn btn-primary px-6 py-3 rounded-md shadow-sm transition-colors duration-200" // btn e btn-primary devem ser responsivos ao tema
          >
            Voltar ao Início
          </Link>

          <Link
            to="/brackets" // Corrigido para /brackets, conforme Sidebar/Header
            className="btn btn-outline px-6 py-3 rounded-md shadow-sm transition-colors duration-200" // btn e btn-outline devem ser responsivos ao tema
          >
            Ver Chaveamento
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
