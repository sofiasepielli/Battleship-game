import { Ship, ShipType, SHIP_SIZES } from './types';

export const generateRandomShips = (): Ship[] => {
  const ships: Ship[] = [];
  const occupiedPositions = new Set<string>();
  
  const shipTypes: ShipType[] = ['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer'];
  
  for (const shipType of shipTypes) {
    let placed = false;
    let attempts = 0;
    
    while (!placed && attempts < 1000) {
      const isHorizontal = Math.random() < 0.5;
      const size = SHIP_SIZES[shipType];
      
      const maxRow = isHorizontal ? 10 : 10 - size + 1;
      const maxCol = isHorizontal ? 10 - size + 1 : 10;
      
      const row = Math.floor(Math.random() * maxRow);
      const col = Math.floor(Math.random() * maxCol);
      
      const positions: [number, number][] = [];
      let canPlace = true;
      
      for (let i = 0; i < size; i++) {
        const r = isHorizontal ? row : row + i;
        const c = isHorizontal ? col + i : col;
        const posKey = `${r},${c}`;
        
        if (occupiedPositions.has(posKey)) {
          canPlace = false;
          break;
        }
        
        positions.push([r, c]);
      }
      
      if (canPlace) {
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
