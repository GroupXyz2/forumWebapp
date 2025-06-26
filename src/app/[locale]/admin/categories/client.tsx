'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Import locale translations directly
import enTranslations from '@/i18n/locales/en.json';
import deTranslations from '@/i18n/locales/de.json';

// Helper function for translation
const tr = (locale: string, key: string, section = 'admin') => {
  const localeStr = locale === 'de' ? 'de' : 'en';
  const translations = localeStr === 'de' ? deTranslations : enTranslations;
  const sectionObj = (translations as any)[section];
  
  if (!sectionObj) return key;
  
  const value = sectionObj[key];
  
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) return key;
  return typeof value === 'undefined' ? key : String(value);
};

const tc = (locale: string, key: string) => {
  return tr(locale, key, 'common');
};

interface Category {
  id: string;
  name: string | { en: string; de: string };
  description: string | { en: string; de: string };
  slug: string;
  color: string;
  icon: string;
  order: number;
  threadCount: number;
}

// Helper function to safely get string value from potentially multilingual field
const getStringValue = (value: string | { en: string; de: string } | unknown, locale: string): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'object' && value !== null) {
    // For multilingual objects
    if ('en' in value || 'de' in value) {
      const multilingualValue = value as { en?: string; de?: string };
      return multilingualValue[locale as keyof typeof multilingualValue] || 
             multilingualValue.en || 
             Object.values(multilingualValue).find(Boolean) || '';
    }
  }
  
  // Fallback: convert to string safely
  try {
    return String(value);
  } catch (e) {
    console.error('Could not convert value to string:', value);
    return '';
  }
}

interface AdminCategoriesClientProps {
  locale: string;
}

