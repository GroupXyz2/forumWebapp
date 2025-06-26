'use client';

import { useState } from 'react';

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

export default function MinimalCategoryManagement({ initialCategories, locale }: CategoryManagementProps) {
  const [categories] = useState<Category[]>(initialCategories);
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2>Categories ({locale})</h2>
      </div>
      
      {categories.length === 0 ? (
        <div className="p-8 text-center">
          No categories found
        </div>
      ) : (
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2">Threads</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <tr key={category.id}>
                <td className="px-4 py-2">{category.name}</td>
                <td className="px-4 py-2">{category.slug}</td>
                <td className="px-4 py-2">{category.threadCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
