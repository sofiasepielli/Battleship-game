import { Cell } from './Cell';
import { Player } from '../types';

interface BoardProps {
  player: Player;
  title: string;
  isPlayerBoard?: boolean;
  isClickable?: boolean;
  onCellClick?: (row: number, col: number) => void;
}

const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export const Board = ({ player, title, isPlayerBoard = false, isClickable = false, onCellClick }: BoardProps) => {
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-bold mb-4 text-gray-800">{title}</h2>
      <div className="inline-block">
        {/* Column labels */}
        <div className="flex">
          <div className="w-6 h-6" /> {/* Corner spacer */}
          {COL_LABELS.map(label => (
            <div key={label} className="w-8 h-6 sm:w-9 flex items-center justify-center text-xs font-semibold text-gray-500">
              {label}
            </div>
          ))}
        </div>
        {/* Rows with row labels */}
        {player.board.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            <div className="w-6 h-8 sm:h-9 flex items-center justify-center text-xs font-semibold text-gray-500">
              {rowIndex + 1}
            </div>
            {row.map((cell, colIndex) => (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                cell={cell}
                isPlayerBoard={isPlayerBoard}
                isClickable={isClickable}
                onClick={onCellClick}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
