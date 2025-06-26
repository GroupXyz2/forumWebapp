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

interface SimpleCategoryManagementProps {
  initialCategories: Category[];
  locale: string;
}

export default function SimpleCategoryManagement({ initialCategories, locale }: SimpleCategoryManagementProps) {
  const [categories] = useState<Category[]>(initialCategories);
  
  return (
    <div className="border p-4 rounded-lg">
      <div className="text-xl font-bold">Simple Category Management</div>
      <p>Using locale: {locale}</p>
      <ul className="mt-4">
        {categories.map(cat => (
          <li key={cat.id} className="mb-2 p-2 border-b">
            <strong>{cat.name}</strong> - {cat.description}
          </li>
        ))}
      </ul>
    </div>
  );
}
