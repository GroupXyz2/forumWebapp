import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User, Thread, Post, AuditLog, Category } from '@/lib/models'; // Import models from central file
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: Request,
  { params }: { params: { locale: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { locale = 'en' } = params;
    
    // Only allow authenticated admin/moderator users to access this API
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDatabase();
    
    // Get recent users (last 3)
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select('name image role createdAt')
      .lean();
      
    // Get recent threads (last 3)
    const recentThreads = await Thread.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('author', 'name image')
      .populate({
        path: 'category',
        select: 'name slug',
        model: Category
      })
      .select('title slug createdAt')
      .lean();
      
    // Get recent audit logs (last 3)
    const recentAuditLogs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('performedBy', 'name image')
      .lean();
    
    // Process multilingual fields to return locale-specific values
    const processedThreads = recentThreads.map((thread: any) => {
      if (thread.category && thread.category.name && typeof thread.category.name === 'object') {
        // Replace multilingual object with locale-specific string
        thread.category.name = thread.category.name[locale] || thread.category.name.en || thread.category.name.de || '';
      }
      return thread;
    });
    
    return NextResponse.json({ 
      recentUsers, 
      recentThreads: processedThreads,
      recentAuditLogs
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    );
  }
}
