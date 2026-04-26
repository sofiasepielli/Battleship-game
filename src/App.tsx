import { useReducer, useEffect, useCallback, useMemo } from 'react';
import { Board } from './components/Board';
import { gameReducer } from './gameReducer';
import { getAIShot } from './lib/aiPlayer';
import { GameState, ShipType, SHIP_SIZES, SHIP_NAMES } from './lib/types';
import { isValidPlacement, getShipPositions, getOccupiedPositions } from './lib/shipPlacement';

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
  gameStatus: 'placement',
  lastHit: null,
  message: 'Place your Carrier (5 cells). Press R to rotate.',
  aiTargetQueue: [],
  aiMode: 'hunt',
  placement: {
    selectedShipType: 'carrier',
    orientation: 'horizontal',
    placedShips: [],
    hoverCell: null,
  },
};

const ALL_SHIP_TYPES: ShipType[] = ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer'];

function App() {
  const [gameState, dispatch] = useReducer(gameReducer, initialState);

  // Handle keyboard shortcut for rotation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        if (gameState.gameStatus === 'placement') {
          dispatch({ type: 'TOGGLE_ORIENTATION' });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.gameStatus]);

  // AI turn effect
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

  const handlePlacementClick = useCallback((row: number, col: number) => {
    if (gameState.gameStatus === 'placement' && gameState.placement.selectedShipType) {
      dispatch({ type: 'PLACE_SHIP_MANUAL', row, col });
    }
  }, [gameState.gameStatus, gameState.placement.selectedShipType]);

  const handlePlacementHover = useCallback((row: number, col: number) => {
    if (gameState.gameStatus === 'placement') {
      dispatch({ type: 'SET_HOVER', row, col });
    }
  }, [gameState.gameStatus]);

  const handlePlacementLeave = useCallback(() => {
    if (gameState.gameStatus === 'placement') {
      dispatch({ type: 'CLEAR_HOVER' });
    }
  }, [gameState.gameStatus]);

  const handleStartGame = () => {
    dispatch({ type: 'START_GAME' });
  };

  const handleResetGame = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  const handlePickUpShip = (shipType: ShipType) => {
    dispatch({ type: 'PICK_UP_SHIP', shipType });
  };

  // Compute preview cells for placement hover
  const { previewCells, previewValid } = useMemo(() => {
    if (
      gameState.gameStatus !== 'placement' ||
      !gameState.placement.selectedShipType ||
      !gameState.placement.hoverCell
    ) {
      return { previewCells: undefined, previewValid: undefined };
    }

    const { selectedShipType, orientation, placedShips, hoverCell } = gameState.placement;
    const size = SHIP_SIZES[selectedShipType];
    const [hoverRow, hoverCol] = hoverCell;
    const occupied = getOccupiedPositions(placedShips);
    const valid = isValidPlacement(hoverRow, hoverCol, size, orientation, occupied);
    const positions = getShipPositions(hoverRow, hoverCol, size, orientation);
    const cells = new Set<string>();
    positions.forEach(([r, c]) => {
      if (r >= 0 && r < 10 && c >= 0 && c < 10) {
        cells.add(`${r},${c}`);
      }
    });

    return { previewCells: cells, previewValid: valid };
  }, [gameState.gameStatus, gameState.placement]);

  const isGameOver = gameState.gameStatus === 'playerWon' || gameState.gameStatus === 'aiWon';
  const isPlacement = gameState.gameStatus === 'placement';
  const isPlaying = gameState.gameStatus === 'playerTurn' || gameState.gameStatus === 'aiTurn';

  const playerShipsSunk = gameState.player.ships.filter(s => s.sunk).length;
  const aiShipsSunk = gameState.ai.ships.filter(s => s.sunk).length;
  const totalShips = gameState.player.ships.length;
  const allShipsPlaced = gameState.placement.placedShips.length === 5;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-white tracking-wide">Battleship</h1>

        {/* Score bar */}
        {(isPlaying || isGameOver) && totalShips > 0 && (
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
            isPlacement ? 'bg-indigo-600' :
            'bg-blue-600'
          }`}>
            {gameState.message}
          </div>
        </div>

        {/* Placement Controls */}
        {isPlacement && (
          <div className="flex flex-col items-center gap-4 mb-6">
            {/* Ship Selection Panel */}
            <div className="bg-white/90 rounded-lg p-4 shadow-md w-full max-w-md">
              <h3 className="font-semibold mb-3 text-gray-800 text-center">Select a ship to place:</h3>
              <div className="space-y-2">
                {ALL_SHIP_TYPES.map(shipType => {
                  const isPlaced = gameState.placement.placedShips.some(s => s.type === shipType);
                  const isSelected = gameState.placement.selectedShipType === shipType;
                  return (
                    <button
                      key={shipType}
                      onClick={() => {
                        if (isPlaced) {
                          handlePickUpShip(shipType);
                        } else {
                          dispatch({ type: 'SELECT_SHIP', shipType });
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : isPlaced
                          ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="flex gap-0.5">
                          {Array.from({ length: SHIP_SIZES[shipType] }, (_, i) => (
                            <span
                              key={i}
                              className={`inline-block w-3 h-3 rounded-sm ${
                                isSelected ? 'bg-white/80' : isPlaced ? 'bg-green-600' : 'bg-gray-400'
                              }`}
                            />
                          ))}
                        </span>
                        <span>{SHIP_NAMES[shipType]} ({SHIP_SIZES[shipType]})</span>
                      </span>
                      <span className="text-xs">
                        {isPlaced ? '✓ Placed (click to move)' : isSelected ? 'Selected' : 'Click to select'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => dispatch({ type: 'TOGGLE_ORIENTATION' })}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 transition-colors font-semibold shadow-md text-sm"
                title="Press R to rotate"
              >
                Rotate ({gameState.placement.orientation === 'horizontal' ? '→' : '↓'})
              </button>
              <button
                onClick={() => dispatch({ type: 'AUTO_PLACE' })}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors font-semibold shadow-md text-sm"
              >
                Auto-Place All
              </button>
              <button
                onClick={() => dispatch({ type: 'RESET_PLACEMENT' })}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-400 transition-colors font-semibold shadow-md text-sm"
              >
                Reset
              </button>
              <button
                onClick={handleStartGame}
                disabled={!allShipsPlaced}
                className={`px-6 py-2 rounded-lg font-semibold shadow-md text-sm transition-colors ${
                  allShipsPlaced
                    ? 'bg-green-500 text-white hover:bg-green-400'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Start Game
              </button>
            </div>
          </div>
        )}

        {/* Playing Controls */}
        {isGameOver && (
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={handleResetGame}
              className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-400 transition-colors font-semibold shadow-md"
            >
              Play Again
            </button>
          </div>
        )}

        {/* Game Boards */}
        <div className="flex flex-col lg:flex-row justify-center items-start gap-8 lg:gap-12">
          {/* Player Board */}
          <div className="flex flex-col items-center">
            <Board
              player={gameState.player}
              title="Your Fleet"
              isPlayerBoard={true}
              isClickable={isPlacement && !!gameState.placement.selectedShipType}
              onCellClick={isPlacement ? handlePlacementClick : undefined}
              onCellHover={isPlacement ? handlePlacementHover : undefined}
              onCellLeave={isPlacement ? handlePlacementLeave : undefined}
              previewCells={previewCells}
              previewValid={previewValid}
            />

            {/* Ship Status (during playing/gameOver) */}
            {!isPlacement && (
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
            )}
          </div>

          {/* AI Board - hidden during placement */}
          {!isPlacement && (
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
          )}

          {/* Placeholder during placement */}
          {isPlacement && (
            <div className="flex flex-col items-center">
              <h2 className="text-xl font-bold mb-4 text-gray-800">AI Waters</h2>
              <div className="w-[326px] h-[326px] sm:w-[366px] sm:h-[366px] bg-blue-200/30 rounded-lg border-2 border-dashed border-blue-300/50 flex items-center justify-center">
                <p className="text-blue-200 text-sm text-center px-4">
                  AI fleet will be placed<br />when you start the game
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 flex justify-center">
          <div className="bg-white/90 rounded-lg px-6 py-3 shadow-md flex flex-wrap gap-4 text-xs text-gray-700">
            <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 bg-blue-100 border border-gray-400 rounded-sm" /> Water</span>
            <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 bg-gray-700 border border-gray-400 rounded-sm" /> Ship</span>
            <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 bg-red-600 border border-gray-400 rounded-sm" /> Hit</span>
            <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 bg-gray-300 border border-gray-400 rounded-sm" /> Miss</span>
            <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 bg-red-800 border border-gray-400 rounded-sm" /> Sunk</span>
            {isPlacement && (
              <>
                <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 bg-green-400 border border-green-600 rounded-sm" /> Valid</span>
                <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 bg-red-400 border border-red-600 rounded-sm" /> Invalid</span>
              </>
            )}
          </div>
        </div>

        {/* Game Instructions */}
        {isPlacement && (
          <div className="mt-6 text-center text-blue-200">
            <p className="mb-2">Click a ship above to select it, then click on the grid to place it.</p>
            <p className="text-sm text-blue-300">Press <kbd className="px-1.5 py-0.5 bg-blue-800 rounded text-blue-100 text-xs">R</kbd> to rotate. Click a placed ship to pick it back up.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
