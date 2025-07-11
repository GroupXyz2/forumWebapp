'use client';

import { useState } from 'react';
// Import locale translations directly
import enTranslations from '@/i18n/locales/en.json';
import deTranslations from '@/i18n/locales/de.json';

interface CategoryFormProps {
  initialData?: {
    name: string;
    description: string;
    slug: string;
    color: string;
    icon: string;
  };
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  locale: string;
}

export default function CategoryForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  locale
}: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    slug: initialData?.slug || '',
    color: initialData?.color || '#3b82f6',
    icon: initialData?.icon || 'folder'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Helper functions for translation
  const tr = (key: string, section = 'admin') => {
    // Force locale to be either 'en' or 'de'
    const localeStr = typeof locale === 'string' ? (locale === 'de' ? 'de' : 'en') : 'en';
    const translations = localeStr === 'de' ? deTranslations : enTranslations;
    
    const sectionObj = (translations as any)[section];
    if (!sectionObj) return key;
    
    const value = sectionObj[key];
    
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) return key;
    
    return typeof value === 'undefined' ? key : String(value);
  };
  
  const tc = (key: string) => {
    return tr(key, 'common');
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = tr('categoryRequired');
    }
    
    if (!formData.slug.trim()) {
      newErrors.slug = tr('slugRequired');
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = tr('slugFormat');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };
  
  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    handleChange(e);
    
    // Only auto-generate slug if slug is empty or matches the previous auto-generated slug
    if (!initialData?.slug || !formData.slug.trim()) {
      const slug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      
      setFormData(prev => ({ ...prev, slug }));
    }
  };
  
  // List of common colors
  const colorOptions = [
    { label: 'Blue', value: '#3b82f6' },
    { label: 'Red', value: '#ef4444' },
    { label: 'Green', value: '#10b981' },
    { label: 'Yellow', value: '#f59e0b' },
    { label: 'Purple', value: '#8b5cf6' },
    { label: 'Pink', value: '#ec4899' },
    { label: 'Indigo', value: '#6366f1' },
    { label: 'Teal', value: '#14b8a6' },
    { label: 'Orange', value: '#f97316' },
    { label: 'Gray', value: '#6b7280' }
  ];
  
  // List of icon options
  const iconOptions = [
    'folder',
    'message-circle',
    'users',
    'star',
    'help-circle',
    'code',
    'book',
    'coffee',
    'heart',
    'music'
  ];
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {tr('categoryName')} *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleNameChange}
            className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
            required
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>
        
        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {tr('categorySlug')} *
          </label>
          <input
            type="text"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
            required
            pattern="[a-z0-9-]+"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {tr('slugFormat')}
          </p>
          {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
        </div>
        
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {tr('categoryDescription')}
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
            rows={3}
          />
        </div>
        
        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {tr('categoryColor')}
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="w-10 h-10 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
            />
            <select
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
            >
              {colorOptions.map(color => (
                <option key={color.value} value={color.value}>
                  {color.label}
                </option>
              ))}
              <option value={formData.color}>
                Custom: {formData.color}
              </option>
            </select>
          </div>
        </div>
        
        {/* Icon */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {tr('categoryIcon')}
          </label>
          <select
            name="icon"
            value={formData.icon}
            onChange={handleChange}
            className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
          >
            {iconOptions.map(icon => (
              <option key={icon} value={icon}>
                {icon.charAt(0).toUpperCase() + icon.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          disabled={isSubmitting}
        >
          {tc('cancel')}
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          disabled={isSubmitting}
        >
          {isSubmitting ? tc('loading') : initialData ? tc('save') : tc('create')}
        </button>
      </div>
    </form>
  );
}
