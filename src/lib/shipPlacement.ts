import { Ship, ShipType, SHIP_SIZES, Orientation } from './types';

export const getShipPositions = (
  row: number,
  col: number,
  size: number,
  orientation: Orientation
): [number, number][] => {
  const positions: [number, number][] = [];
  for (let i = 0; i < size; i++) {
    const r = orientation === 'horizontal' ? row : row + i;
    const c = orientation === 'horizontal' ? col + i : col;
    positions.push([r, c]);
  }
  return positions;
};

export const isValidPlacement = (
  row: number,
  col: number,
  size: number,
  orientation: Orientation,
  occupiedPositions: Set<string>
): boolean => {
  const positions = getShipPositions(row, col, size, orientation);

  for (const [r, c] of positions) {
    if (r < 0 || r >= 10 || c < 0 || c >= 10) return false;
    if (occupiedPositions.has(`${r},${c}`)) return false;
  }

  return true;
};

export const getOccupiedPositions = (ships: Ship[]): Set<string> => {
  const occupied = new Set<string>();
  ships.forEach(ship => {
    ship.positions.forEach(([r, c]) => {
      occupied.add(`${r},${c}`);
    });
  });
  return occupied;
};

export const generateRandomShips = (existingShips: Ship[] = []): Ship[] => {
  const ships: Ship[] = [...existingShips];
  const occupiedPositions = getOccupiedPositions(ships);

  const allShipTypes: ShipType[] = ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer'];
  const placedTypes = new Set(ships.map(s => s.type));
  const remainingTypes = allShipTypes.filter(t => !placedTypes.has(t));

  for (const shipType of remainingTypes) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 1000) {
      const orientation: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const size = SHIP_SIZES[shipType];

      const maxRow = orientation === 'horizontal' ? 10 : 10 - size + 1;
      const maxCol = orientation === 'horizontal' ? 10 - size + 1 : 10;

      const row = Math.floor(Math.random() * maxRow);
      const col = Math.floor(Math.random() * maxCol);

      if (isValidPlacement(row, col, size, orientation, occupiedPositions)) {
        const positions = getShipPositions(row, col, size, orientation);
        positions.forEach(([r, c]) => {
          occupiedPositions.add(`${r},${c}`);
        });

        ships.push({
          id: `${shipType}-${Date.now()}-${Math.random()}`,
          type: shipType,
          size,
          positions,
          hits: 0,
          sunk: false,
        });

        placed = true;
      }

      attempts++;
    }

    if (!placed) {
      throw new Error(`Failed to place ${shipType} after 1000 attempts`);
    }
  }

  return ships;
};
