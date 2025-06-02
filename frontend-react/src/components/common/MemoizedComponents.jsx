import { PackageOpen, Users } from 'lucide-react'; // Icons for EmptyState
import { memo } from 'react';
import { formatDateToLocale } from '../../utils/dateUtils'; // Import date utility
import { getTournamentStatusColorClasses } from '../../utils/uiUtils'; // Import UI utility
import EmptyState from './EmptyState'; // Import EmptyState component

/**
 * Componentes memoizados para otimizar performance
 * Evita re-renders desnecessários em componentes que recebem props estáveis
 */

// Card de Torneio memoizado
export const TournamentCard = memo(({ tournament, onClick, onEdit, onDelete, isAdmin = false }) => {
  // formatDate and getStatusColor are now imported utility functions

  // Define base Tailwind classes for reuse
  const cardBaseClasses =
    'bg-slate-800 shadow-md rounded-xl border border-slate-700 hover:shadow-lime-400/10';
  const cardBodyClasses = 'p-5'; // Adjusted padding
  const badgeClasses = 'px-3 py-1 text-xs font-semibold rounded-full';
  const buttonBaseClasses =
    'px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200';
  const primaryButtonClasses = `${buttonBaseClasses} bg-lime-600 hover:bg-lime-700 text-white focus:ring-lime-500 focus:ring-offset-slate-800 disabled:opacity-60`;
  const outlineButtonClasses = `${buttonBaseClasses} border border-slate-500 hover:border-lime-500 text-slate-300 hover:text-lime-400 hover:bg-slate-700/50 focus:ring-lime-500 focus:ring-offset-slate-800 disabled:opacity-60`;
  const dangerButtonClasses = `${buttonBaseClasses} bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 focus:ring-offset-slate-800 disabled:opacity-60`;

  return (
    <div className={`${cardBaseClasses} transition-shadow duration-300`}>
      <div className={cardBodyClasses}>
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-50">{tournament.name}</h3>
          <span className={`${badgeClasses} ${getTournamentStatusColorClasses(tournament.status)}`}>
            {tournament.status}
          </span>
        </div>

        {tournament.description && (
          <p className="text-gray-400 mb-4 line-clamp-2">{tournament.description}</p>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Data:</span>
            <span className="font-medium">{formatDateToLocale(tournament.date)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Participantes:</span>
            <span className="font-medium">
              {tournament.current_participants || 0}/{tournament.max_participants || 'N/A'}
            </span>
          </div>
          {tournament.entry_fee && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Taxa de Inscrição:</span>
              <span className="font-medium">R$ {tournament.entry_fee}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
          <button
            onClick={() => onClick?.(tournament)}
            className={`${primaryButtonClasses} flex-1`}
          >
            Ver Detalhes
          </button>
          {isAdmin && (
            <>
              <button onClick={() => onEdit?.(tournament)} className={outlineButtonClasses}>
                Editar
              </button>
              <button onClick={() => onDelete?.(tournament)} className={dangerButtonClasses}>
                Excluir
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

TournamentCard.displayName = 'TournamentCard';

// Lista de Torneios memoizada
export const TournamentList = memo(
  ({ tournaments, onTournamentClick, onTournamentEdit, onTournamentDelete, isAdmin = false }) => {
    if (!tournaments || tournaments.length === 0) {
      return (
        <EmptyState
          iconName={PackageOpen} // Using Lucide icon component directly
          title="Nenhum torneio encontrado"
          message="Não há torneios disponíveis no momento."
        />
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tournament) => (
          <TournamentCard
            key={tournament.id}
            tournament={tournament}
            onClick={onTournamentClick}
            onEdit={onTournamentEdit}
            onDelete={onTournamentDelete}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    );
  }
);

TournamentList.displayName = 'TournamentList';

// Card de Jogador memoizado
export const PlayerCard = memo(({ player, onClick, onEdit, onDelete, showActions = true }) => {
  const cardBaseClasses =
    'bg-slate-800 shadow-md rounded-xl border border-slate-700 hover:shadow-lime-400/10';
  const cardBodyClasses = 'p-5';
  const buttonBaseClasses =
    'px-4 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200';
  const primaryButtonClasses = `${buttonBaseClasses} bg-lime-600 hover:bg-lime-700 text-white focus:ring-lime-500 focus:ring-offset-slate-800 disabled:opacity-60`;
  const outlineButtonClasses = `${buttonBaseClasses} border border-slate-500 hover:border-lime-500 text-slate-300 hover:text-lime-400 hover:bg-slate-700/50 focus:ring-lime-500 focus:ring-offset-slate-800 disabled:opacity-60`;
  const dangerButtonClasses = `${buttonBaseClasses} bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 focus:ring-offset-slate-800 disabled:opacity-60`;

  return (
    <div className={`${cardBaseClasses} transition-shadow duration-300`}>
      <div className={cardBodyClasses}>
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-600 via-lime-500 to-amber-400 rounded-full flex items-center justify-center shadow-inner">
            <span className="text-white font-semibold text-xl">
              {player.name?.charAt(0)?.toUpperCase() || 'P'}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-50">{player.name}</h3>
            {player.email && <p className="text-sm text-gray-300">{player.email}</p>}
          </div>
        </div>

        {(player.stats || player.tournaments_count !== undefined) && (
          <div className="space-y-2 mb-4">
            {player.tournaments_count !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Torneios:</span>
                <span className="font-medium">{player.tournaments_count}</span>
              </div>
            )}
            {player.stats?.wins !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Vitórias:</span>
                <span className="font-medium">{player.stats.wins}</span>
              </div>
            )}
            {player.stats?.losses !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Derrotas:</span>
                <span className="font-medium">{player.stats.losses}</span>
              </div>
            )}
          </div>
        )}

        {showActions && (
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
            <button onClick={() => onClick?.(player)} className={`${primaryButtonClasses} flex-1`}>
              Ver Perfil
            </button>
            {onEdit && (
              <button onClick={() => onEdit(player)} className={outlineButtonClasses}>
                Editar
              </button>
            )}
            {onDelete && (
              <button onClick={() => onDelete(player)} className={dangerButtonClasses}>
                Excluir
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

PlayerCard.displayName = 'PlayerCard';

// Lista de Jogadores memoizada
export const PlayerList = memo(
  ({ players, onPlayerClick, onPlayerEdit, onPlayerDelete, showActions = true }) => {
    if (!players || players.length === 0) {
      return (
        <EmptyState
          iconName={Users} // Using Lucide icon component directly
          title="Nenhum jogador encontrado"
          message="Não há jogadores cadastrados no momento."
        />
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            onClick={onPlayerClick}
            onEdit={onPlayerEdit}
            onDelete={onPlayerDelete}
            showActions={showActions}
          />
        ))}
      </div>
    );
  }
);

PlayerList.displayName = 'PlayerList';

// Componente de Loading Skeleton memoizado
export const LoadingSkeleton = memo(({ count = 1, className = '' }) => {
  const skeletonCardClasses =
    'bg-slate-800 shadow-md rounded-xl border border-slate-700 p-5 animate-pulse';

  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={skeletonCardClasses}>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-slate-600 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-600 rounded w-3/4"></div>
              <div className="h-3 bg-slate-600 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-600 rounded"></div>
            <div className="h-3 bg-slate-600 rounded w-2/3"></div>
          </div>
          <div className="flex space-x-2 mt-4">
            <div className="h-8 bg-slate-600 rounded flex-1"></div>
            <div className="h-8 bg-slate-600 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
});

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Componente de Paginação memoizado
export const Pagination = memo(
  ({
    currentPage,
    totalPages,
    onPageChange,
    onPreviousPage,
    onNextPage,
    showPageNumbers = true,
    maxPageNumbers = 5,
  }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const delta = Math.floor(maxPageNumbers / 2);
      let left = Math.max(2, currentPage - delta);
      let right = Math.min(totalPages - 1, currentPage + delta);

      // Adjust if near edges
      if (currentPage - delta < 2) {
        right = Math.min(totalPages - 1, right + (2 - (currentPage - delta)));
      }
      if (currentPage + delta > totalPages - 1) {
        left = Math.max(2, left - (currentPage + delta - (totalPages - 1)));
      }

      const range = [];
      for (let i = left; i <= right; i++) {
        range.push(i);
      }

      const rangeWithDots = [];
      if (left > 2) rangeWithDots.push(1, '...');
      else if (left === 2) rangeWithDots.push(1);

      rangeWithDots.push(...range);

      if (right < totalPages - 1) rangeWithDots.push('...', totalPages);
      else if (right === totalPages - 1 && totalPages > 1) rangeWithDots.push(totalPages);

      // Ensure first page is always present if not already
      if (rangeWithDots[0] !== 1 && totalPages > 1 && left > 1) {
        if (rangeWithDots[0] !== '...' && left > 2) rangeWithDots.unshift(1, '...');
        else if (rangeWithDots[0] !== '...' && left === 2) rangeWithDots.unshift(1);
      } else if (rangeWithDots.length === 0 && totalPages === 1) {
        rangeWithDots.push(1);
      }

      // Remove duplicates that might arise from edge cases with few pages
      const uniqueRange = [...new Set(rangeWithDots)];
      if (uniqueRange.length === 1 && uniqueRange[0] === '...' && totalPages > 1)
        return [1, totalPages];
      if (uniqueRange.length === 2 && uniqueRange[0] === '...' && uniqueRange[1] === totalPages)
        return [1, totalPages];

      return uniqueRange.filter((item, idx, arr) => {
        // Ensure '...' is not duplicated or leading/trailing incorrectly
        if (item === '...') {
          if (idx === 0 && arr.length > 1 && arr[1] === 1) return false; // remove leading '...' if '1' is next
          if (idx === arr.length - 1 && arr.length > 1 && arr[idx - 1] === totalPages) return false; // remove trailing '...' if 'totalPages' is prev
          if (arr[idx - 1] === '...') return false; // remove consecutive '...'
        }
        return true;
      });
    };

    const pageNumbers = showPageNumbers ? getPageNumbers() : [];

    const buttonBase =
      'px-3 py-1.5 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed';
    const activePageClasses = `${buttonBase} bg-lime-600 text-white focus:ring-lime-500`;
    const inactivePageClasses = `${buttonBase} bg-slate-700 hover:bg-slate-600 text-slate-300 focus:ring-lime-500`;
    const dotsClasses = `${buttonBase} bg-transparent text-slate-400 cursor-default`;

    return (
      <div className="flex items-center justify-center space-x-1 sm:space-x-2 mt-8">
        <button
          onClick={onPreviousPage}
          disabled={currentPage === 1}
          className={`${inactivePageClasses} min-w-[80px]`}
        >
          Anterior
        </button>

        {showPageNumbers && (
          <div className="flex items-center space-x-1 sm:space-x-2">
            {pageNumbers.map((page, index) => (
              <button
                key={`page-${page}-${index}`}
                onClick={() => (typeof page === 'number' ? onPageChange(page) : null)}
                disabled={page === '...' || page === currentPage}
                className={`${
                  page === currentPage
                    ? activePageClasses
                    : page === '...'
                      ? dotsClasses
                      : inactivePageClasses
                } min-w-[36px] sm:min-w-[40px]`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onNextPage}
          disabled={currentPage === totalPages}
          className={`${inactivePageClasses} min-w-[80px]`}
        >
          Próximo
        </button>
      </div>
    );
  }
);

Pagination.displayName = 'Pagination';
