import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import CategoryManagement from '@/components/admin/CategoryManagement';
import connectToDatabase from '@/lib/db';
import Category from '@/models/Category';
// Import locale translations directly
import enTranslations from '@/i18n/locales/en.json';
import deTranslations from '@/i18n/locales/de.json';

// Helper function to get translation
const getTranslation = (
  locale: string,
  key: string,
  section: 'admin' | 'common' | 'forum' = 'admin'
) => {
  const translations = locale === 'de' ? deTranslations : enTranslations;
  return (translations as any)[section][key] || key;
};

export default async function CategoriesPage({ params }: { params: { locale: string } }) {
  // Use the params object properly with await for Next.js 15+
  const { locale } = await Promise.resolve(params);
  const session = await getServerSession(authOptions);
  
  // Check if user is admin (only admins can manage categories)
  if (!session?.user || session.user.role !== 'admin') {
    redirect(`/${locale}/forum`);
  }
  
  // Get all categories
  await connectToDatabase();
  const categories = await Category.find().sort({ order: 1 }).lean();
  
  // Format categories for the component
  const formattedCategories = categories.map((cat: any) => ({
    id: cat._id.toString(),
    name: cat.name,
    description: cat.description,
    slug: cat.slug,
    color: cat.color || '#3b82f6',
    icon: cat.icon || 'folder',
    order: cat.order || 0,
    threadCount: cat.threadCount || 0
  }));
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{getTranslation(locale, 'categoryManagement')}</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {getTranslation(locale, 'create_category')}, 
            {getTranslation(locale, 'edit_category')}, 
            {getTranslation(locale, 'delete_category')}
          </p>
        </div>
        
      </div>
      
      <CategoryManagement 
        initialCategories={formattedCategories} 
        locale={locale}
      />
    </div>
  );
}
