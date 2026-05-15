import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button, Input } from './FormElements';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Calendar,
  Filter,
  DollarSign,
  Tag,
  CheckSquare,
  Square
} from 'lucide-react';
import { TransactionExportService, ExportOptions, ExportFilters } from '../../services/exportService';
import { SimplePDFExport } from '../../services/simplePDFExport';
import { SimpleExcelExport } from '../../services/simpleExcelExport';

interface Transaction {
  id: number;
  amount: number;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  categoryId: number;
  categoryName?: string;
  date: string;
}

interface Category {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE';
}

interface Salary {
  id: string;
  amount: number;
  description: string;
  date: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  salaries?: Salary[];
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  categories,
  salaries = []
}) => {
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel');
  const [title, setTitle] = useState('TrackMyFin - Transaction Report');
  const [isExporting, setIsExporting] = useState(false);
  
  // Filter options
  const [filters, setFilters] = useState<ExportFilters>({
    dateFrom: '',
    dateTo: '',
    type: 'ALL',
    categoryIds: [],
    minAmount: undefined,
    maxAmount: undefined
  });

  // Field selection
  const [includeFields, setIncludeFields] = useState({
    id: false,
    date: true,
    description: true,
    amount: true,
    type: true,
    category: true
  });

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setFilters(prev => ({
      ...prev,
      dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0]
    }));
  }, []);

  const handleFieldToggle = (field: keyof typeof includeFields) => {
    setIncludeFields(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleCategoryToggle = (categoryId: number) => {
    setFilters(prev => ({
      ...prev,
      categoryIds: prev.categoryIds?.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...(prev.categoryIds || []), categoryId]
    }));
  };

  const getFilteredTransactionCount = () => {
    // Include salary transactions in count
    const salaryTransactions = salaries.map((salary, index) => ({
      id: 10000 + index,
      amount: salary.amount,
      description: `Salary: ${salary.description}`,
      type: 'INCOME' as const,
      categoryId: 9999,
      categoryName: 'Salary',
      date: salary.date
    }));
    
    let filtered = [...transactions, ...salaryTransactions];
    
    if (filters.dateFrom) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(filters.dateFrom!));
    }
    if (filters.dateTo) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(filters.dateTo!));
    }
    if (filters.type && filters.type !== 'ALL') {
      filtered = filtered.filter(t => t.type === filters.type);
    }
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      filtered = filtered.filter(t => filters.categoryIds!.includes(t.categoryId));
    }
    if (filters.minAmount !== undefined) {
      filtered = filtered.filter(t => t.amount >= filters.minAmount!);
    }
    if (filters.maxAmount !== undefined) {
      filtered = filtered.filter(t => t.amount <= filters.maxAmount!);
    }
    
    return filtered.length;
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Combine transactions and salaries for export
      const salaryTransactions = salaries.map((salary, index) => ({
        id: 10000 + index, // Generate numeric ID with offset to avoid conflicts
        amount: salary.amount,
        description: `Salary: ${salary.description}`,
        type: 'INCOME' as const,
        categoryId: 9999, // Special category ID for salaries
        categoryName: 'Salary',
        date: salary.date
      }));
      
      const combinedTransactions = [...transactions, ...salaryTransactions];
      console.log('🔄 Export: Combined transactions with salaries:', combinedTransactions.length, 'total');
      console.log('💰 Export: Salary transactions added:', salaryTransactions.length);
      
      if (format === 'excel') {
        // Excel export with fallback to simple export
        try {
          const options: ExportOptions = {
            includeFields,
            format,
            filters,
            title
          };
          TransactionExportService.exportTransactions(combinedTransactions, options);
        } catch (excelError: any) {
          console.warn('Advanced Excel export failed, using simple export:', excelError);
          // Fallback to simple Excel export
          const filteredTransactions = combinedTransactions.filter(transaction => {
            if (filters.dateFrom && new Date(transaction.date) < new Date(filters.dateFrom)) {
              return false;
            }
            if (filters.dateTo && new Date(transaction.date) > new Date(filters.dateTo)) {
              return false;
            }
            if (filters.type && filters.type !== 'ALL' && transaction.type !== filters.type) {
              return false;
            }
            return true;
          });
          
          SimpleExcelExport.exportToExcel(filteredTransactions, title);
        }
      } else {
        // PDF export with fallback
        try {
          const options: ExportOptions = {
            includeFields,
            format,
            filters,
            title
          };
          TransactionExportService.exportTransactions(combinedTransactions, options);
        } catch (pdfError: any) {
          console.warn('Advanced PDF export failed, using simple export:', pdfError);
          // Fallback to simple PDF export
          const filteredTransactions = combinedTransactions.filter(transaction => {
            // Apply basic filtering
            if (filters.dateFrom && new Date(transaction.date) < new Date(filters.dateFrom)) {
              return false;
            }
            if (filters.dateTo && new Date(transaction.date) > new Date(filters.dateTo)) {
              return false;
            }
            if (filters.type && filters.type !== 'ALL' && transaction.type !== filters.type) {
              return false;
            }
            return true;
          });
          
          SimplePDFExport.exportToPDF(filteredTransactions, title);
        }
      }
      
      // Success feedback
      setTimeout(() => {
        onClose();
        setIsExporting(false);
      }, 1000);
      
    } catch (error: any) {
      console.error('Export error:', error);
      alert(`Export failed: ${error.message}`);
      setIsExporting(false);
    }
  };

  const resetFilters = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setFilters({
      dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
      type: 'ALL',
      categoryIds: [],
      minAmount: undefined,
      maxAmount: undefined
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Transactions">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        
        {/* Format Selection */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Download className="w-5 h-5 mr-2" />
            Export Format
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormat('excel')}
              className={`p-4 border-2 rounded-lg flex flex-col items-center transition-colors ${
                format === 'excel'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <FileSpreadsheet className="w-8 h-8 mb-2 text-green-600" />
              <span className="font-medium">Excel (.xlsx)</span>
              <span className="text-sm text-gray-500">Spreadsheet format</span>
            </button>
            
            <button
              onClick={() => setFormat('pdf')}
              className={`p-4 border-2 rounded-lg flex flex-col items-center transition-colors ${
                format === 'pdf'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <FileText className="w-8 h-8 mb-2 text-red-600" />
              <span className="font-medium">PDF (.pdf)</span>
              <span className="text-sm text-gray-500">Document format</span>
            </button>
          </div>
        </div>

        {/* Report Title */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Report Title</h3>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter report title"
            className="w-full"
          />
        </div>

        {/* Field Selection */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Include Fields</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(includeFields).map(([field, checked]) => (
              <label key={field} className="flex items-center space-x-2 cursor-pointer">
                <button
                  type="button"
                  onClick={() => handleFieldToggle(field as keyof typeof includeFields)}
                  className="flex items-center"
                >
                  {checked ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                <span className="capitalize">
                  {field === 'id' ? 'Transaction ID' : field}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Date Range
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">From Date</label>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Transaction Type Filter */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Transaction Type
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {['ALL', 'INCOME', 'EXPENSE'].map((type) => (
              <button
                key={type}
                onClick={() => setFilters(prev => ({ ...prev, type: type as any }))}
                className={`p-2 rounded-lg border transition-colors ${
                  filters.type === type
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Range Filter */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Amount Range
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Minimum Amount</label>
              <Input
                type="number"
                value={filters.minAmount || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  minAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                }))}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Maximum Amount</label>
              <Input
                type="number"
                value={filters.maxAmount || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  maxAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                }))}
                placeholder="No limit"
              />
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Tag className="w-5 h-5 mr-2" />
            Categories ({filters.categoryIds?.length || 0} selected)
          </h3>
          <div className="max-h-32 overflow-y-auto border rounded-lg p-3 space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, categoryIds: [] }))}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear All
              </button>
            </label>
            {categories.map((category) => (
              <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                <button
                  type="button"
                  onClick={() => handleCategoryToggle(category.id)}
                  className="flex items-center"
                >
                  {filters.categoryIds?.includes(category.id) ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                <span className="text-sm">
                  {category.name} 
                  <span className={`ml-1 text-xs px-1 rounded ${
                    category.type === 'INCOME' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {category.type}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Preview Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Export Preview</h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {getFilteredTransactionCount()} transactions will be exported based on your filters.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={resetFilters}
            >
              Reset Filters
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                console.log('Testing simple PDF export...');
                try {
                  SimplePDFExport.exportToPDF([
                    {
                      id: 1,
                      amount: 1000,
                      description: 'Test Income',
                      type: 'INCOME',
                      categoryName: 'Test',
                      date: '2025-09-27'
                    },
                    {
                      id: 2,
                      amount: 500,
                      description: 'Test Expense',
                      type: 'EXPENSE',
                      categoryName: 'Test',
                      date: '2025-09-27'
                    }
                  ], 'Test Export');
                  console.log('✅ Simple PDF export successful');
                } catch (error) {
                  console.error('❌ Simple PDF export failed:', error);
                }
              }}
              className="text-xs"
            >
              Test Simple PDF
            </Button>
          </div>
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleExport}
              disabled={isExporting || getFilteredTransactionCount() === 0}
              className="flex items-center"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export {format.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;