import { FaEdit, FaListUl } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';

const AddScoreLandingPage = () => {
  const { currentTournament } = useTournament();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Adicionar Placar</h1>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <p className="text-slate-300 mb-6">
          Para adicionar ou editar um placar, primeiro selecione um torneio ativo e depois navegue
          até a partida desejada na página de gerenciamento do torneio ou no chaveamento.
        </p>

        {currentTournament ? (
          <div className="mb-8 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <p className="text-slate-400 mb-3">
              Torneio atualmente selecionado:{' '}
              <strong className="text-lime-400">{currentTournament.name}</strong>
            </p>
            <Link
              to={`/admin/tournaments/${currentTournament.id}`}
              className="inline-flex items-center px-4 py-2 bg-lime-600 text-white rounded-lg hover:bg-lime-700 transition-colors"
            >
              <FaEdit className="mr-2 h-4 w-4" />
              Gerenciar Partidas de {currentTournament.name}
            </Link>
            <p className="text-xs mt-3 text-slate-500">
              (Você poderá adicionar/editar placares na página de detalhes e gerenciamento do
              torneio)
            </p>
          </div>
        ) : (
          <div className="mb-8 p-4 bg-yellow-800/30 border border-yellow-700/50 rounded-lg">
            <p className="text-yellow-400 font-semibold">Nenhum torneio selecionado no momento.</p>
            <p className="text-yellow-300/80 text-sm mt-1">
              Por favor, selecione um torneio na lista abaixo para continuar.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Link
            to="/tournaments"
            className="inline-flex items-center px-4 py-2 border border-slate-500 text-slate-300 rounded-lg hover:border-lime-500 hover:text-lime-400 transition-colors"
          >
            <FaListUl className="mr-2 h-4 w-4" />
            Ver Lista de Torneios
          </Link>
          <p className="text-sm text-slate-500">
            (Selecione um torneio da lista para ver suas partidas e adicionar placares)
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddScoreLandingPage;
