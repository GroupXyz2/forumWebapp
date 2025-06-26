import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Thread from '@/models/Thread';
import Post from '@/models/Post';
import Category from '@/models/Category';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    
    // Only allow authenticated users to access this API
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Await params before using
    const awaitedParams = await params;
    const userId = awaitedParams.userId;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    
    // Get counts
    const threadCount = await Thread.countDocuments({ author: userId });
    const postCount = await Post.countDocuments({ author: userId });
    
    // Find most recent thread or post
    const latestThread = await Thread.findOne({ author: userId })
      .sort({ createdAt: -1 })
      .lean() as { createdAt?: Date } | null;
      
    const latestPost = await Post.findOne({ author: userId })
      .sort({ createdAt: -1 })
      .lean() as { createdAt?: Date } | null;
    
    // Determine last active date
    let lastActiveAt = null;
    if (latestThread && latestPost) {
      lastActiveAt = new Date(Math.max(
        new Date(latestThread.createdAt as Date).getTime(),
        new Date(latestPost.createdAt as Date).getTime()
      ));
    } else if (latestThread) {
      lastActiveAt = latestThread.createdAt as Date;
    } else if (latestPost) {
      lastActiveAt = latestPost.createdAt as Date;
    }
    
    // Get recent activity (threads and posts)
    const recentThreads = await Thread.find({ author: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('category', 'name slug')
      .lean();
    
    const recentPosts = await Post.find({ author: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'thread',
        select: 'title category',
        populate: {
          path: 'category',
          select: 'name slug'
        }
      })
      .lean();
    
    // Format recent activity
    const threadActivity = recentThreads.map(thread => ({
      type: 'thread' as const,
      title: thread.title as string,
      threadId: (thread._id as mongoose.Types.ObjectId).toString(),
      categoryId: (thread.category as any)._id.toString(),
      createdAt: thread.createdAt as Date
    }));
    
    const postActivity = recentPosts.map(post => ({
      type: 'post' as const,
      title: (post.thread as any).title as string,
      threadId: (post.thread as any)._id.toString(),
      categoryId: (post.thread as any).category._id.toString(),
      createdAt: post.createdAt as Date
    }));
    
    // Combine and sort by date (newest first)
    const recentActivity = [...threadActivity, ...postActivity]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5); // Take only the 5 most recent activities
    
    return NextResponse.json({
      threadCount,
      postCount,
      lastActiveAt,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' }, 
      { status: 500 }
    );
  }
}