export default function AdminCategoriesClient({ locale }: AdminCategoriesClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  useEffect(() => {
    // Redirect if not admin
    if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push(`/${locale}/forum`);
      } else {
        fetchCategories();
      }
    } else if (status === 'unauthenticated') {
      router.push(`/${locale}/auth/signin?callbackUrl=/${locale}/admin/categories`);
    }
  }, [session, status, router, locale]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      console.log(`Fetching categories from /${locale}/api/admin/categories`);
      const response = await fetch(`/${locale}/api/admin/categories`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Categories data:', data);
      
      if (data && Array.isArray(data.categories)) {
        // Process categories to ensure all fields are properly formatted
        const processedCategories = data.categories.map((category: any) => ({
          ...category,
          // Ensure name and description are processed if they're objects
          name: getStringValue(category.name, locale),
          description: getStringValue(category.description, locale),
          // Ensure other fields have defaults
          color: category.color || '#3b82f6',
          icon: category.icon || 'folder',
          order: typeof category.order === 'number' ? category.order : 0,
          threadCount: typeof category.threadCount === 'number' ? category.threadCount : 0
        }));
        
        setCategories(processedCategories);
      } else {
        setCategories([]);
        console.warn('Received invalid categories data:', data);
      }
    } catch (err) {
      setError('Error loading categories');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = () => {
    setIsCreating(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm(tr(locale, 'confirmDeleteCategory', 'admin') || 'Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        const response = await fetch(`/${locale}/api/admin/categories/${categoryId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(tr(locale, 'failedToDeleteCategory', 'admin') || 'Failed to delete category');
        }
        
        // Refresh categories
        fetchCategories();
      } catch (err) {
        setError(tr(locale, 'errorDeletingCategory', 'admin') || 'Error deleting category');
        console.error(err);
      }
    }
  };

  // Show loading state while checking authentication
  if (status === 'loading' || status === 'unauthenticated') {
    return <div className="flex justify-center items-center h-64">{tc(locale, 'loading')}</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{tr(locale, 'categoryManagement', 'admin')}</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {tr(locale, 'manageCategoriesDescription', 'admin') || 'Create, edit, and manage categories'}
          </p>
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          onClick={handleCreateCategory}
        >
          <span className="mr-2">+</span>
          {tr(locale, 'createCategory', 'admin')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">{tc(locale, 'loading')}</div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold">{tr(locale, 'categories', 'forum')}</h2>
          </div>
          
          {categories.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              {tr(locale, 'noCategoriesFound', 'admin') || 'No categories found'}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {tc(locale, 'order')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {tr(locale, 'categoryName', 'admin')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {tr(locale, 'categorySlug', 'admin')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {tr(locale, 'threads', 'forum')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {tc(locale, 'actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {categories.map((category, index) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {category.order || index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: category.color || '#3b82f6' }}></div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {getStringValue(category.name, locale)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {category.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {category.threadCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        onClick={() => handleEditCategory(category)}
                      >
                        {tc(locale, 'edit')}
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        {tc(locale, 'delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal forms for creating/editing categories */}
      {(isCreating || editingCategory) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-2xl">
            <h3 className="text-xl font-semibold mb-4">
              {isCreating ? tr(locale, 'createCategory', 'admin') : tr(locale, 'editCategory', 'admin')}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const formData = new FormData(form);
              
              const categoryData = {
                name: {
                  en: formData.get('nameEn') as string,
                  de: formData.get('nameDe') as string,
                },
                description: {
                  en: formData.get('descriptionEn') as string,
                  de: formData.get('descriptionDe') as string,
                },
                slug: formData.get('slug') as string,
                color: formData.get('color') as string,
                icon: formData.get('icon') as string,
                order: parseInt(formData.get('order') as string) || 0,
              };
              
              if (isCreating) {
                // Create category
                fetch(`/${locale}/api/admin/categories`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(categoryData),
                })
                .then(response => {
                  if (!response.ok) throw new Error('Failed to create category');
                  return response.json();
                })
                .then(() => {
                  setIsCreating(false);
                  fetchCategories();
                })
                .catch(err => {
                  console.error('Error creating category:', err);
                  setError('Failed to create category');
                });
              } else if (editingCategory) {
                // Update category
                fetch(`/${locale}/api/admin/categories/${editingCategory.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...categoryData, id: editingCategory.id }),
                })
                .then(response => {
                  if (!response.ok) throw new Error('Failed to update category');
                  return response.json();
                })
                .then(() => {
                  setEditingCategory(null);
                  fetchCategories();
                })
                .catch(err => {
                  console.error('Error updating category:', err);
                  setError('Failed to update category');
                });
              }
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {tr(locale, 'categoryName', 'admin')} (EN)
                  </label>
                  <input
                    type="text"
                    name="nameEn"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    defaultValue={editingCategory ? getStringValue(editingCategory.name, 'en') : ''}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {tr(locale, 'categoryName', 'admin')} (DE)
                  </label>
                  <input
                    type="text"
                    name="nameDe"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    defaultValue={editingCategory ? getStringValue(editingCategory.name, 'de') : ''}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {tr(locale, 'categoryDescription', 'admin')} (EN)
                  </label>
                  <textarea
                    name="descriptionEn"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    rows={3}
                    defaultValue={editingCategory ? getStringValue(editingCategory.description, 'en') : ''}
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {tr(locale, 'categoryDescription', 'admin')} (DE)
                  </label>
                  <textarea
                    name="descriptionDe"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    rows={3}
                    defaultValue={editingCategory ? getStringValue(editingCategory.description, 'de') : ''}
                  ></textarea>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {tr(locale, 'categorySlug', 'admin')}
                  </label>
                  <input
                    type="text"
                    name="slug"
                    required
                    pattern="[a-z0-9-]+"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    defaultValue={editingCategory?.slug || ''}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {tr(locale, 'slugFormat', 'admin')}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {tr(locale, 'categoryColor', 'admin')}
                  </label>
                  <input
                    type="color"
                    name="color"
                    className="w-full h-9 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white"
                    defaultValue={editingCategory?.color || '#3b82f6'}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {tr(locale, 'categoryOrder', 'admin')}
                  </label>
                  <input
                    type="number"
                    name="order"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    defaultValue={editingCategory?.order || categories.length}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {tr(locale, 'categoryIcon', 'admin')}
                </label>
                <input
                  type="text"
                  name="icon"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  defaultValue={editingCategory?.icon || 'folder'}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Icon name (e.g., folder, file, message)
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingCategory(null);
                  }}
                >
                  {tc(locale, 'cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
                >
                  {tc(locale, 'save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
