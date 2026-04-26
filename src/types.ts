export type CellStatus = 'empty' | 'ship' | 'hit' | 'miss' | 'sunk';

export type ShipType = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer';

export interface Ship {
  id: string;
  type: ShipType;
  size: number;
  positions: [number, number][];
  hits: number;
  sunk: boolean;
}

export interface Cell {
  row: number;
  col: number;
  status: CellStatus;
  shipId?: string;
}

export interface Player {
  ships: Ship[];
  board: Cell[][];
  shots: Set<string>;
}

export type GamePhase = 'setup' | 'playing' | 'gameOver';

export type GameStatus = 'setup' | 'playerTurn' | 'aiTurn' | 'playerWon' | 'aiWon';

export interface GameState {
  player: Player;
  ai: Player;
  currentTurn: 'player' | 'ai';
  gameStatus: GameStatus;
  lastHit: [number, number] | null;
  message: string;
  aiTargetQueue: [number, number][];
  aiMode: 'hunt' | 'target';
}

export const SHIP_SIZES: Record<ShipType, number> = {
  carrier: 5,
  battleship: 4,
  cruiser: 3,
  submarine: 3,
  destroyer: 2,
};

export const SHIP_NAMES: Record<ShipType, string> = {
  carrier: 'Carrier',
  battleship: 'Battleship',
  cruiser: 'Cruiser',
  submarine: 'Submarine',
  destroyer: 'Destroyer',
};
