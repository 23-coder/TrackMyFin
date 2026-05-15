import React from 'react';
import { Button } from './FormElements';
import { Download } from 'lucide-react';

interface QuickExportButtonProps {
  transactions: any[];
  categories: any[];
  onExport: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
}

const QuickExportButton: React.FC<QuickExportButtonProps> = ({
  transactions,
  categories,
  onExport,
  variant = 'secondary',
  size = 'medium',
  disabled = false,
  className = ''
}) => {
  const isEmpty = !transactions || transactions.length === 0;

  return (
    <Button
      variant={variant}
      onClick={onExport}
      disabled={disabled || isEmpty}
      className={`flex items-center ${className}`}
      title={isEmpty ? 'No transactions to export' : 'Export transactions to Excel or PDF'}
    >
      <Download className={`${size === 'small' ? 'h-3 w-3' : 'h-4 w-4'} mr-2`} />
      {size !== 'small' && 'Export'}
    </Button>
  );
};

export default QuickExportButton;