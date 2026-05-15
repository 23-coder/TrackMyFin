import React, { useState, useEffect, useCallback, useMemo, useDeferredValue } from 'react';
import { Card } from '../components/ui/Card';
import { Button, Input } from '../components/ui/FormElements';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { apiService } from '../services/apiService';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  CreditCard,
  AlertCircle,
  Save,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Camera,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import ExportModal from '../components/ui/ExportModal';

interface Transaction {
  id: number;
  amount: number;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  categoryId: number;
  categoryName?: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Category {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE';
}

interface TransactionFormData {
  amount: string;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  categoryId: string;
  date: string;
  billImage?: string;
}

interface ExtractedExpense {
  description: string;
  amount: number;
  category: string;
  date: string;
  merchant?: string;
}

interface BalanceSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

const Transactions: React.FC = () => {
  useDocumentTitle('Transactions');
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { 
    transactions: dataTransactions, 
    categories: dataCategories, 
    salaries: dataSalaries,
    refreshTransactions, 
    refreshCategories,
    refreshSalaries 
  } = useData();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExtractionModalOpen, setIsExtractionModalOpen] = useState(false);
  const [extractedExpenses, setExtractedExpenses] = useState<ExtractedExpense[]>([]);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [hiddenTransactionIds, setHiddenTransactionIds] = useState<number[]>([]);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<number[]>([]);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [pendingDeleteTransaction, setPendingDeleteTransaction] = useState<Transaction | null>(null);
  const [pendingDeleteTransactionIds, setPendingDeleteTransactionIds] = useState<number[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [inputMethod, setInputMethod] = useState<'manual' | 'image'>('manual');
  
  const { success, error } = useToast();

  const [formData, setFormData] = useState<TransactionFormData>({
    amount: '',
    description: '',
    type: 'EXPENSE',
    categoryId: '',
    date: new Date().toISOString().split('T')[0],
    billImage: undefined
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [billImagePreview, setBillImagePreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const getHiddenTransactionsStorageKey = useCallback(() => {
    return `hidden_transactions_${user?.email || 'anonymous'}`;
  }, [user?.email]);

  const persistHiddenTransactions = useCallback((ids: number[]) => {
    localStorage.setItem(getHiddenTransactionsStorageKey(), JSON.stringify(ids));
  }, [getHiddenTransactionsStorageKey]);

  useEffect(() => {
    const key = getHiddenTransactionsStorageKey();
    const stored = localStorage.getItem(key);

    if (!stored) {
      setHiddenTransactionIds([]);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as number[];
      if (Array.isArray(parsed)) {
        setHiddenTransactionIds(parsed.filter((id) => Number.isFinite(id)));
      } else {
        setHiddenTransactionIds([]);
      }
    } catch {
      setHiddenTransactionIds([]);
    }
  }, [getHiddenTransactionsStorageKey]);

  const categoryNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const category of categories) {
      map.set(category.id, category.name);
    }
    return map;
  }, [categories]);

  // Helper function to get category name by ID
  const getCategoryName = useCallback((categoryId: number): string => {
    if (!categoryId) return 'Unknown';
    return categoryNameById.get(categoryId) || 'Unknown';
  }, [categoryNameById]);

  const hiddenTransactionIdSet = useMemo(() => new Set(hiddenTransactionIds), [hiddenTransactionIds]);
  const selectedTransactionIdSet = useMemo(() => new Set(selectedTransactionIds), [selectedTransactionIds]);

  // Handle bill image selection
  const handleBillImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        error('File too large', 'Image size must be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        error('Invalid file type', 'Please select an image file');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        setExtractionError(null);
        setFormData({ ...formData, billImage: base64String });
        setBillImagePreview(base64String);
        success('Image selected', 'Extracting expenses...');
        
        // Auto-extract expenses from the bill
        try {
          const result = await apiService.extractBillExpenses(base64String);
          
          if (result.success && result.expenses && result.expenses.length > 0) {
            // Get the first expense to populate the form
            const firstExpense = result.expenses[0];
            const matchingCategory = categories.find(cat =>
              cat.name.toLowerCase().includes(firstExpense.category?.toLowerCase() || '')
            );
            
            setFormData(prev => ({
              ...prev,
              amount: firstExpense.amount?.toString() || '',
              description: firstExpense.description || firstExpense.merchant || '',
              categoryId: matchingCategory?.id.toString() || categories[0]?.id.toString() || '1',
              date: firstExpense.date || new Date().toISOString().split('T')[0],
            }));
            
            setExtractedExpenses(result.expenses);
            success('✅ Auto-extracted', `Found ${result.expenses.length} expense(s) in the bill!`);
          } else {
            setExtractionError(result.message || 'No expenses found in this bill image.');
            error('No expenses found', result.message || 'Could not extract expenses from this bill image. Please enter details manually.');
          }
        } catch (err: any) {
          console.error('❌ Auto-extraction failed:', err);
          const errorMsg = err?.response?.data?.message || err?.message || 'Failed to extract expenses from bill';
          setExtractionError(errorMsg);
          error('Extraction Error', `${errorMsg}. Please enter the transaction details manually.`);
        }
      };
      reader.onerror = () => {
        error('Error reading file', 'Failed to read the image file');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle camera capture
  const handleCameraCapture = () => {
    fileInputRef.current?.click();
  };

  // Remove bill image
  const removeBillImage = () => {
    setFormData({ ...formData, billImage: undefined });
    setBillImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const hasTransactions = Array.isArray(dataTransactions);
    const hasCategories = Array.isArray(dataCategories);

    if (hasTransactions && hasCategories) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const bootstrapPageData = async () => {
      setLoading(true);
      await Promise.allSettled([refreshTransactions(), refreshCategories()]);
      if (isMounted) {
        setLoading(false);
      }
    };

    bootstrapPageData();

    return () => {
      isMounted = false;
    };
  }, [authLoading, isAuthenticated, dataTransactions, dataCategories, refreshTransactions, refreshCategories]);

  // Update local state when DataContext data changes
  useEffect(() => {
    setTransactions(dataTransactions || []);
  }, [dataTransactions]);

  useEffect(() => {
    setCategories(dataCategories || []);
  }, [dataCategories]);

  const balanceSummary: BalanceSummary = useMemo(() => {
    const visibleTransactions = transactions.filter((transaction) => !hiddenTransactionIdSet.has(transaction.id));

    const summary = visibleTransactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'INCOME') {
          acc.totalIncome += transaction.amount;
        } else {
          acc.totalExpenses += transaction.amount;
        }
        return acc;
      },
      { totalIncome: 0, totalExpenses: 0, netBalance: 0 }
    );

