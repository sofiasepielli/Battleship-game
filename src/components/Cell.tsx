import { Cell as CellType, CellStatus } from '../types';

interface CellProps {
  cell: CellType;
  isPlayerBoard?: boolean;
  isClickable?: boolean;
  onClick?: (row: number, col: number) => void;
}

export const Cell = ({ cell, isPlayerBoard = false, isClickable = false, onClick }: CellProps) => {
  const getCellClass = () => {
    const baseClasses = 'w-8 h-8 border border-gray-400 flex items-center justify-center text-xs font-bold transition-colors duration-200';
    
    if (isPlayerBoard) {
      // Player's board - show ships
      switch (cell.status) {
        case 'empty':
          return `${baseClasses} bg-blue-100 hover:bg-blue-200`;
        case 'ship':
          return `${baseClasses} bg-gray-700 hover:bg-gray-600`;
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
      // AI's board - hide ships
      switch (cell.status) {
        case 'empty':
          return `${baseClasses} bg-blue-100 ${isClickable ? 'hover:bg-blue-200 cursor-pointer' : ''}`;
        case 'ship':
          return `${baseClasses} bg-blue-100 ${isClickable ? 'hover:bg-blue-200 cursor-pointer' : ''}`;
        case 'hit':
          return `${baseClasses} bg-red-600 text-white`;
        case 'miss':
          return `${baseClasses} bg-gray-300`;
        case 'sunk':
          return `${baseClasses} bg-red-800 text-white`;
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
      onClick={() => isClickable && onClick && onClick(cell.row, cell.col)}
    >
      {getCellContent()}
    </div>
  );
};
