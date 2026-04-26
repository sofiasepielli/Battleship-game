import { GameState, Ship, Cell, ShipType, SHIP_SIZES } from './lib/types';
import { isValidPlacement, getShipPositions, getOccupiedPositions, generateRandomShips } from './lib/shipPlacement';

export type GameAction =
  | { type: 'PLACE_SHIPS'; playerShips: Ship[]; aiShips: Ship[] }
  | { type: 'START_GAME' }
  | { type: 'PLAYER_SHOT'; row: number; col: number }
  | { type: 'AI_SHOT'; row: number; col: number }
  | { type: 'SET_MESSAGE'; message: string }
  | { type: 'RESET_GAME' }
  | { type: 'SELECT_SHIP'; shipType: ShipType }
  | { type: 'TOGGLE_ORIENTATION' }
  | { type: 'SET_HOVER'; row: number; col: number }
  | { type: 'CLEAR_HOVER' }
  | { type: 'PLACE_SHIP_MANUAL'; row: number; col: number }
  | { type: 'PICK_UP_SHIP'; shipType: ShipType }
  | { type: 'AUTO_PLACE' }
  | { type: 'RESET_PLACEMENT' };

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

const checkWinCondition = (playerShips: Ship[], aiShips: Ship[]): 'playerTurn' | 'playerWon' | 'aiWon' => {
  if (playerShips.every(ship => ship.sunk)) return 'aiWon';
  if (aiShips.every(ship => ship.sunk)) return 'playerWon';
  return 'playerTurn';
};

const ALL_SHIP_TYPES: ShipType[] = ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer'];

const getNextUnplacedShip = (placedShips: Ship[]): ShipType | null => {
  const placedTypes = new Set(placedShips.map(s => s.type));
  return ALL_SHIP_TYPES.find(t => !placedTypes.has(t)) ?? null;
};

const SHIP_LABELS: Record<ShipType, string> = {
  carrier: 'Carrier (5 cells)',
  battleship: 'Battleship (4 cells)',
  cruiser: 'Cruiser (3 cells)',
  submarine: 'Submarine (3 cells)',
  destroyer: 'Destroyer (2 cells)',
};

