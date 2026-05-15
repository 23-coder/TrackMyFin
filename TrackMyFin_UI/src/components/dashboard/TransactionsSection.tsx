import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button, Input, Select } from '../ui/FormElements';
import { Modal } from '../ui/Modal';
import { 
  Receipt, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown 
} from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
  date: string;
  createdAt: string;
}

interface TransactionFormData {
  description: string;
  amount: string;
  type: 'income' | 'expense';
  categoryId: string;
  date: string;
}

interface Category {
  id: number;
  name: string;
  color: string;
  icon?: string;
  type: 'INCOME' | 'EXPENSE';
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<TransactionFormData, 'amount'> & { amount: number }) => Promise<void>;
  transaction?: Transaction;
  categories: Category[];
  loading?: boolean;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  transaction,
  categories,
  loading = false,
}) => {
  const [formData, setFormData] = useState<TransactionFormData>(() => ({
    description: transaction?.description || '',
    amount: transaction?.amount ? Math.abs(transaction.amount).toString() : '',
    type: transaction?.type || 'expense',
    categoryId: transaction?.categoryId ? transaction.categoryId.toString() : (categories[0]?.id.toString() || ''),
    date: transaction?.date || format(new Date(), 'yyyy-MM-dd'),
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a category';
    }
    
    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await onSubmit({
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        type: formData.type,
        categoryId: formData.categoryId,
        date: formData.date,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save transaction:', error);
    }
  };

  const handleInputChange = (field: keyof TransactionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const typeOptions = [
    { value: 'expense', label: 'Expense' },
    { value: 'income', label: 'Income' },
  ];

  const categoryOptions = categories.map(cat => ({
    value: cat.id.toString(),
    label: cat.name,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transaction ? 'Edit Transaction' : 'Add New Transaction'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Description"
          placeholder="e.g., Grocery shopping, Salary, Coffee"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          error={errors.description}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="Enter amount in rupees"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            error={errors.amount}
          />
          
          <Select
            label="Type"
            options={typeOptions}
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value as 'income' | 'expense')}
            error={errors.type}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Category"
            options={categoryOptions}
            value={formData.categoryId}
            onChange={(e) => handleInputChange('categoryId', e.target.value)}
            error={errors.categoryId}
          />
          
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            error={errors.date}
          />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button 
            variant={formData.type === 'income' ? 'success' : 'primary'} 
            type="submit" 
            loading={loading}
          >
            {transaction ? 'Update Transaction' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

interface TransactionsListProps {
  transactions: Transaction[];
  categories: Category[];
  loading?: boolean;
  onAdd: (data: Omit<TransactionFormData, 'amount'> & { amount: number }) => Promise<void>;
  onEdit: (id: string, data: Omit<TransactionFormData, 'amount'> & { amount: number }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const TransactionsList: React.FC<TransactionsListProps> = ({
  transactions,
  categories,
  loading = false,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.categoryName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesCategory = filterCategory === 'all' || transaction.categoryId === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const handleAdd = async (data: Omit<TransactionFormData, 'amount'> & { amount: number }) => {
    setModalLoading(true);
    try {
      await onAdd(data);
      setIsModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleEdit = async (data: Omit<TransactionFormData, 'amount'> & { amount: number }) => {
    if (!editingTransaction) return;
    
    setModalLoading(true);
    try {
      await onEdit(editingTransaction.id, data);
      setEditingTransaction(undefined);
      setIsModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(undefined);
  };

  const typeFilterOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expenses' },
  ];

  const categoryFilterOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat.id.toString(), label: cat.name })),
  ];

  return (
    <>
      <Card 
        title="Transactions" 
        subtitle={`Income: ₹${totalIncome.toLocaleString('en-IN')} | Expenses: ₹${totalExpenses.toLocaleString('en-IN')}`}
        action={
          <Button 
            size="sm" 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Transaction
          </Button>
        }
      >
        {/* Filters */}
        <div className="mb-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <Select
              options={typeFilterOptions}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
              className="w-full sm:w-auto"
            />
            <Select
              options={categoryFilterOptions}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full sm:w-auto"
            />
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {!loading && filteredTransactions.length === 0 && transactions.length === 0 && (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Add your first transaction to get started
            </p>
          </div>
        )}

        {!loading && filteredTransactions.length === 0 && transactions.length > 0 && (
          <div className="text-center py-8">
            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No transactions match your filters</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
        
        {!loading && filteredTransactions.length > 0 && (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center flex-1">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'income' 
                      ? 'bg-green-100 dark:bg-green-900/20' 
                      : 'bg-red-100 dark:bg-red-900/20'
                  }`}>
                    {transaction.type === 'income' ? (
                      <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.description}
                      </p>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${
                          transaction.type === 'income'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}₹
                          {Math.abs(transaction.amount).toLocaleString('en-IN', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {transaction.categoryIcon && (
                        <span className="mr-1">{transaction.categoryIcon}</span>
                      )}
                      {transaction.categoryColor && (
                        <div
                          className="w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: transaction.categoryColor }}
                        />
                      )}
                      <span>{transaction.categoryName}</span>
                      <span className="mx-1">•</span>
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(transaction.date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(transaction)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(transaction.id)}
                      loading={deletingId === transaction.id}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {filteredTransactions.length > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </p>
          </div>
        )}
      </Card>
      
      <TransactionModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={editingTransaction ? handleEdit : handleAdd}
        transaction={editingTransaction}
        categories={categories}
        loading={modalLoading}
      />
    </>
  );
};

export { TransactionsList, TransactionModal };
export type { Transaction, TransactionFormData };