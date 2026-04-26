import { Cell as CellType } from '../lib/types';

interface CellProps {
  cell: CellType;
  isPlayerBoard?: boolean;
  isClickable?: boolean;
  onClick?: (row: number, col: number) => void;
}

export const Cell = ({ cell, isPlayerBoard = false, isClickable = false, onClick }: CellProps) => {
  const isAlreadyShot = cell.status === 'hit' || cell.status === 'miss' || cell.status === 'sunk';
  const canClick = isClickable && !isAlreadyShot;

  const getCellClass = () => {
    const baseClasses = 'w-8 h-8 sm:w-9 sm:h-9 border border-gray-400 flex items-center justify-center text-xs font-bold transition-colors duration-200';
    
    if (isPlayerBoard) {
      switch (cell.status) {
        case 'empty':
          return `${baseClasses} bg-blue-100`;
        case 'ship':
          return `${baseClasses} bg-gray-700`;
        case 'hit':
          return `${baseClasses} bg-red-600 text-white`;
        case 'miss':
          return `${baseClasses} bg-gray-300`;
        case 'sunk':
          return `${baseClasses} bg-red-800 text-white`;
        default:
          return baseClasses;
      }
    } else {
      switch (cell.status) {
        case 'empty':
        case 'ship':
          return `${baseClasses} bg-blue-100 ${canClick ? 'hover:bg-blue-300 cursor-pointer' : 'cursor-default'}`;
        case 'hit':
          return `${baseClasses} bg-red-600 text-white cursor-not-allowed`;
        case 'miss':
          return `${baseClasses} bg-gray-300 cursor-not-allowed`;
        case 'sunk':
          return `${baseClasses} bg-red-800 text-white cursor-not-allowed`;
        default:
          return baseClasses;
      }
    }
  };

  const getCellContent = () => {
    if (cell.status === 'hit' || cell.status === 'sunk') {
      return '💥';
    }
    if (cell.status === 'miss') {
      return '•';
    }
    return '';
  };

  return (
    <div
      className={getCellClass()}
      onClick={() => canClick && onClick && onClick(cell.row, cell.col)}
    >
      {getCellContent()}
    </div>
  );
};
