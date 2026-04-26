import { useReducer, useEffect } from 'react';
import { Board } from './components/Board';
import { gameReducer } from './gameReducer';
import { generateRandomShips } from './shipPlacement';
import { getAIShot } from './aiPlayer';
import { GameState } from './types';

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

  // Generate initial ships
  useEffect(() => {
    const playerShips = generateRandomShips();
    const aiShips = generateRandomShips();
    dispatch({ type: 'PLACE_SHIPS', playerShips, aiShips });
  }, []);

  // Handle AI turn
  useEffect(() => {
    if (gameState.gameStatus === 'aiTurn') {
      const timer = setTimeout(() => {
        const aiShot = getAIShot(gameState);
        if (aiShot) {
          const [row, col] = aiShot;
          dispatch({ type: 'AI_SHOT', row, col });
        }
      }, 400); // 400ms delay for AI turn

      return () => clearTimeout(timer);
    }
  }, [gameState.gameStatus, gameState.aiTargetQueue]);

  const handleCellClick = (row: number, col: number) => {
    if (gameState.gameStatus === 'playerTurn') {
      dispatch({ type: 'PLAYER_SHOT', row, col });
    }
  };

  const handleRandomize = () => {
    const playerShips = generateRandomShips();
    const aiShips = generateRandomShips();
    dispatch({ type: 'PLACE_SHIPS', playerShips, aiShips });
  };

  const handleStartGame = () => {
    dispatch({ type: 'START_GAME' });
  };

  const handleResetGame = () => {
    dispatch({ type: 'RESET_GAME' });
    const playerShips = generateRandomShips();
    const aiShips = generateRandomShips();
    dispatch({ type: 'PLACE_SHIPS', playerShips, aiShips });
  };

  const isGameOver = gameState.gameStatus === 'playerWon' || gameState.gameStatus === 'aiWon';

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Battleship</h1>
        
        {/* Status Message */}
        <div className="text-center mb-6">
          <div className={`inline-block px-6 py-3 rounded-lg font-semibold text-white ${
            gameState.gameStatus === 'playerWon' ? 'bg-green-600' :
            gameState.gameStatus === 'aiWon' ? 'bg-red-600' :
            'bg-blue-600'
          }`}>
            {gameState.message}
          </div>
        </div>

        {/* Game Controls */}
        <div className="flex justify-center gap-4 mb-8">
          {gameState.gameStatus === 'setup' && (
            <>
              <button
                onClick={handleRandomize}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
              >
                Randomize
              </button>
              <button
                onClick={handleStartGame}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
              >
                Start Game
              </button>
            </>
          )}
          
          {isGameOver && (
            <button
              onClick={handleResetGame}
              className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold"
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
            <div className="mt-4 bg-white rounded-lg p-4 shadow-md">
              <h3 className="font-semibold mb-2">Your Ships:</h3>
              <div className="space-y-1">
                {gameState.player.ships.map(ship => (
                  <div
                    key={ship.id}
                    className={`text-sm ${
                      ship.sunk ? 'text-red-600 line-through' : 'text-gray-700'
                    }`}
                  >
                    {ship.type.charAt(0).toUpperCase() + ship.type.slice(1)} ({ship.size})
                    {ship.sunk && ' - SUNK'}
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
            
            {/* Ship Status (hidden during game) */}
            <div className="mt-4 bg-white rounded-lg p-4 shadow-md">
              <h3 className="font-semibold mb-2">AI Ships:</h3>
              <div className="space-y-1">
                {gameState.ai.ships.map(ship => (
                  <div
                    key={ship.id}
                    className={`text-sm ${
                      ship.sunk ? 'text-red-600 line-through' : 'text-gray-400'
                    }`}
                  >
                    {ship.sunk ? ship.type.charAt(0).toUpperCase() + ship.type.slice(1) : '???'}
                    {ship.sunk && ` (${ship.size}) - SUNK`}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Game Instructions */}
        {gameState.gameStatus === 'setup' && (
          <div className="mt-8 text-center text-gray-600">
            <p className="mb-2">Click "Randomize" to generate new ship positions, then "Start Game" to begin!</p>
            <p className="text-sm">Click on the AI's grid to fire during your turn.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