const placementMessage = (nextShip: ShipType | null): string =>
  nextShip ? `Place your ${SHIP_LABELS[nextShip]}.` : 'All ships placed! Click "Start Game" to begin.';

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

    case 'SELECT_SHIP': {
      if (state.gameStatus !== 'placement') return state;
      const alreadyPlaced = state.placement.placedShips.some(s => s.type === action.shipType);
      if (alreadyPlaced) return state;
      return {
        ...state,
        placement: {
          ...state.placement,
          selectedShipType: action.shipType,
        },
      };
    }

    case 'TOGGLE_ORIENTATION': {
      if (state.gameStatus !== 'placement') return state;
      return {
        ...state,
        placement: {
          ...state.placement,
          orientation: state.placement.orientation === 'horizontal' ? 'vertical' : 'horizontal',
        },
      };
    }

    case 'SET_HOVER': {
      if (state.gameStatus !== 'placement') return state;
      return {
        ...state,
        placement: {
          ...state.placement,
          hoverCell: [action.row, action.col],
        },
      };
    }

    case 'CLEAR_HOVER': {
      if (state.gameStatus !== 'placement') return state;
      return {
        ...state,
        placement: {
          ...state.placement,
          hoverCell: null,
        },
      };
    }

    case 'PLACE_SHIP_MANUAL': {
      if (state.gameStatus !== 'placement' || !state.placement.selectedShipType) return state;
      const { selectedShipType, orientation, placedShips } = state.placement;
      const size = SHIP_SIZES[selectedShipType];
      const occupied = getOccupiedPositions(placedShips);

      if (!isValidPlacement(action.row, action.col, size, orientation, occupied)) return state;

      const positions = getShipPositions(action.row, action.col, size, orientation);
      const newShip: Ship = {
        id: `${selectedShipType}-${Date.now()}-${Math.random()}`,
        type: selectedShipType,
        size,
        positions,
        hits: 0,
        sunk: false,
      };
      const newPlacedShips = [...placedShips, newShip];
      const newBoard = placeShipsOnBoard(createEmptyBoard(), newPlacedShips);
      const nextShip = getNextUnplacedShip(newPlacedShips);

      return {
        ...state,
        player: {
          ...state.player,
          ships: newPlacedShips,
          board: newBoard,
        },
        placement: {
          ...state.placement,
          placedShips: newPlacedShips,
          selectedShipType: nextShip,
          hoverCell: null,
        },
        message: placementMessage(nextShip),
      };
    }

    case 'PICK_UP_SHIP': {
      if (state.gameStatus !== 'placement') return state;
      const shipToRemove = state.placement.placedShips.find(s => s.type === action.shipType);
      if (!shipToRemove) return state;

      const newPlacedShips = state.placement.placedShips.filter(s => s.type !== action.shipType);
      const newBoard = placeShipsOnBoard(createEmptyBoard(), newPlacedShips);

      return {
        ...state,
        player: {
          ...state.player,
          ships: newPlacedShips,
          board: newBoard,
        },
        placement: {
          ...state.placement,
          placedShips: newPlacedShips,
          selectedShipType: action.shipType,
        },
        message: `Place your ${SHIP_LABELS[action.shipType]}.`,
      };
    }

    case 'AUTO_PLACE': {
      if (state.gameStatus !== 'placement') return state;
      const allShips = generateRandomShips(state.placement.placedShips);
      const newBoard = placeShipsOnBoard(createEmptyBoard(), allShips);

      return {
        ...state,
        player: {
          ...state.player,
          ships: allShips,
          board: newBoard,
        },
        placement: {
          ...state.placement,
          placedShips: allShips,
          selectedShipType: null,
          hoverCell: null,
        },
        message: 'All ships placed! Click "Start Game" to begin.',
      };
    }

    case 'RESET_PLACEMENT': {
      if (state.gameStatus !== 'placement') return state;
      return {
        ...state,
        player: {
          ships: [],
          board: createEmptyBoard(),
          shots: new Set(),
        },
        placement: {
          selectedShipType: 'carrier',
          orientation: 'horizontal',
          placedShips: [],
          hoverCell: null,
        },
        message: placementMessage('carrier'),
      };
    }

    case 'START_GAME': {
      if (state.gameStatus === 'placement') {
        if (state.placement.placedShips.length !== 5) return state;
        const aiShips = generateRandomShips();
        const aiBoard = placeShipsOnBoard(createEmptyBoard(), aiShips);
        return {
          ...state,
          ai: {
            ships: aiShips,
            board: aiBoard,
            shots: new Set(),
          },
          gameStatus: 'playerTurn',
          message: 'Your turn! Click on the AI grid to fire.',
          placement: {
            ...state.placement,
            selectedShipType: null,
            hoverCell: null,
          },
        };
      }
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
      const newAiBoard = state.ai.board.map(r => r.map(cell => ({ ...cell })));
      const newAiShips = state.ai.ships.map(ship => ({ ...ship }));
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
      const newPlayerBoard = state.player.board.map(r => r.map(cell => ({ ...cell })));
      const newPlayerShips = state.player.ships.map(ship => ({ ...ship }));
      let message = '';
      let lastHit: [number, number] | null = null;
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
              
              hitShip.positions.forEach(([r, c]) => {
                newPlayerBoard[r][c].status = 'sunk';
              });
              
              aiMode = 'hunt';
              aiTargetQueue = [];
            } else {
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
        gameStatus: 'placement',
        lastHit: null,
        message: placementMessage('carrier'),
        aiTargetQueue: [],
        aiMode: 'hunt',
        placement: {
          selectedShipType: 'carrier',
          orientation: 'horizontal',
          placedShips: [],
          hoverCell: null,
        },
      };
    }

    default:
      return state;
  }
};
