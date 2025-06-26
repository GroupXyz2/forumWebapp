'use server';

import connectToDatabase from '@/lib/db';
import Thread from '@/models/Thread';
import Post from '@/models/Post';
import Category from '@/models/Category';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

// Define types for better type safety
type ThreadWithDetails = {
  id: string;
  title: string;
  content: string;
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
    
    // Find the thread and increment view count
    const thread = await Thread.findByIdAndUpdate(
      threadId,
      { $inc: { views: 1 } },
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
      content: post.content,
      author: post.author,
      likes: post.likes || [],
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isEdited: post.isEdited || false
    })) : [];
    
    return {
      thread: thread ? {
        id: thread._id.toString(),
        title: thread.title,
        content: thread.content,
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
    
    // Create new post
    const post = await Post.create({
      content,
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
  categoryId: string,
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
    
    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return {
        success: false,
        message: 'Category not found',
        threadId: null
      };
    }
    
    // Create new thread
    const thread = await Thread.create({
      title,
      content,
      author: session.user.id,
      category: categoryId
    });
    
    // Create initial post (same content as thread)
    await Post.create({
      content,
      author: session.user.id,
      thread: thread._id
    });
    
    revalidatePath(`/forum/${categoryId}`);
    
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
