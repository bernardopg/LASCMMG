import { useState, useEffect, useRef } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useMessage } from '../context/MessageContext';

const Bracket = () => {
  const { currentTournament, loading: tournamentLoading } = useTournament();
  const { showError } = useMessage();
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [printMode, setPrintMode] = useState(false);
  const bracketRef = useRef(null);

  // Buscar dados do chaveamento
  useEffect(() => {
    const fetchBracketData = async () => {
      try {
        setLoading(true);

        // Simulação da chamada API
        setTimeout(() => {
          // Dados simulados para desenvolvimento (simulando uma árvore de eliminação simples)
          const mockBracket = {
            name: currentTournament?.name || 'Torneio de Sinuca',
            rounds: [
              {
                name: 'Quartas de Final',
                matches: [
                  {
                    id: 1,
                    player1: { id: 1, name: 'Carlos Silva' },
                    player2: { id: 2, name: 'João Ferreira' },
                    score1: 3,
                    score2: 1,
                    winner: 1,
                    status: 'finished',
                  },
                  {
                    id: 2,
                    player1: { id: 3, name: 'Pedro Santos' },
                    player2: { id: 4, name: 'Marcos Oliveira' },
                    score1: 3,
                    score2: 2,
                    winner: 3,
                    status: 'finished',
                  },
                  {
                    id: 3,
                    player1: { id: 5, name: 'Rafael Costa' },
                    player2: { id: 6, name: 'Lucas Pereira' },
                    score1: 2,
                    score2: 3,
                    winner: 6,
                    status: 'finished',
                  },
                  {
                    id: 4,
                    player1: { id: 7, name: 'Gabriel Souza' },
                    player2: { id: 8, name: 'Matheus Lima' },
                    score1: 3,
                    score2: 0,
                    winner: 7,
                    status: 'finished',
                  },
                ],
              },
              {
                name: 'Semifinais',
                matches: [
                  {
                    id: 5,
                    player1: { id: 1, name: 'Carlos Silva' },
                    player2: { id: 3, name: 'Pedro Santos' },
                    score1: 3,
                    score2: 4,
                    winner: 3,
                    status: 'finished',
                  },
                  {
                    id: 6,
                    player1: { id: 6, name: 'Lucas Pereira' },
                    player2: { id: 7, name: 'Gabriel Souza' },
                    score1: 2,
                    score2: 3,
                    winner: 7,
                    status: 'finished',
                  },
                ],
              },
              {
                name: 'Final',
                matches: [
                  {
                    id: 7,
                    player1: { id: 3, name: 'Pedro Santos' },
                    player2: { id: 7, name: 'Gabriel Souza' },
                    score1: 1,
                    score2: 3,
                    winner: 7,
                    status: 'finished',
                  },
                ],
              },
            ],
          };

          setBracket(mockBracket);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Erro ao carregar dados do chaveamento:', error);
        showError(
          'Falha ao carregar dados do chaveamento',
          'Verifique sua conexão e tente novamente.'
        );
        setLoading(false);
      }
    };

    fetchBracketData();
  }, [currentTournament, showError]);

  // Função para aumentar o zoom
  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 2));
  };

  // Função para diminuir o zoom
  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  // Função para resetar o zoom
  const resetZoom = () => {
    setScale(1);
  };

  // Alternar modo de impressão
  const togglePrintMode = () => {
    setPrintMode((prev) => !prev);
  };

  // Imprimir chaveamento
  const printBracket = () => {
    window.print();
  };

  // Renderizar um jogo/partida específica
  const renderMatch = (match) => {
    const isFinished = match.status === 'finished';
    const hasWinner = isFinished && match.winner;

    const player1Class =
      hasWinner && match.winner === match.player1.id
        ? 'bg-green-100 border-green-300'
        : '';

    const player2Class =
      hasWinner && match.winner === match.player2.id
        ? 'bg-green-100 border-green-300'
        : '';

    return (
      <div
        key={match.id}
        className="match relative bg-white rounded-md shadow-sm border border-gray-200 mb-4 overflow-hidden"
      >
        <div className={`player player1 p-3 border-b ${player1Class}`}>
          <div className="flex justify-between items-center">
            <span className="player-name font-medium">
              {match.player1?.name || 'TBD'}
            </span>
            <span className="player-score font-bold">
              {isFinished ? match.score1 : '-'}
            </span>
          </div>
        </div>
        <div className={`player player2 p-3 ${player2Class}`}>
          <div className="flex justify-between items-center">
            <span className="player-name font-medium">
              {match.player2?.name || 'TBD'}
            </span>
            <span className="player-score font-bold">
              {isFinished ? match.score2 : '-'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`page-bracket pt-4 ${printMode ? 'print-mode' : ''}`}>
      <div className="container mx-auto px-4">
        <div className="bracket-header mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Chaveamento do Torneio
            {currentTournament && (
              <span className="text-primary"> {currentTournament.name}</span>
            )}
          </h1>

          {/* Controles do chaveamento */}
          <div className="bracket-controls flex flex-wrap justify-between items-center gap-2 print:hidden">
            <div className="bracket-info text-gray-600">
              {bracket && (
                <p>
                  Visualizando {bracket.rounds.length} fases,{' '}
                  {bracket.rounds.reduce(
                    (acc, round) => acc + round.matches.length,
                    0
                  )}{' '}
                  partidas
                </p>
              )}
            </div>

            <div className="bracket-actions flex flex-wrap items-center gap-2">
              {/* Controles de zoom */}
              <div className="zoom-controls flex items-center border rounded-md overflow-hidden bg-white">
                <button
                  onClick={zoomOut}
                  className="p-2 text-gray-600 hover:bg-gray-100 border-r"
                  aria-label="Diminuir zoom"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M19,13H5V11H19V13Z"></path>
                  </svg>
                </button>
                <button
                  onClick={resetZoom}
                  className="p-2 text-gray-600 hover:bg-gray-100 border-r"
                  aria-label="Resetar zoom"
                >
                  <span className="text-sm font-medium">
                    {Math.round(scale * 100)}%
                  </span>
                </button>
                <button
                  onClick={zoomIn}
                  className="p-2 text-gray-600 hover:bg-gray-100"
                  aria-label="Aumentar zoom"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"
                    ></path>
                  </svg>
                </button>
              </div>

              {/* Botão de impressão */}
              <button
                onClick={printBracket}
                className="print-button flex items-center gap-1 px-3 py-2 bg-white border rounded-md text-gray-700 hover:bg-gray-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M19,8A1,1 0 0,0 18,7H6V3H18V7A1,1 0 0,0 19,8M16,11H8V10H16V11M19,11A1,1 0 0,1 18,12H17V21H7V12H6A1,1 0 0,1 5,11A1,1 0 0,1 6,10H18A1,1 0 0,1 19,11M15,14H9V15H15V14M15,17H9V18H15V17Z"
                  ></path>
                </svg>
                <span>Imprimir</span>
              </button>

              {/* Botão para alternar modo de impressão */}
              <button
                onClick={togglePrintMode}
                className={`toggle-print-mode flex items-center gap-1 px-3 py-2 border rounded-md ${
                  printMode
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M15 5H5V15H9V19H19V9H15V5M15 15H19V19H15V15Z"
                  ></path>
                </svg>
                <span>
                  {printMode ? 'Modo Visualização' : 'Modo Impressão'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo do chaveamento */}
        {loading || tournamentLoading ? (
          <div className="loading-spinner flex justify-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : !bracket ? (
          <div className="empty-state text-center p-8 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 mb-4">
              Não foi possível encontrar o chaveamento para este torneio.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <div
            ref={bracketRef}
            className="bracket-container overflow-x-auto print:overflow-visible"
          >
            <div
              className="bracket-wrapper flex transition-transform"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                minWidth: `${100 / scale}%`,
              }}
            >
              {bracket.rounds.map((round, roundIndex) => (
                <div
                  key={roundIndex}
                  className="bracket-round flex-1 px-2 md:px-4"
                >
                  <h3 className="round-title text-center mb-4 font-semibold text-gray-700">
                    {round.name}
                  </h3>

                  <div className="round-matches flex flex-col justify-around h-full">
                    {round.matches.map((match) => renderMatch(match))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Estilos específicos para impressão */}
      <style jsx>{`
        @media print {
          .print-mode .bracket-container {
            width: 100% !important;
            overflow: visible !important;
          }

          .print-mode .bracket-wrapper {
            transform: none !important;
            min-width: 100% !important;
          }

          .print-hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Bracket;
