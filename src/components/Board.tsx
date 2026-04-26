import { Cell } from './Cell';
import { Player } from '../lib/types';

interface BoardProps {
  player: Player;
  title: string;
  isPlayerBoard?: boolean;
  isClickable?: boolean;
  onCellClick?: (row: number, col: number) => void;
}

export const Board = ({ player, title, isPlayerBoard = false, isClickable = false, onCellClick }: BoardProps) => {
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
      <div className="grid grid-cols-10 gap-0 border-2 border-gray-600 bg-white">
        {player.board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              cell={cell}
              isPlayerBoard={isPlayerBoard}
              isClickable={isClickable}
              onClick={onCellClick}
            />
          ))
        )}
      </div>
    </div>
  );
};