    summary.netBalance = summary.totalIncome - summary.totalExpenses;
    return summary;
  }, [transactions, hiddenTransactionIdSet]);

  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      type: 'EXPENSE',
      categoryId: '',
      date: new Date().toISOString().split('T')[0],
      billImage: undefined
    });
    setFormErrors({});
    setEditingTransaction(null);
    setBillImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (transaction: Transaction) => {
    // Ensure date is in YYYY-MM-DD format for the date input
    // Handle cases where date might be undefined, null, or empty
    let dateForInput = '';
    if (transaction.date) {
      dateForInput = transaction.date.includes('T') 
        ? transaction.date.split('T')[0] 
        : transaction.date;
    } else {
      // Fallback to current date if transaction date is missing
      dateForInput = new Date().toISOString().split('T')[0];
    }
    
    setFormData({
      amount: transaction.amount?.toString() || '',
      description: transaction.description || '',
      type: transaction.type || 'EXPENSE',
      categoryId: transaction.categoryId?.toString() || '',
      date: dateForInput,
    });
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors: Record<string, string> = {};
    if (!formData.amount.trim() || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      errors.amount = 'Valid amount is required';
    }
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    if (!formData.categoryId) {
      errors.categoryId = 'Category is required';
    }
    if (!formData.date) {
      errors.date = 'Date is required';
    }
    
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setFormLoading(true);
      const transactionData = {
        amount: Number(formData.amount),
        description: formData.description.trim(),
        type: formData.type,
        categoryId: Number(formData.categoryId),
        date: formData.date,
      };
      
      if (editingTransaction) {
        await apiService.updateTransaction(editingTransaction.id, transactionData);
        success('Transaction updated', 'Transaction updated successfully');
      } else {
        await apiService.addTransaction(transactionData);
        success('Transaction created', 'Transaction created successfully');
      }
      
      // Refresh both transactions and salaries from DataContext
      await refreshTransactions();
      await refreshSalaries(); // Refresh salaries in case this affects income calculations
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error('❌ Failed to save transaction:', {
        error: err,
        message: err.message,
        stack: err.stack,
        response: err.response?.data
      });
      error('Failed to save transaction', err.message || 'Unknown error');
    } finally {
      setFormLoading(false);
    }
  };

  const requestDeleteFromView = (transaction: Transaction) => {
    setPendingDeleteTransaction(transaction);
    setPendingDeleteTransactionIds([transaction.id]);
    setIsDeleteConfirmModalOpen(true);
  };

  const requestBulkDeleteFromView = () => {
    const filteredIds = filteredTransactions.map((transaction) => transaction.id);
    const selectedFilteredIds = filteredIds.filter((id) => selectedTransactionIds.includes(id));

    if (selectedFilteredIds.length === 0) {
      return;
    }

    setPendingDeleteTransaction(null);
    setPendingDeleteTransactionIds(selectedFilteredIds);
    setIsDeleteConfirmModalOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setIsDeleteConfirmModalOpen(false);
    setPendingDeleteTransaction(null);
    setPendingDeleteTransactionIds([]);
    setDeletingId(null);
  };

  const handleDeleteFromView = async () => {
    if (pendingDeleteTransactionIds.length === 0) {
      return;
    }

    try {
      setDeletingId(pendingDeleteTransactionIds[0]);
      setHiddenTransactionIds((prev) => {
        const next = Array.from(new Set([...prev, ...pendingDeleteTransactionIds]));
        persistHiddenTransactions(next);
        return next;
      });

      setSelectedTransactionIds((prev) => prev.filter((id) => !pendingDeleteTransactionIds.includes(id)));

      const deletedCount = pendingDeleteTransactionIds.length;

      success(
        deletedCount > 1 ? 'Transactions deleted' : 'Transaction deleted',
        deletedCount > 1
          ? `${deletedCount} transactions deleted successfully.`
          : 'Transaction deleted successfully.'
      );
      handleCloseDeleteConfirm();
    } catch (err: any) {
      error('Failed to hide transaction', err.message || 'Unknown error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddExtractedExpense = (expense: ExtractedExpense) => {
    setFormData({
      amount: expense.amount?.toString() || '',
      description: expense.description || expense.merchant || '',
      type: 'EXPENSE',
      categoryId: '',
      date: expense.date || new Date().toISOString().split('T')[0],
    });
    
    // Find matching category
    const matchingCategory = categories.find(cat => 
      cat.name.toLowerCase().includes(expense.category?.toLowerCase() || '')
    );
    if (matchingCategory) {
      setFormData(prev => ({
        ...prev,
        categoryId: matchingCategory.id.toString(),
      }));
    }
    
    setIsExtractionModalOpen(false);
    setIsModalOpen(true);
  };

  const handleAddAllExtractedExpenses = async () => {
    try {
      setFormLoading(true);
      let successCount = 0;
      let failureCount = 0;

      for (const expense of extractedExpenses) {
        try {
          const matchingCategory = categories.find(cat =>
            cat.name.toLowerCase().includes(expense.category?.toLowerCase() || '')
          );

          const transactionData = {
            amount: expense.amount,
            description: expense.description || expense.merchant || '',
            type: 'EXPENSE' as const,
            categoryId: matchingCategory?.id || categories[0]?.id || 1,
            date: expense.date || new Date().toISOString().split('T')[0],
          };

          await apiService.addTransaction(transactionData);
          successCount++;
        } catch (err) {
          console.error('Failed to add expense:', err);
          failureCount++;
        }
      }

      setIsExtractionModalOpen(false);
      setExtractedExpenses([]);
      await refreshTransactions();
      await refreshSalaries();
      success(
        'Expenses Added',
        `Added ${successCount} expense(s)${failureCount > 0 ? ` (${failureCount} failed)` : ''}`
      );
    } catch (err: any) {
      error('Failed to add expenses', err.message || 'Unknown error');
    } finally {
      setFormLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    const searchLower = deferredSearchTerm.toLowerCase();

    return transactions
      .filter((transaction) => !hiddenTransactionIdSet.has(transaction.id))
      .map((transaction) => ({
        ...transaction,
        categoryName: transaction.categoryName || getCategoryName(transaction.categoryId),
      }))
      .filter((transaction) => (
        transaction.description.toLowerCase().includes(searchLower) ||
        transaction.categoryName?.toLowerCase().includes(searchLower)
      ));
  }, [transactions, hiddenTransactionIdSet, deferredSearchTerm, getCategoryName]);

  const filteredTransactionIds = useMemo(
    () => filteredTransactions.map((transaction) => transaction.id),
    [filteredTransactions]
  );
  const filteredTransactionIdSet = useMemo(() => new Set(filteredTransactionIds), [filteredTransactionIds]);
  const selectedFilteredCount = filteredTransactionIds.filter((id) => selectedTransactionIdSet.has(id)).length;
  const allFilteredSelected = filteredTransactionIds.length > 0 && selectedFilteredCount === filteredTransactionIds.length;
  const isBulkDeleting = deletingId !== null;

  useEffect(() => {
    setSelectedTransactionIds((prev) => {
      const next = prev.filter((id) => filteredTransactionIdSet.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [filteredTransactionIdSet]);

  const handleToggleTransactionSelection = (transactionId: number) => {
    setSelectedTransactionIds((prev) =>
      prev.includes(transactionId)
        ? prev.filter((id) => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleToggleSelectAllFiltered = () => {
    setSelectedTransactionIds((prev) => {
      if (allFilteredSelected) {
        return prev.filter((id) => !filteredTransactionIdSet.has(id));
      }

      return Array.from(new Set([...prev, ...filteredTransactionIds]));
    });
  };

  const getFilteredCategories = () => {
    return categories.filter(category => category.type === formData.type);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return 'No Date';
    }
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('❌ Date parsing error:', error, 'for date:', dateString);
      return 'Invalid Date';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <div className="text-center p-6">
            <div className="loader mx-auto mb-4" aria-hidden="true">
              <div className="loader__bar"></div>
              <div className="loader__bar"></div>
              <div className="loader__bar"></div>
              <div className="loader__bar"></div>
              <div className="loader__bar"></div>
              <div className="loader__ball"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Loading...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Checking authentication status
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <div className="text-center p-6">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please login to access transactions.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your income and expense transactions
          </p>
        </div>

        {/* Balance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Income</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(balanceSummary.totalIncome)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</h3>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(balanceSummary.totalExpenses)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className={`h-8 w-8 ${balanceSummary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Balance</h3>
                  <p className={`text-2xl font-bold ${balanceSummary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(balanceSummary.netBalance)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="danger"
              onClick={requestBulkDeleteFromView}
              disabled={selectedFilteredCount === 0 || isBulkDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedFilteredCount})
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => setIsExportModalOpen(true)}
              disabled={transactions.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={openAddModal}>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Transactions Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="loader mx-auto mb-4" aria-hidden="true">
              <div className="loader__bar"></div>
              <div className="loader__bar"></div>
              <div className="loader__bar"></div>
              <div className="loader__bar"></div>
              <div className="loader__bar"></div>
              <div className="loader__ball"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400">Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No transactions found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchTerm ? 'No transactions match your search' : 'Create your first transaction to get started'}
              </p>
              <Button onClick={openAddModal}>
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={handleToggleSelectAllFiltered}
                        aria-label="Select all filtered transactions"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedTransactionIds.includes(transaction.id)}
                          onChange={() => handleToggleTransactionSelection(transaction.id)}
                          aria-label={`Select transaction ${transaction.description}`}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${
                          transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {transaction.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.type === 'INCOME' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {transaction.categoryName || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(transaction)}
                            disabled={isBulkDeleting}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => requestDeleteFromView(transaction)}
                            loading={deletingId === transaction.id || isBulkDeleting}
                            disabled={isBulkDeleting}
                            className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Transaction Form Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingTransaction ? "Edit Transaction" : "Add Transaction"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Method Selector */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setInputMethod('manual')}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  inputMethod === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <Edit className="h-4 w-4" />
                Manual Entry
              </button>
              <button
                type="button"
                onClick={() => setInputMethod('image')}
                className={`flex-1 py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  inputMethod === 'image'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <Camera className="h-4 w-4" />
                Upload Bill
              </button>
            </div>

            {/* Manual Entry Section */}
            {inputMethod === 'manual' && (
              <>
            <div>
              <Input
                label="Amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="Enter amount"
                required
                error={formErrors.amount}
              />
            </div>
            
            <div>
              <Input
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter description"
                required
                error={formErrors.description}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                value={formData.type}
                onChange={(e) => {
                  setFormData({
                    ...formData, 
                    type: e.target.value as 'INCOME' | 'EXPENSE',
                    categoryId: '' // Reset category when type changes
                  });
                }}
                required
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                value={formData.categoryId}
                onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                required
              >
                <option value="">Select a category</option>
                {getFilteredCategories().map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {formErrors.categoryId && (
                <p className="mt-1 text-sm text-red-600">{formErrors.categoryId}</p>
              )}
            </div>
            
            <div>
              <Input
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
                error={formErrors.date}
              />
            </div>
              </>
            )}

            {/* Image Upload Section */}
            {inputMethod === 'image' && (
              <>
            {/* Bill Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Camera className="h-4 w-4 inline mr-2" />
                Upload Your Bill/Receipt
              </label>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBillImageSelect}
                className="hidden"
                aria-label="Upload bill image"
              />

              {billImagePreview ? (
                <div className="space-y-2">
                  <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border-2 border-dashed border-blue-400">
                    <img 
                      src={billImagePreview} 
                      alt="Bill preview" 
                      className="max-w-full h-auto max-h-48 mx-auto rounded"
                    />
                    <button
                      type="button"
                      onClick={removeBillImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                      title="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">✓ Bill image selected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCameraCapture}
                      className="flex-1"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Capture Bill
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCameraCapture}
                      className="flex-1"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                PNG, JPG, WebP up to 5MB. AI will extract all expenses automatically! 🤖
              </p>
            </div>

            {/* Optional Manual Fields for Image Method */}
            {billImagePreview && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  ℹ️ You can edit the auto-extracted details below if needed:
                </p>
                <div className="space-y-3">
                  <Input
                    label="Amount (Optional)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="Auto-filled from image"
                  />
                  <Input
                    label="Description (Optional)"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Auto-filled from image"
                  />
                </div>
              </div>
            )}
              </>
            )}

            {/* Common Fields Shown After Input Method */}
            {billImagePreview && inputMethod === 'image' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    value={formData.type}
                    onChange={(e) => {
                      setFormData({
                        ...formData, 
                        type: e.target.value as 'INCOME' | 'EXPENSE',
                        categoryId: ''
                      });
                    }}
                    required
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    required
                  >
                    <option value="">Select a category</option>
                    {getFilteredCategories().map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.categoryId && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.categoryId}</p>
                  )}
                </div>
                
                <div>
                  <Input
                    label="Date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                    error={formErrors.date}
                  />
                </div>
              </>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)} 
                type="button"
                disabled={formLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                type="submit" 
                loading={formLoading}
                disabled={formLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingTransaction ? 'Update' : 'Create'} Transaction
              </Button>
            </div>
          </form>
        </Modal>

        {/* Delete Confirmation Modal (View-only hide) */}
        <Modal
          isOpen={isDeleteConfirmModalOpen}
          onClose={handleCloseDeleteConfirm}
          title="Delete Transaction"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {pendingDeleteTransactionIds.length > 1
                ? `Are you sure you want to delete ${pendingDeleteTransactionIds.length} selected transactions?`
                : 'Are you sure you want to delete this transaction?'}
            </p>
            {pendingDeleteTransactionIds.length > 1 ? (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {pendingDeleteTransactionIds.length} transactions selected
                </p>
              </div>
            ) : pendingDeleteTransaction && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{pendingDeleteTransaction.description}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {formatCurrency(pendingDeleteTransaction.amount)} - {formatDate(pendingDeleteTransaction.date)}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={handleCloseDeleteConfirm}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteFromView}
                loading={isBulkDeleting}
                disabled={isBulkDeleting}
              >
                Delete
              </Button>
            </div>
          </div>
        </Modal>

        {/* Export Modal */}
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          transactions={[
            ...transactions,
            // Add salaries as income transactions for export
            ...(dataSalaries?.map((salary, index) => ({
              id: -1000 - index, // Use negative IDs for salaries to avoid conflicts
              amount: salary.amount,
              description: `${salary.description} (Salary)`,
              type: 'INCOME' as const,
              categoryId: 1, // Use a valid category ID
              categoryName: 'Salary',
              date: salary.date,
              createdAt: salary.date,
              updatedAt: salary.date
            })) || [])
          ]}
          categories={categories}
        />

        {/* Bill Extraction Modal */}
        <Modal
          isOpen={isExtractionModalOpen}
          onClose={() => setIsExtractionModalOpen(false)}
          title="Review Extracted Expenses"
        >
          {extractionError ? (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle className="h-8 w-8 text-red-600 mb-2" />
              <p className="text-red-700 dark:text-red-300">{extractionError}</p>
              <button
                onClick={() => setIsExtractionModalOpen(false)}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {extractedExpenses.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Found {extractedExpenses.length} Expense(s)
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {extractedExpenses.map((expense, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {expense.description || expense.merchant}
                            </p>
                            {expense.merchant && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {expense.merchant}
                              </p>
                            )}
                          </div>
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatCurrency(expense.amount)}
                          </span>
                        </div>
                        <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
                          {expense.category && (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                              {expense.category}
                            </span>
                          )}
                          {expense.date && (
                            <span className="text-xs">
                              {new Date(expense.date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddExtractedExpense(expense)}
                          className="mt-2 text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                        >
                          <Check className="h-3 w-3" />
                          Add This
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleAddAllExtractedExpenses}
                  disabled={formLoading || extractedExpenses.length === 0}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Add All Expenses
                </button>
                <button
                  onClick={() => setIsExtractionModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Transactions;