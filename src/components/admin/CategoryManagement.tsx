'use client';

import { useState } from 'react';
import { Trash, Edit, Plus, Move } from 'lucide-react';
// Import locale translations directly
import enTranslations from '@/i18n/locales/en.json';
import deTranslations from '@/i18n/locales/de.json';

// Helper functions for translation
const tr = (locale: string, key: string, section = 'admin') => {
  // Force locale to be either 'en' or 'de'
  const localeStr = typeof locale === 'string' ? (locale === 'de' ? 'de' : 'en') : 'en';
  const translations = localeStr === 'de' ? deTranslations : enTranslations;
  const sectionObj = (translations as any)[section];
  
  if (!sectionObj) return key;
  
  const value = sectionObj[key];
  
  if (typeof value === 'string') return value;
  // If value is an object (bad translation), return key
  if (typeof value === 'object' && value !== null) return key;
  return typeof value === 'undefined' ? key : String(value);
};

const tc = (locale: string, key: string) => {
  return tr(locale, key, 'common');
};
import CategoryForm from './CategoryForm';

interface Category {
  id: string;
  name: string;
  description: string;
  slug: string;
  color: string;
  icon: string;
  order: number;
  threadCount: number;
}

interface CategoryManagementProps {
  initialCategories: Category[];
  locale: string;
}

export default function CategoryManagement({ initialCategories, locale }: CategoryManagementProps) {
  // Ensure locale is a string
  const actualLocale = typeof locale === 'string' ? locale : 'en';
  
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // We now use our helper functions with the locale prop
  
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };
  
  const handleCreateCategory = async (formData: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await fetch(`/${actualLocale}/api/admin/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create category');
      }
      
      const data = await response.json();
      setCategories([...categories, data.category]);
      setIsCreating(false);
      showSuccess(tr(actualLocale, 'categoryCreated'));
    } catch (err) {
      console.error('Create category error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdateCategory = async (formData: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await fetch(`/${locale}/api/admin/categories/${editingCategory?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update category');
      }
      
      const data = await response.json();
      setCategories(categories.map(cat => 
        cat.id === editingCategory?.id ? data.category : cat
      ));
      setEditingCategory(null);
      showSuccess(tr(actualLocale, 'categoryUpdated'));
    } catch (err) {
      console.error('Update category error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await fetch(`/${locale}/api/admin/categories/${deletingCategory}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete category');
      }
      
      setCategories(categories.filter(cat => cat.id !== deletingCategory));
      setDeletingCategory(null);
      showSuccess(tr(actualLocale, 'categoryDeleted'));
    } catch (err) {
      console.error('Delete category error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReorderCategory = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(cat => cat.id === id);
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === categories.length - 1)
    ) {
      return;
    }
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const reordered = [...categories];
    
    // Swap the items
    [reordered[currentIndex], reordered[newIndex]] = [reordered[newIndex], reordered[currentIndex]];
    
    // Update the order values
    const updatedCategories = reordered.map((cat, idx) => ({ ...cat, order: idx }));
    
    try {
      setCategories(updatedCategories);
      
      // Now update the order in the database
      const response = await fetch(`/${locale}/api/admin/categories/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          categories: updatedCategories.map(cat => ({ 
            id: cat.id, 
            order: cat.order 
          }))
        }),
      });
      
      if (!response.ok) {
        // If failed, revert the order in the UI
        setCategories(categories);
        throw new Error('Failed to update category order');
      }
    } catch (err) {
      console.error('Reorder category error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };
  
  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
          {successMessage}
        </div>
      )}
      
      {/* Categories List */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between">
          <h2 className="text-xl font-semibold">{tr(actualLocale, 'categories')}</h2>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            <Plus size={16} />
            {tr(actualLocale, 'createCategory')}
          </button>
        </div>
        
        {categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {tr(actualLocale, 'noCategories')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {tr(actualLocale, 'order')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {tr(actualLocale, 'categoryName')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {tr(actualLocale, 'categorySlug')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {tr(actualLocale, 'threads')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {tc(actualLocale, 'actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {categories.map((category, index) => (
                  <tr key={category.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReorderCategory(category.id, 'up')}
                          disabled={index === 0}
                          className={`p-1 rounded ${
                            index === 0 
                              ? 'text-gray-300 dark:text-gray-700' 
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m18 15-6-6-6 6"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleReorderCategory(category.id, 'down')}
                          disabled={index === categories.length - 1}
                          className={`p-1 rounded ${
                            index === categories.length - 1
                              ? 'text-gray-300 dark:text-gray-700'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6"/>
                          </svg>
                        </button>
                        <span>{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {category.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {category.threadCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditingCategory(category)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 mx-2"
                      >
                        <Edit size={18} />
                        <span className="sr-only">{tc(actualLocale, 'edit')}</span>
                      </button>
                      <button
                        onClick={() => setDeletingCategory(category.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 mx-2"
                        disabled={category.threadCount > 0}
                      >
                        <Trash size={18} />
                        <span className="sr-only">{tc(actualLocale, 'delete')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Create Category Form */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">{tr(actualLocale, 'createCategory')}</h2>
              <CategoryForm 
                onSubmit={handleCreateCategory}
                onCancel={() => setIsCreating(false)}
                isSubmitting={isSubmitting}
                locale={actualLocale}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Category Form */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">{tr(actualLocale, 'editCategory')}</h2>
              <CategoryForm 
                initialData={editingCategory}
                onSubmit={handleUpdateCategory}
                onCancel={() => setEditingCategory(null)}
                isSubmitting={isSubmitting}
                locale={actualLocale}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation */}
      {deletingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">{tr(actualLocale, 'deleteCategory')}</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {tr(actualLocale, 'confirmDeleteCategory')}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeletingCategory(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  disabled={isSubmitting}
                >
                  {tc(actualLocale, 'cancel')}
                </button>
                <button
                  onClick={handleDeleteCategory}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? tc(actualLocale, 'loading') : tc(actualLocale, 'delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
