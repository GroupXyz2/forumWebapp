import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Thread from '@/models/Thread';
import Post from '@/models/Post';
import AuditLog from '@/models/AuditLog';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
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
      .populate('category', 'name slug')
      .select('title slug createdAt')
      .lean();
      
    // Get recent audit logs (last 3)
    const recentAuditLogs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('performedBy', 'name image')
      .lean();
    
    return NextResponse.json({ 
      recentUsers, 
      recentThreads,
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
