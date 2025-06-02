import { Link } from 'react-router-dom';

const NotFound = () => {
  const buttonBaseClasses =
    'inline-flex items-center justify-center px-6 py-3 rounded-lg text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105';
  const primaryButtonClasses = `${buttonBaseClasses} bg-lime-600 hover:bg-lime-700 text-white focus:ring-lime-500`;
  const outlineButtonClasses = `${buttonBaseClasses} border-2 border-slate-500 hover:border-lime-500 text-slate-300 hover:text-lime-400 hover:bg-slate-700/50 focus:ring-lime-500`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-16 pb-24 bg-slate-900 text-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-[10rem] sm:text-[12rem] font-black text-lime-400/20 mb-4 leading-none animate-pulse">
          404
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-gray-100">
          Página Perdida no Espaço
        </h1>

        <p className="text-lg text-slate-400 mb-10">
          Oops! Parece que a página que você está procurando deu um rolê e não voltou.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className={primaryButtonClasses}>
            Voltar ao Início
          </Link>

          <Link to="/brackets" className={outlineButtonClasses}>
            Ver Chaveamentos
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
