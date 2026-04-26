import { useReducer, useEffect, useCallback } from 'react';
import { Board } from './components/Board';
import { gameReducer } from './gameReducer';
import { generateRandomShips } from './lib/shipPlacement';
import { getAIShot } from './lib/aiPlayer';
import { GameState } from './lib/types';

const initialState: GameState = {
  player: {
    ships: [],
    board: Array(10).fill(null).map((_, row) =>
      Array(10).fill(null).map((_, col) => ({
        row,
        col,
        status: 'empty' as const,
      }))
    ),
    shots: new Set(),
  },
  ai: {
    ships: [],
    board: Array(10).fill(null).map((_, row) =>
      Array(10).fill(null).map((_, col) => ({
        row,
        col,
        status: 'empty' as const,
      }))
    ),
    shots: new Set(),
  },
  currentTurn: 'player',
  gameStatus: 'setup',
  lastHit: null,
  message: 'Click "Randomize" to place ships.',
  aiTargetQueue: [],
  aiMode: 'hunt',
};

function App() {
  const [gameState, dispatch] = useReducer(gameReducer, initialState);

  const placeNewShips = useCallback(() => {
    const playerShips = generateRandomShips();
    const aiShips = generateRandomShips();
    dispatch({ type: 'PLACE_SHIPS', playerShips, aiShips });
  }, []);

  useEffect(() => {
    placeNewShips();
  }, [placeNewShips]);

  useEffect(() => {
    if (gameState.gameStatus === 'aiTurn') {
      const timer = setTimeout(() => {
        const aiShot = getAIShot(gameState);
        if (aiShot) {
          const [row, col] = aiShot;
          dispatch({ type: 'AI_SHOT', row, col });
        }
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [gameState.gameStatus, gameState.aiTargetQueue]);

  const handleCellClick = (row: number, col: number) => {
    if (gameState.gameStatus === 'playerTurn') {
      dispatch({ type: 'PLAYER_SHOT', row, col });
    }
  };

  const handleRandomize = () => {
    placeNewShips();
  };

  const handleStartGame = () => {
    dispatch({ type: 'START_GAME' });
  };

  const handleResetGame = () => {
    dispatch({ type: 'RESET_GAME' });
    placeNewShips();
  };

  const isGameOver = gameState.gameStatus === 'playerWon' || gameState.gameStatus === 'aiWon';

  const playerShipsSunk = gameState.player.ships.filter(s => s.sunk).length;
  const aiShipsSunk = gameState.ai.ships.filter(s => s.sunk).length;
  const totalShips = gameState.player.ships.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-white tracking-wide">Battleship</h1>

        {/* Score bar */}
        {gameState.gameStatus !== 'setup' && totalShips > 0 && (
          <div className="flex justify-center gap-8 mb-4 text-sm font-medium text-blue-100">
            <span>Your sunk: {playerShipsSunk}/{totalShips}</span>
            <span>AI sunk: {aiShipsSunk}/{totalShips}</span>
          </div>
        )}

        {/* Status Message */}
        <div className="text-center mb-4">
          <div className={`inline-block px-6 py-3 rounded-lg font-semibold text-white shadow-lg ${
            gameState.gameStatus === 'playerWon' ? 'bg-green-600' :
            gameState.gameStatus === 'aiWon' ? 'bg-red-600' :
            gameState.gameStatus === 'aiTurn' ? 'bg-yellow-600' :
            'bg-blue-600'
          }`}>
            {gameState.message}
          </div>
        </div>

        {/* Game Controls */}
        <div className="flex justify-center gap-4 mb-6">
          {gameState.gameStatus === 'setup' && (
            <>
              <button
                onClick={handleRandomize}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors font-semibold shadow-md"
              >
                Randomize
              </button>
              <button
                onClick={handleStartGame}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-400 transition-colors font-semibold shadow-md"
              >
                Start Game
              </button>
            </>
          )}
          
          {isGameOver && (
            <button
              onClick={handleResetGame}
              className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-400 transition-colors font-semibold shadow-md"
            >
              Play Again
            </button>
          )}
        </div>

        {/* Game Boards */}
        <div className="flex flex-col lg:flex-row justify-center items-start gap-8 lg:gap-12">
          {/* Player Board */}
          <div className="flex flex-col items-center">
            <Board
              player={gameState.player}
              title="Your Fleet"
              isPlayerBoard={true}
              isClickable={false}
            />
            
            {/* Ship Status */}
            <div className="mt-4 bg-white/90 rounded-lg p-4 shadow-md w-full max-w-xs">
              <h3 className="font-semibold mb-2 text-gray-800">Your Ships:</h3>
              <div className="space-y-1">
                {gameState.player.ships.map(ship => (
                  <div
                    key={ship.id}
                    className={`text-sm flex items-center gap-2 ${
                      ship.sunk ? 'text-red-600 line-through' : 'text-gray-700'
                    }`}
                  >
                    <span className="flex gap-0.5">
                      {Array.from({ length: ship.size }, (_, i) => (
                        <span
                          key={i}
                          className={`inline-block w-3 h-3 rounded-sm ${
                            ship.sunk ? 'bg-red-800' : i < ship.hits ? 'bg-red-500' : 'bg-gray-600'
                          }`}
                        />
                      ))}
                    </span>
                    <span>{ship.type.charAt(0).toUpperCase() + ship.type.slice(1)}</span>
                    {ship.sunk && <span className="text-red-600 font-semibold">SUNK</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Board */}
          <div className="flex flex-col items-center">
            <Board
              player={gameState.ai}
              title="AI Waters"
              isPlayerBoard={false}
              isClickable={gameState.gameStatus === 'playerTurn'}
              onCellClick={handleCellClick}
            />
            
            {/* AI Ship Status */}
            <div className="mt-4 bg-white/90 rounded-lg p-4 shadow-md w-full max-w-xs">
              <h3 className="font-semibold mb-2 text-gray-800">AI Ships:</h3>
              <div className="space-y-1">
                {gameState.ai.ships.map(ship => (
                  <div
                    key={ship.id}
                    className={`text-sm flex items-center gap-2 ${
                      ship.sunk ? 'text-red-600 line-through' : 'text-gray-400'
                    }`}
                  >
                    <span className="flex gap-0.5">
                      {Array.from({ length: ship.size }, (_, i) => (
                        <span
                          key={i}
                          className={`inline-block w-3 h-3 rounded-sm ${
                            ship.sunk ? 'bg-red-800' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </span>
                    <span>{ship.sunk ? ship.type.charAt(0).toUpperCase() + ship.type.slice(1) : '???'}</span>
                    {ship.sunk && <span className="text-red-600 font-semibold">SUNK</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex justify-center">
          <div className="bg-white/90 rounded-lg px-6 py-3 shadow-md flex flex-wrap gap-4 text-xs text-gray-700">
            <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 bg-blue-100 border border-gray-400 rounded-sm" /> Water</span>
            <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 bg-gray-700 border border-gray-400 rounded-sm" /> Ship</span>
            <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 bg-red-600 border border-gray-400 rounded-sm" /> Hit</span>
            <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 bg-gray-300 border border-gray-400 rounded-sm" /> Miss</span>
            <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 bg-red-800 border border-gray-400 rounded-sm" /> Sunk</span>
          </div>
        </div>

        {/* Game Instructions */}
        {gameState.gameStatus === 'setup' && (
          <div className="mt-6 text-center text-blue-200">
            <p className="mb-2">Click &quot;Randomize&quot; to generate new ship positions, then &quot;Start Game&quot; to begin!</p>
            <p className="text-sm text-blue-300">Click on the AI&apos;s grid to fire during your turn.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
