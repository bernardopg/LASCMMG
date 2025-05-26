import { FaEdit, FaListUl } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';

const AddScoreLandingPage = () => {
  const { currentTournament } = useTournament();

  return (
    <div className="px-4 py-8">
      {' '}
      {/* Removed container mx-auto */}
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Adicionar Placar</h1>
      <div className="card bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
          Para adicionar ou editar um placar, primeiro selecione um torneio e depois a partida
          desejada.
        </p>

        {currentTournament ? (
          <div className="mb-6">
            <p className="text-md mb-2 text-gray-600 dark:text-gray-400">
              Torneio atualmente selecionado:{' '}
              <strong className="text-primary dark:text-primary-light">
                {currentTournament.name}
              </strong>
            </p>
            <Link
              to={`/admin/tournaments/manage/${currentTournament.id}`}
              className="btn btn-primary inline-flex items-center mr-4"
            >
              <FaEdit className="mr-2" /> Gerenciar Partidas de &ldquo;{currentTournament.name}
              &rdquo;
            </Link>
            <p className="text-sm mt-2 text-gray-500 dark:text-gray-500">
              (Você poderá adicionar/editar placares na página de gerenciamento do torneio)
            </p>
          </div>
        ) : (
          <p className="text-md text-yellow-600 dark:text-yellow-400 mb-4">
            Nenhum torneio selecionado no momento.
          </p>
        )}

        <Link to="/tournaments" className="btn btn-outline inline-flex items-center">
          <FaListUl className="mr-2" /> Ver Lista de Torneios
        </Link>
        <p className="text-sm mt-2 text-gray-500 dark:text-gray-500">
          (Selecione um torneio da lista para ver suas partidas)
        </p>
      </div>
    </div>
  );
};

export default AddScoreLandingPage;
