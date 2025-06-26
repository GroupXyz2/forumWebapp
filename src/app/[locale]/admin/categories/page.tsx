import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import CategoryManagement from '@/components/admin/CategoryManagement';
import connectToDatabase from '@/lib/db';
import Category from '@/models/Category';

export default async function CategoriesPage({ params }: { params: { locale: string } }) {
  const session = await getServerSession(authOptions);
  const t = await getTranslations('Admin');
  const locale = params.locale;
  
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
          <h1 className="text-2xl font-bold">{t('categoryManagement')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t('create_category')}, {t('edit_category')}, {t('delete_category')}</p>
        </div>
        
      </div>
      
      <CategoryManagement 
        initialCategories={formattedCategories} 
        locale={locale}
      />
    </div>
  );
}
