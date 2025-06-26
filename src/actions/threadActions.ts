'use server';

import connectToDatabase from '@/lib/db';
import Thread from '@/models/Thread';
import Post from '@/models/Post';
import Category from '@/models/Category';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';
import { hasExcessiveImages, markdownToHtml } from '@/lib/contentUtils';

// Define types for better type safety
type ThreadWithDetails = {
  id: string;
  title: string;
  // Making content optional since it's stored in the first post now
  content?: string; 
  author: any;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  category: any;
  createdAt: Date;
  updatedAt: Date;
};

type PostWithDetails = {
  id: string;
  content: string;
  author: any;
  likes: any[];
  likeCount: number;
  userHasLiked: boolean;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
};

type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function getThread(
  threadId: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  thread: ThreadWithDetails | null;
  posts: PostWithDetails[];
  pagination: PaginationInfo;
}> {
  try {
    await connectToDatabase();
    
    // Get the current user session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    let updateOperation = {};
    
    // Only increment view if the user is logged in and hasn't viewed this thread before
    if (userId) {
      // Check if the user has already viewed this thread using $elemMatch to find exact match
      const alreadyViewed = await Thread.findOne({
        _id: threadId,
        viewedBy: userId
      });
      
      if (!alreadyViewed) {
        // User hasn't viewed the thread yet, increment count and add to viewedBy
        updateOperation = {
          $inc: { views: 1 },
          $addToSet: { viewedBy: userId }
        };
      }
    } else {
      // We won't increment views for anonymous users to prevent count abuse
      updateOperation = { $set: {} };
    }
    
    // Find the thread and update view count if needed
    const thread = await Thread.findByIdAndUpdate(
      threadId,
      Object.keys(updateOperation).length > 0 ? updateOperation : { $set: {} }, // Use empty $set if no update needed
      { new: true }
    )
      .populate('author', 'name image')
      .populate('category')
      .lean() as any; // Use 'as any' to bypass TypeScript's limitations with Mongoose's lean() return type
    
    if (!thread) {
      return {
        thread: null,
        posts: [],
        pagination: { page, limit, total: 0, totalPages: 0 }
      };
    }

    const skip = (page - 1) * limit;
    const total = await Post.countDocuments({ thread: threadId });
    const totalPages = Math.ceil(total / limit);
    
    // Get posts for this thread with pagination
    const posts = await Post.find({ thread: threadId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name image role')
      .lean();
    
    // Format posts and handle potential null/undefined posts
    const formattedPosts = Array.isArray(posts) ? posts.map((post: any) => ({
      id: post._id.toString(),
      content: post.content,     // HTML content for rendering
      rawContent: post.rawContent || post.content, // Original markdown if available
      author: post.author,
      likes: post.likes || [],
      likeCount: (post.likes || []).length,
      userHasLiked: userId ? (post.likes || []).some((id: any) => id.toString() === userId.toString()) : false,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isEdited: post.isEdited || false
    })) : [];
    
    return {
      thread: thread ? {
        id: thread._id.toString(),
        title: thread.title,
        // No longer including content from thread model
        author: thread.author,
        views: thread.views,
        isPinned: thread.isPinned,
        isLocked: thread.isLocked,
        category: thread.category,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt
      } : null,
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  } catch (error) {
    console.error('Failed to fetch thread:', error);
    return {
      thread: null,
      posts: [],
      pagination: { page, limit, total: 0, totalPages: 0 }
    };
  }
}

export async function createReply(
  threadId: string,
  content: string
) {
  try {
    await connectToDatabase();
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return {
        success: false,
        message: 'You must be logged in to reply',
        post: null
      };
    }
    
    // Check if user is banned or muted
    const permissionCheck = await checkUserPostPermission();
    if (!permissionCheck.canPost) {
      return {
        success: false,
        message: permissionCheck.message,
        post: null
      };
    }
    
    // Check if content has more than one image
    if (hasExcessiveImages(content, 1)) {
      return {
        success: false,
        message: 'Posts can only include a maximum of 1 image', // Will be shown in the user's locale in the UI
        post: null
      };
    }

    // Check if thread exists and is not locked
    const thread = await Thread.findById(threadId);
    if (!thread) {
      return {
        success: false, 
        message: 'Thread not found',
        post: null
      };
    }
    
    if (thread.isLocked) {
      return {
        success: false,
        message: 'This thread is locked',
        post: null
      };
    }
    
    // Convert Markdown to HTML for storage
    const htmlContent = markdownToHtml(content);
    
    // Create new post
    const post = await Post.create({
      content: htmlContent,    // Store as HTML
      rawContent: content,     // Store original markdown
      author: session.user.id,
      thread: threadId
    });
    
    // Update thread's lastPostAt
    await Thread.findByIdAndUpdate(threadId, {
      lastPostAt: new Date()
    });
    
    // Get post with author details
    const populatedPost = await Post.findById(post._id)
      .populate('author', 'name image role')
      .lean() as any; // Use 'as any' to bypass TypeScript's limitations with Mongoose's lean() return type
    
    // Make sure to update the correct path with the proper category value
    revalidatePath(`/forum/${thread.category}/thread/${threadId}`);
    
    // Add safety check for populatedPost
    if (!populatedPost) {
      return {
        success: true,
        message: 'Reply added successfully but could not fetch details',
        post: null
      };
    }
    
    return {
      success: true,
      message: 'Reply added successfully',
      post: {
        id: populatedPost._id.toString(),
        content: populatedPost.content,
        author: populatedPost.author,
        likes: [],
        createdAt: populatedPost.createdAt,
        updatedAt: populatedPost.updatedAt,
        isEdited: false
      }
    };
  } catch (error) {
    console.error('Failed to create reply:', error);
    return {
      success: false,
      message: 'Failed to create reply',
      post: null
    };
  }
}

export async function createThread(
  categoryIdOrSlug: string,
  title: string,
  content: string
) {
  try {
    await connectToDatabase();
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return {
        success: false,
        message: 'You must be logged in to create a thread',
        threadId: null
      };
    }
    
    // Check if user is banned or muted
    const permissionCheck = await checkUserPostPermission();
    if (!permissionCheck.canPost) {
      return {
        success: false,
        message: permissionCheck.message,
        threadId: null
      };
    }
    
    // Check if content has more than one image
    if (hasExcessiveImages(content, 1)) {
      return {
        success: false,
        message: 'Thread content can only include a maximum of 1 image', // Will be shown in the user's locale in the UI
        threadId: null
      };
    }
    
    // Check if the input is a slug or an ID
    let category;
    
    // Try to find by slug first (most common case for user-facing URLs)
    category = await Category.findOne({ slug: categoryIdOrSlug }).lean();
    
    // If not found by slug, try to find by ID (fallback)
    if (!category && mongoose.Types.ObjectId.isValid(categoryIdOrSlug)) {
      category = await Category.findById(categoryIdOrSlug).lean();
    }
    
    if (!category) {
      return {
        success: false,
        message: 'Category not found',
        threadId: null
      };
    }
    
    // Get the actual category ID from the found category
    const categoryId = (category as any)._id;
    
    // Create new thread with minimal content
    const thread = await Thread.create({
      title,
      content: '', // No longer duplicate content here
      author: session.user.id,
      category: categoryId
    });
    
    // Convert Markdown to HTML for storage
    const htmlContent = markdownToHtml(content);
    
    // Create initial post (this will be the only instance of the content)
    await Post.create({
      content: htmlContent,    // Store as HTML
      rawContent: content,     // Store original markdown
      author: session.user.id,
      thread: thread._id
    });
    
    revalidatePath(`/forum/${categoryIdOrSlug}`);
    
    return {
      success: true,
      message: 'Thread created successfully',
      threadId: thread._id.toString()
    };
  } catch (error) {
    console.error('Failed to create thread:', error);
    return {
      success: false,
      message: 'Failed to create thread',
      threadId: null
    };
  }
}

// Helper function to check if user can post (not banned or muted)
async function checkUserPostPermission() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return {
      canPost: false,
      message: 'Not authenticated'
    };
  }
  
  // Check if user is banned
  if (session.user.isBanned) {
    return {
      canPost: false,
      message: session.user.banReason 
        ? `You are banned: ${session.user.banReason}` 
        : 'Your account is currently banned'
    };
  }
  
  // Check if user is muted
  if (session.user.isMuted) {
    const mutedUntil = session.user.mutedUntil 
      ? new Date(session.user.mutedUntil).toLocaleString()
      : undefined;
    
    return {
      canPost: false,
      message: mutedUntil
        ? `You are muted until ${mutedUntil}`
        : 'You are currently muted'
    };
  }
  
  return {
    canPost: true,
    message: 'Allowed'
  };
}
