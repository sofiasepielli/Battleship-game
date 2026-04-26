import { GameState } from './types';

export const getAIShot = (state: GameState): [number, number] | null => {
  const { player, aiMode, aiTargetQueue } = state;
  
  // If in target mode and have cells in queue, use them
  if (aiMode === 'target' && aiTargetQueue.length > 0) {
    const [row, col] = aiTargetQueue[0];
    
    // Make sure this cell hasn't been tried already
    if (!player.shots.has(`${row},${col}`)) {
      return [row, col];
    }
    
    // Remove invalid cell from queue and continue
    return getAIShot({
      ...state,
      aiTargetQueue: aiTargetQueue.slice(1)
    });
  }
  
  // Hunt mode: pick random untried cell
  const availableCells: [number, number][] = [];
  
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if (!player.shots.has(`${row},${col}`)) {
        availableCells.push([row, col]);
      }
    }
  }
  
  if (availableCells.length === 0) return null;
  
  // Use checkerboard pattern for better hit probability
  const checkerboardCells = availableCells.filter(([r, c]) => (r + c) % 2 === 0);
  const cellsToChoose = checkerboardCells.length > 0 ? checkerboardCells : availableCells;
  
  const randomIndex = Math.floor(Math.random() * cellsToChoose.length);
  return cellsToChoose[randomIndex];
};
