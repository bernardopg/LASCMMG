import React, { memo } from 'react';

/**
 * Componentes memoizados para otimizar performance
 * Evita re-renders desnecessários em componentes que recebem props estáveis
 */

// Card de Torneio memoizado
export const TournamentCard = memo(({ tournament, onClick, onEdit, onDelete, isAdmin = false }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'ativo':
      case 'em andamento':
        return 'bg-success-100 text-success-800 dark:bg-success-800 dark:text-success-100';
      case 'finalizado':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
      case 'cancelado':
        return 'bg-danger-100 text-danger-800 dark:bg-danger-800 dark:text-danger-100';
      case 'agendado':
        return 'bg-info-100 text-info-800 dark:bg-info-800 dark:text-info-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="card-body">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {tournament.name}
          </h3>
          <span className={`badge ${getStatusColor(tournament.status)}`}>
            {tournament.status}
          </span>
        </div>

        {tournament.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {tournament.description}
          </p>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Data:</span>
            <span className="font-medium">{formatDate(tournament.date)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Participantes:</span>
            <span className="font-medium">{tournament.current_participants || 0}/{tournament.max_participants || 'N/A'}</span>
          </div>
          {tournament.entry_fee && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Taxa de Inscrição:</span>
              <span className="font-medium">R$ {tournament.entry_fee}</span>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => onClick?.(tournament)}
            className="btn btn-primary btn-sm flex-1"
          >
            Ver Detalhes
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => onEdit?.(tournament)}
                className="btn btn-outline btn-sm"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete?.(tournament)}
                className="btn btn-danger btn-sm"
              >
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
export const TournamentList = memo(({ tournaments, onTournamentClick, onTournamentEdit, onTournamentDelete, isAdmin = false }) => {
  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <svg className="mx-auto w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Nenhum torneio encontrado
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Não há torneios disponíveis no momento.
        </p>
      </div>
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
});

TournamentList.displayName = 'TournamentList';

// Card de Jogador memoizado
export const PlayerCard = memo(({ player, onClick, onEdit, onDelete, showActions = true }) => {
  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="card-body">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {player.name?.charAt(0)?.toUpperCase() || 'P'}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {player.name}
            </h3>
            {player.email && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {player.email}
              </p>
            )}
          </div>
        </div>

        {(player.stats || player.tournaments_count !== undefined) && (
          <div className="space-y-2 mb-4">
            {player.tournaments_count !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Torneios:</span>
                <span className="font-medium">{player.tournaments_count}</span>
              </div>
            )}
            {player.stats?.wins !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Vitórias:</span>
                <span className="font-medium">{player.stats.wins}</span>
              </div>
            )}
            {player.stats?.losses !== undefined && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Derrotas:</span>
                <span className="font-medium">{player.stats.losses}</span>
              </div>
            )}
          </div>
        )}

        {showActions && (
          <div className="flex space-x-2">
            <button
              onClick={() => onClick?.(player)}
              className="btn btn-primary btn-sm flex-1"
            >
              Ver Perfil
            </button>
            {onEdit && (
              <button
                onClick={() => onEdit(player)}
                className="btn btn-outline btn-sm"
              >
                Editar
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(player)}
                className="btn btn-danger btn-sm"
              >
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
export const PlayerList = memo(({ players, onPlayerClick, onPlayerEdit, onPlayerDelete, showActions = true }) => {
  if (!players || players.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <svg className="mx-auto w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Nenhum jogador encontrado
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Não há jogadores cadastrados no momento.
        </p>
      </div>
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
});

PlayerList.displayName = 'PlayerList';

// Componente de Loading Skeleton memoizado
export const LoadingSkeleton = memo(({ count = 1, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card animate-pulse">
          <div className="card-body">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
            </div>
            <div className="flex space-x-2 mt-4">
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded flex-1"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Componente de Paginação memoizado
export const Pagination = memo(({
  currentPage,
  totalPages,
  onPageChange,
  onPreviousPage,
  onNextPage,
  showPageNumbers = true,
  maxPageNumbers = 5
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const delta = Math.floor(maxPageNumbers / 2);
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const pageNumbers = showPageNumbers ? getPageNumbers() : [];

  return (
    <div className="flex items-center justify-center space-x-2 mt-6">
      <button
        onClick={onPreviousPage}
        disabled={currentPage === 1}
        className="btn btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Anterior
      </button>

      {showPageNumbers && (
        <div className="flex space-x-1">
          {pageNumbers.map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' ? onPageChange(page) : null}
              disabled={page === '...' || page === currentPage}
              className={`btn btn-sm min-w-[40px] ${
                page === currentPage
                  ? 'btn-primary'
                  : page === '...'
                  ? 'btn-ghost cursor-default'
                  : 'btn-outline'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onNextPage}
        disabled={currentPage === totalPages}
        className="btn btn-outline btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Próximo
      </button>
    </div>
  );
});

Pagination.displayName = 'Pagination';
