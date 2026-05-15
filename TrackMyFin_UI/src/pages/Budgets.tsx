import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button, Input } from '../components/ui/FormElements';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import {
  Plus,
  Edit,
  Trash2,
  Target,
  AlertCircle,
  Save,
  X,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface Budget {
  id: number;
  name: string;
  amount: number;
  spentAmount: number;
  remainingAmount: number;
  spentPercentage: number;
  period: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: string;
  endDate: string;
  active: boolean;
  category?: { id: number; name: string };
}

interface BudgetFormData {
  name: string;
  amount: string;
  period: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  startDate: string;
  endDate: string;
  categoryId: string;
  active: boolean;
}

const PERIOD_LABELS: Record<string, string> = {
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  YEARLY: 'Yearly',
};

const defaultEndDate = (start: string, period: string): string => {
  if (!start) return '';
  const d = new Date(start);
  switch (period) {
    case 'WEEKLY':    d.setDate(d.getDate() + 6); break;
    case 'MONTHLY':   d.setMonth(d.getMonth() + 1); d.setDate(d.getDate() - 1); break;
    case 'QUARTERLY': d.setMonth(d.getMonth() + 3); d.setDate(d.getDate() - 1); break;
    case 'YEARLY':    d.setFullYear(d.getFullYear() + 1); d.setDate(d.getDate() - 1); break;
  }
  return d.toISOString().split('T')[0];
};

const Budgets: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading, currency } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const { success, error } = useToast();

  const today = new Date().toISOString().split('T')[0];

  const emptyForm = (): BudgetFormData => ({
    name: '',
    amount: '',
    period: 'MONTHLY',
    startDate: today,
    endDate: defaultEndDate(today, 'MONTHLY'),
    categoryId: '',
    active: true,
  });

  const [formData, setFormData] = useState<BudgetFormData>(emptyForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [budgetData, categoryData] = await Promise.all([
        apiService.getBudgets(),
        apiService.getCategories(),
      ]);
      setBudgets(budgetData);
      setCategories(categoryData.filter((c: any) => c.type === 'EXPENSE'));
    } catch (err: any) {
      error('Failed to load budgets', err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) loadData();
    else if (!authLoading && !isAuthenticated) setLoading(false);
  }, [isAuthenticated, authLoading, loadData]);

  const openAddModal = () => {
    setFormData(emptyForm());
    setFormErrors({});
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  const openEditModal = (b: Budget) => {
    setFormData({
      name: b.name,
      amount: String(b.amount),
      period: b.period,
      startDate: b.startDate,
      endDate: b.endDate,
      categoryId: b.category ? String(b.category.id) : '',
      active: b.active,
    });
    setFormErrors({});
    setEditingBudget(b);
    setIsModalOpen(true);
  };

  const handlePeriodChange = (period: BudgetFormData['period']) => {
    setFormData(f => ({
      ...f,
      period,
      endDate: defaultEndDate(f.startDate, period),
    }));
  };

  const handleStartDateChange = (startDate: string) => {
    setFormData(f => ({
      ...f,
      startDate,
      endDate: defaultEndDate(startDate, f.period),
    }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Name is required';
    const amt = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amt) || amt <= 0) errs.amount = 'Enter a valid amount';
    if (!formData.startDate) errs.startDate = 'Start date is required';
    if (!formData.endDate) errs.endDate = 'End date is required';
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate)
      errs.endDate = 'End date must be after start date';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setFormLoading(true);
      const payload = {
        name: formData.name.trim(),
        amount: parseFloat(formData.amount),
        period: formData.period,
        startDate: formData.startDate,
        endDate: formData.endDate,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
        active: formData.active,
      };

      if (editingBudget) {
        await apiService.updateBudget(editingBudget.id, payload);
        success('Budget updated', 'Budget updated successfully');
      } else {
        await apiService.createBudget(payload);
        success('Budget created', 'Budget created successfully');
      }

      await loadData();
      setIsModalOpen(false);
    } catch (err: any) {
      error('Failed to save budget', err.message || 'Unknown error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this budget?')) return;
    try {
      setDeletingId(id);
      await apiService.deleteBudget(id);
      success('Budget deleted', 'Budget deleted successfully');
      await loadData();
    } catch (err: any) {
      error('Failed to delete budget', err.message || 'Unknown error');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = budgets.filter(b => {
    if (filter === 'active') return b.active;
    if (filter === 'inactive') return !b.active;
    return true;
  });

  const totalBudget = filtered.reduce((s, b) => s + b.amount, 0);
  const totalSpent = filtered.reduce((s, b) => s + b.spentAmount, 0);
  const totalRemaining = totalBudget - totalSpent;

  const progressColor = (pct: number) => {
    if (pct >= 100) return 'bg-red-600';
    if (pct >= 85) return 'bg-orange-500';
    if (pct >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <div className="text-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading...</h2>
            <p className="text-gray-600 dark:text-gray-400">Checking authentication status</p>
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Authentication Required</h2>
            <p className="text-gray-600 dark:text-gray-400">Please login to access budgets.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Budgets</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">Track spending against your limits</p>
          </div>
          <Button onClick={openAddModal}>
            <Plus className="h-4 w-4 mr-2" />
            New Budget
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Budget', value: totalBudget, color: 'text-blue-600' },
            { label: 'Total Spent', value: totalSpent, color: 'text-red-600' },
            { label: 'Remaining', value: totalRemaining, color: totalRemaining >= 0 ? 'text-green-600' : 'text-red-600' },
          ].map(({ label, value, color }) => (
            <Card key={label}>
              <div className="p-6">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${color}`}>{formatCurrency(value)}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex space-x-2 mb-6">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Budget grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading budgets...</p>
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <div className="text-center py-16">
              <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No budgets found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {filter !== 'all' ? `No ${filter} budgets` : 'Create your first budget to start tracking'}
              </p>
              <Button onClick={openAddModal}>
                <Plus className="h-4 w-4 mr-2" />
                New Budget
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map(b => {
              const pct = Math.min(b.spentPercentage ?? (b.spentAmount / b.amount) * 100, 100);
              const isOver = (b.spentPercentage ?? 0) > 100;
              return (
                <Card key={b.id} className="flex flex-col">
                  <div className="p-6 flex-1">
                    {/* Title row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{b.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                            {PERIOD_LABELS[b.period]}
                          </span>
                          {b.category && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                              {b.category.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        {b.active
                          ? <CheckCircle className="h-5 w-5 text-green-500" />
                          : <Clock className="h-5 w-5 text-gray-400" />}
                      </div>
                    </div>

                    {/* Amounts */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">
                          Spent: <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(b.spentAmount)}</span>
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          of <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(b.amount)}</span>
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${progressColor(b.spentPercentage ?? pct)}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-xs mt-1.5">
                        <span className={isOver ? 'text-red-600 font-semibold' : 'text-gray-500 dark:text-gray-400'}>
                          {isOver
                            ? `Over by ${formatCurrency(b.spentAmount - b.amount)}`
                            : `${Math.round(b.spentPercentage ?? pct)}% used`}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {formatCurrency(Math.max(b.remainingAmount ?? (b.amount - b.spentAmount), 0))} left
                        </span>
                      </div>
                    </div>

                    {/* Dates */}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="px-6 pb-4 flex justify-end space-x-2 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(b)} disabled={deletingId === b.id}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(b.id)}
                      loading={deletingId === b.id}
                      disabled={deletingId === b.id}
                      className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudget ? 'Edit Budget' : 'New Budget'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Budget Name"
            value={formData.name}
            onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Monthly Groceries"
            required
            error={formErrors.name}
          />

          <Input
            label="Amount"
            type="number"
            min="0.01"
            step="0.01"
            value={formData.amount}
            onChange={e => setFormData(f => ({ ...f, amount: e.target.value }))}
            placeholder="0.00"
            required
            error={formErrors.amount}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Period</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              value={formData.period}
              onChange={e => handlePeriodChange(e.target.value as BudgetFormData['period'])}
            >
              {Object.entries(PERIOD_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={e => handleStartDateChange(e.target.value)}
              required
              error={formErrors.startDate}
            />
            <Input
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={e => setFormData(f => ({ ...f, endDate: e.target.value }))}
              required
              error={formErrors.endDate}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              value={formData.categoryId}
              onChange={e => setFormData(f => ({ ...f, categoryId: e.target.value }))}
            >
              <option value="">No category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="active-toggle"
              type="checkbox"
              checked={formData.active}
              onChange={e => setFormData(f => ({ ...f, active: e.target.checked }))}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="active-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active budget
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} type="button" disabled={formLoading}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" loading={formLoading} disabled={formLoading}>
              <Save className="h-4 w-4 mr-2" />
              {editingBudget ? 'Update' : 'Create'} Budget
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Budgets;
