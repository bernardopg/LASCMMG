import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="page-not-found flex items-center justify-center pt-16 pb-32">
      <div className="text-center max-w-lg px-6">
        <div className="error-code text-9xl font-bold text-primary mb-6 opacity-25">
          404
        </div>

        <h1 className="text-4xl font-bold mb-4 text-gray-800">
          Página não encontrada
        </h1>

        <p className="text-lg text-gray-600 mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>

        <div className="error-actions flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="btn-primary px-6 py-3 bg-primary text-white rounded-md shadow-sm hover:bg-primary-dark transition-colors duration-200"
          >
            Voltar ao Início
          </Link>

          <Link
            to="/chaveamento"
            className="btn-outline px-6 py-3 border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50 transition-colors duration-200"
          >
            Ver Chaveamento
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
