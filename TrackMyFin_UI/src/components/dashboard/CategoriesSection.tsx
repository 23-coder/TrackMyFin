import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button, Input } from '../ui/FormElements';
import { Modal } from '../ui/Modal';
import { Folder, Plus, Edit, Trash2, Tag } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  type: 'INCOME' | 'EXPENSE';
  createdAt?: string;
  updatedAt?: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
  type: 'INCOME' | 'EXPENSE';
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  category?: Category;
  loading?: boolean;
}

const PREDEFINED_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange  
  '#F59E0B', // Yellow
  '#10B981', // Green
  '#14B8A6', // Teal
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
];

const PREDEFINED_ICONS = [
  '🏠', '🚗', '🍔', '👕', '💊', '📱', '🎬', '✈️', '🏋️', '📚',
  '💰', '🎯', '🛒', '⚡', '🌐', '🏢', '🎵', '🍕', '☕', '🎮'
];

const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  category,
  loading = false,
}) => {
  const [formData, setFormData] = useState<CategoryFormData>(() => ({
    name: category?.name || '',
    description: category?.description || '',
    color: category?.color || PREDEFINED_COLORS[0],
    icon: category?.icon || PREDEFINED_ICONS[0],
    type: category?.type || 'EXPENSE',
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await onSubmit({
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
      });
      onClose();
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleInputChange = (field: keyof CategoryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'Edit Category' : 'Add New Category'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Category Name"
          placeholder="e.g., Groceries, Transportation, Entertainment"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          error={errors.name}
        />
        
        <Input
          label="Description (Optional)"
          placeholder="Brief description of this category"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="type"
                value="INCOME"
                checked={formData.type === 'INCOME'}
                onChange={(e) => handleInputChange('type', e.target.value as 'INCOME' | 'EXPENSE')}
                className="mr-2"
              />
              Income
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="type"
                value="EXPENSE"
                checked={formData.type === 'EXPENSE'}
                onChange={(e) => handleInputChange('type', e.target.value as 'INCOME' | 'EXPENSE')}
                className="mr-2"
              />
              Expense
            </label>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Color
          </label>
          <div className="grid grid-cols-5 gap-2">
            {PREDEFINED_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`w-8 h-8 rounded-full border-2 ${
                  formData.color === color 
                    ? 'border-gray-400 dark:border-gray-500' 
                    : 'border-gray-200 dark:border-gray-600'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleInputChange('color', color)}
              />
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Icon
          </label>
          <div className="grid grid-cols-10 gap-2">
            {PREDEFINED_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                className={`w-8 h-8 rounded border text-lg flex items-center justify-center ${
                  formData.icon === icon
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleInputChange('icon', icon)}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            {category ? 'Update Category' : 'Add Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

interface CategoriesListProps {
  categories: Category[];
  loading?: boolean;
  onAdd: (data: CategoryFormData) => Promise<void>;
  onEdit: (id: number, data: CategoryFormData) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const CategoriesList: React.FC<CategoriesListProps> = ({
  categories,
  loading = false,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const handleAdd = async (data: CategoryFormData) => {
    setModalLoading(true);
    try {
      await onAdd(data);
      setIsModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleEdit = async (data: CategoryFormData) => {
    if (!editingCategory) return;
    
    setModalLoading(true);
    try {
      await onEdit(editingCategory.id, data);
      setEditingCategory(undefined);
      setIsModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (error) {
      console.error('Failed to delete category:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(undefined);
  };

  return (
    <>
      <Card 
        title="Categories" 
        subtitle={`${categories.length} categories`}
        action={
          <Button 
            size="sm" 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Category
          </Button>
        }
      >
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {!loading && categories.length === 0 && (
          <div className="text-center py-8">
            <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No categories found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Create your first category to organize transactions
            </p>
          </div>
        )}
        
        {!loading && categories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {category.icon && (
                      <span className="text-lg mr-2">{category.icon}</span>
                    )}
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {category.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(category)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                      loading={deletingId === category.id}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {category.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {category.description}
                  </p>
                )}
                
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Tag className="h-3 w-3 mr-1" />
                  0 transactions
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      
      <CategoryModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={editingCategory ? handleEdit : handleAdd}
        category={editingCategory}
        loading={modalLoading}
      />
    </>
  );
};

export { CategoriesList, CategoryModal };
export type { Category, CategoryFormData };