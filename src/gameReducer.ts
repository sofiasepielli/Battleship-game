import { GameState, GameStatus, Ship, Cell } from './lib/types';

export type GameAction =
  | { type: 'PLACE_SHIPS'; playerShips: Ship[]; aiShips: Ship[] }
  | { type: 'START_GAME' }
  | { type: 'PLAYER_SHOT'; row: number; col: number }
  | { type: 'AI_SHOT'; row: number; col: number }
  | { type: 'SET_MESSAGE'; message: string }
  | { type: 'RESET_GAME' };

const createEmptyBoard = (): Cell[][] => {
  const board: Cell[][] = [];
  for (let row = 0; row < 10; row++) {
    board[row] = [];
    for (let col = 0; col < 10; col++) {
      board[row][col] = { row, col, status: 'empty' };
    }
  }
  return board;
};

const placeShipsOnBoard = (board: Cell[][], ships: Ship[]): Cell[][] => {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  
  ships.forEach(ship => {
    ship.positions.forEach(([row, col]) => {
      newBoard[row][col].status = 'ship';
      newBoard[row][col].shipId = ship.id;
    });
  });
  
  return newBoard;
};

const checkShipSunk = (ship: Ship, board: Cell[][]): boolean => {
  return ship.positions.every(([row, col]) => 
    board[row][col].status === 'hit'
  );
};

const checkWinCondition = (playerShips: Ship[], aiShips: Ship[]): GameStatus => {
  if (playerShips.every(ship => ship.sunk)) return 'aiWon';
  if (aiShips.every(ship => ship.sunk)) return 'playerWon';
  return 'playerTurn';
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'PLACE_SHIPS': {
      const playerBoard = placeShipsOnBoard(createEmptyBoard(), action.playerShips);
      const aiBoard = placeShipsOnBoard(createEmptyBoard(), action.aiShips);
      
      return {
        ...state,
        player: {
          ships: action.playerShips,
          board: playerBoard,
          shots: new Set(),
        },
        ai: {
          ships: action.aiShips,
          board: aiBoard,
          shots: new Set(),
        },
        gameStatus: 'setup',
        message: 'Click "Start Game" to begin!',
      };
    }

    case 'START_GAME': {
      return {
        ...state,
        gameStatus: 'playerTurn',
        message: 'Your turn! Click on the AI grid to fire.',
      };
    }

    case 'PLAYER_SHOT': {
      if (state.gameStatus !== 'playerTurn') return state;
      
      const { row, col } = action;
      const shotKey = `${row},${col}`;
      
      if (state.ai.shots.has(shotKey)) return state;
      
      const newAiShots = new Set(state.ai.shots);
      newAiShots.add(shotKey);
      
      const targetCell = state.ai.board[row][col];
      let newAiBoard = state.ai.board.map(row => row.map(cell => ({ ...cell })));
      let newAiShips = state.ai.ships.map(ship => ({ ...ship }));
      let message = '';
      
      if (targetCell.status === 'ship') {
        newAiBoard[row][col].status = 'hit';
        message = 'Hit!';
        
        if (targetCell.shipId) {
          const hitShip = newAiShips.find(s => s.id === targetCell.shipId);
          if (hitShip) {
            hitShip.hits += 1;
            if (checkShipSunk(hitShip, newAiBoard)) {
              hitShip.sunk = true;
              message = `You sunk the ${hitShip.type}!`;
              
              // Mark all cells of sunk ship as 'sunk'
              hitShip.positions.forEach(([r, c]) => {
                newAiBoard[r][c].status = 'sunk';
              });
            }
          }
        }
      } else {
        newAiBoard[row][col].status = 'miss';
        message = 'Miss!';
      }
      
      const gameStatus = checkWinCondition(state.player.ships, newAiShips);
      
      return {
        ...state,
        ai: {
          ...state.ai,
          board: newAiBoard,
          ships: newAiShips,
          shots: newAiShots,
        },
        gameStatus: gameStatus === 'playerTurn' ? 'aiTurn' : gameStatus,
        message,
      };
    }

    case 'AI_SHOT': {
      if (state.gameStatus !== 'aiTurn') return state;
      
      const { row, col } = action;
      const shotKey = `${row},${col}`;
      
      if (state.player.shots.has(shotKey)) return state;
      
      const newPlayerShots = new Set(state.player.shots);
      newPlayerShots.add(shotKey);
      
      const targetCell = state.player.board[row][col];
      let newPlayerBoard = state.player.board.map(row => row.map(cell => ({ ...cell })));
      let newPlayerShips = state.player.ships.map(ship => ({ ...ship }));
      let message = '';
      let lastHit: [number, number] | null = null;
      // Remove the current shot from the target queue to prevent stale entries
      let aiTargetQueue = state.aiTargetQueue.filter(([r, c]) => r !== row || c !== col);
      let aiMode = state.aiMode;
      
      if (targetCell.status === 'ship') {
        newPlayerBoard[row][col].status = 'hit';
        message = 'AI hit your ship!';
        lastHit = [row, col];
        
        if (targetCell.shipId) {
          const hitShip = newPlayerShips.find(s => s.id === targetCell.shipId);
          if (hitShip) {
            hitShip.hits += 1;
            if (checkShipSunk(hitShip, newPlayerBoard)) {
              hitShip.sunk = true;
              message = `AI sunk your ${hitShip.type}!`;
              
              // Mark all cells of sunk ship as 'sunk'
              hitShip.positions.forEach(([r, c]) => {
                newPlayerBoard[r][c].status = 'sunk';
              });
              
              // Return to hunt mode when ship is sunk
              aiMode = 'hunt';
              aiTargetQueue = [];
            } else {
              // Switch to target mode and add adjacent cells to queue
              aiMode = 'target';
              const adjacentCells = [
                [row - 1, col], [row + 1, col],
                [row, col - 1], [row, col + 1]
              ].filter(([r, c]) => 
                r >= 0 && r < 10 && c >= 0 && c < 10 &&
                !newPlayerShots.has(`${r},${c}`) &&
                !aiTargetQueue.some(([qr, qc]) => qr === r && qc === c)
              ) as [number, number][];
              
              aiTargetQueue.push(...adjacentCells);
            }
          }
        }
      } else {
        newPlayerBoard[row][col].status = 'miss';
        message = 'AI missed!';
        
        // If in target mode and queue is empty, revert to hunt mode
        if (aiMode === 'target' && aiTargetQueue.length === 0) {
          aiMode = 'hunt';
        }
      }
      
      const gameStatus = checkWinCondition(newPlayerShips, state.ai.ships);
      
      return {
        ...state,
        player: {
          ...state.player,
          board: newPlayerBoard,
          ships: newPlayerShips,
          shots: newPlayerShots,
        },
        gameStatus: gameStatus === 'playerTurn' ? 'playerTurn' : gameStatus,
        message,
        lastHit,
        aiTargetQueue,
        aiMode,
      };
    }

    case 'SET_MESSAGE': {
      return {
        ...state,
        message: action.message,
      };
    }

    case 'RESET_GAME': {
      return {
        player: {
          ships: [],
          board: createEmptyBoard(),
          shots: new Set(),
        },
        ai: {
          ships: [],
          board: createEmptyBoard(),
          shots: new Set(),
        },
        currentTurn: 'player',
        gameStatus: 'setup',
        lastHit: null,
        message: 'Click "Randomize" to place ships.',
        aiTargetQueue: [],
        aiMode: 'hunt',
      };
    }

    default:
      return state;
  }
};
