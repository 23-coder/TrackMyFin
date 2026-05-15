import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/FormElements';
import ExportModal from '../ui/ExportModal';
import QuickExportButton from '../ui/QuickExportButton';
import { TransactionExportService } from '../../services/exportService';
import { useData } from '../../contexts/DataContext';
import { 
  Download, 
  FileSpreadsheet, 
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  CheckCircle
} from 'lucide-react';

const ExportDemo: React.FC = () => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { transactions, categories, salaries } = useData();

  // Sample data for demonstration
  const sampleTransactions = [
    {
      id: 1,
      amount: 5000,
      description: 'Salary',
      type: 'INCOME' as const,
      categoryId: 1,
      categoryName: 'Job',
      date: '2025-09-01',
    },
    {
      id: 2,
      amount: 1200,
      description: 'Groceries',
      type: 'EXPENSE' as const,
      categoryId: 2,
      categoryName: 'Food',
      date: '2025-09-15',
    },
    {
      id: 3,
      amount: 800,
      description: 'Electric Bill',
      type: 'EXPENSE' as const,
      categoryId: 3,
      categoryName: 'Utilities',
      date: '2025-09-20',
    },
    {
      id: 4,
      amount: 2000,
      description: 'Freelance Work',
      type: 'INCOME' as const,
      categoryId: 4,
      categoryName: 'Freelance',
      date: '2025-09-25',
    },
  ];

  const sampleCategories = [
    { id: 1, name: 'Job', type: 'INCOME' as const },
    { id: 2, name: 'Food', type: 'EXPENSE' as const },
    { id: 3, name: 'Utilities', type: 'EXPENSE' as const },
    { id: 4, name: 'Freelance', type: 'INCOME' as const },
  ];

  const features = [
    {
      icon: <FileSpreadsheet className="w-6 h-6 text-green-600" />,
      title: 'Excel Export',
      description: 'Export to .xlsx format for spreadsheet analysis',
      points: ['Multiple worksheets', 'Formatted data', 'Charts ready']
    },
    {
      icon: <FileText className="w-6 h-6 text-red-600" />,
      title: 'PDF Export',
      description: 'Professional PDF reports with summaries',
      points: ['Print-ready format', 'Professional layout', 'Summary statistics']
    },
    {
      icon: <Filter className="w-6 h-6 text-blue-600" />,
      title: 'Smart Filtering',
      description: 'Export exactly what you need',
      points: ['Date ranges', 'Category selection', 'Amount filters']
    },
    {
      icon: <Calendar className="w-6 h-6 text-purple-600" />,
      title: 'Date Range Selection',
      description: 'Choose specific time periods',
      points: ['Monthly reports', 'Quarterly analysis', 'Custom ranges']
    }
  ];

  const exportOptions = [
    'Transaction ID',
    'Date & Time',
    'Description',
    'Amount',
    'Transaction Type',
    'Category Name'
  ];

  return (
    <div className="space-y-8">
      
      {/* Header Section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Export Your Financial Data
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Download your transactions in Excel or PDF format with powerful filtering and customization options
        </p>
      </div>

      {/* Demo Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
        <div className="text-center p-8">
          <Download className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Try the Export Feature
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Click below to open the export dialog with sample data
          </p>
          
          <div className="flex justify-center gap-4">
            <QuickExportButton
              transactions={sampleTransactions}
              categories={sampleCategories}
              onExport={() => setIsExportModalOpen(true)}
              variant="primary"
              size="large"
            />
            
            <Button
              variant="secondary"
              onClick={() => {
                // Quick Excel export with default settings
                TransactionExportService.exportToExcel(sampleTransactions, {
                  includeFields: {
                    id: true,
                    date: true,
                    description: true,
                    amount: true,
                    type: true,
                    category: true
                  },
                  format: 'excel',
                  filters: { type: 'ALL' },
                  title: 'TrackMyFin Sample Data'
                });
              }}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Quick Excel Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-center mb-4">
                {feature.icon}
                <h3 className="text-xl font-semibold ml-3 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {feature.description}
              </p>
              <ul className="space-y-2">
                {feature.points.map((point, pointIndex) => (
                  <li key={pointIndex} className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>

      {/* Export Options */}
      <Card>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Customizable Export Fields
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Choose exactly which data to include in your export:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {exportOptions.map((option, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Sample Data Preview */}
      <Card>
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Sample Data Preview
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {(transactions || sampleTransactions).slice(0, 4).map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {transaction.description}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {transaction.categoryName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.type === 'INCOME' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {transaction.type === 'INCOME' ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-right">
                      <span className={transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                        ₹{transaction.amount.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        transactions={transactions || sampleTransactions}
        categories={categories || sampleCategories}
        salaries={salaries || []}
      />
    </div>
  );
};

export default ExportDemo;