'use server';

import connectToDatabase from '@/lib/db';
import Category, { ICategory } from '@/models/Category';
import Thread, { IThread } from '@/models/Thread';
import Post, { IPost } from '@/models/Post';
import User, { IUser } from '@/models/User';
import mongoose from 'mongoose';

// Define types for better type safety
type CategoryWithDetails = {
  id: string;
  name: { en: string; de: string };
  description: { en: string; de: string };
  slug: string;
  threadCount: number;
  postCount: number;
  latestPost: {
    title: { en: string; de: string };
    author: string;
    date: Date;
    threadId: string;
  } | null;
};

type ThreadWithDetails = {
  id: string;
  title: string;
  content: string;
  author: any;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: Date;
  postCount: number;
  latestPost: {
    author: any;
    date: Date;
  } | null;
};

type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function getCategories(): Promise<{ categories: CategoryWithDetails[]; error?: string }> {
  try {
    await connectToDatabase();
    
    // Verify we can query the database
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
      console.log('MongoDB connection verified');
    } else {
      console.log('MongoDB connection not yet established, continuing with query');
    }
    
    const categories = await Category.find().sort({ order: 1 }).lean();
    console.log(`Found ${categories.length} categories`);
    
    if (!categories || categories.length === 0) {
      // Try to create initial categories if none exist
      await createInitialCategories();
      console.log('Attempted to create initial categories');
      
      // Try fetching again
      const retryCategories = await Category.find().sort({ order: 1 }).lean();
      if (!retryCategories || retryCategories.length === 0) {
        console.warn('No categories found even after initialization');
        return { 
          categories: [], 
          error: 'No forum categories found. Please contact an administrator.' 
        };
      }
    }
    
    // For each category, get thread and post count
    const categoriesWithData = await Promise.all(
      (categories as any[]).map(async (category) => {
        const threadCount = await Thread.countDocuments({ 
          category: category._id 
        });
        
        const threads = await Thread.find({ category: category._id }).select('_id');
        const threadIds = threads.map(thread => thread._id);
        const postCount = await Post.countDocuments({ 
          thread: { $in: threadIds } 
        });
        
        // Get the latest post in this category
        const latestThreadData = await Thread.findOne({ 
          category: category._id 
        })
          .sort({ lastPostAt: -1 })
          .populate('author', 'name')
          .lean();
        
        let latestPost = null;
        if (latestThreadData) {
          const typedThread = latestThreadData as any;
          latestPost = {
            title: {
              en: typedThread.title,
              de: typedThread.title, // We use the same title for both languages in this implementation
            },
            author: typedThread.author.name,
            date: typedThread.lastPostAt,
            threadId: typedThread._id.toString()
          };
        }
        
        return {
          id: category._id.toString(),
          name: category.name,
          description: category.description,
          slug: category.slug,
          threadCount,
          postCount,
          latestPost
        };
      })
    );
    
    return { categories: categoriesWithData };
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return { 
      categories: [], 
      error: 'Failed to connect to the forum database. Please try again later.' 
    };
  }
}

export async function getCategoryThreads(
  categoryIdOrSlug: string, 
  page: number = 1, 
  limit: number = 10
): Promise<{
  threads: ThreadWithDetails[];
  category: any | null;
  pagination: PaginationInfo;
}> {
  try {
    await connectToDatabase();
    
    // Check if the input is a slug or an ID
    let category;
    
    // Try to find by slug first (most common case for user-facing URLs)
    category = await Category.findOne({ slug: categoryIdOrSlug }).lean();
    
    // If not found by slug, try to find by ID (fallback)
    if (!category && mongoose.Types.ObjectId.isValid(categoryIdOrSlug)) {
      category = await Category.findById(categoryIdOrSlug).lean();
    }
    
    if (!category) {
      console.log(`Category not found with slug or ID: ${categoryIdOrSlug}`);
      return { 
        threads: [], 
        category: null, 
        pagination: { page, limit, total: 0, totalPages: 0 } 
      };
    }
    
    // Use type assertion to help TypeScript understand Mongoose's lean() return type
    const categoryId = (category as any)._id;
    
    const skip = (page - 1) * limit;
    const total = await Thread.countDocuments({ category: categoryId });
    const totalPages = Math.ceil(total / limit);
    
    // Get threads for this category, sorted by pinned first, then last activity
    const threads = await Thread.find({ category: categoryId })
      .sort({ isPinned: -1, lastPostAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name image')
      .lean();
    
    // For each thread, get the post count and last post info
    const threadsWithData = await Promise.all(
      (threads as any[]).map(async (thread) => {
        const postCount = await Post.countDocuments({ 
          thread: thread._id 
        });
        
        // Get the latest post in this thread
        const latestPost = await Post.findOne({ 
          thread: thread._id 
        })
          .sort({ createdAt: -1 })
          .populate('author', 'name image')
          .lean();
        
        return {
          id: (thread._id as mongoose.Types.ObjectId).toString(),
          title: thread.title,
          // Thread content is now stored in the first post
          content: '',
          author: thread.author,
          views: thread.views,
          isPinned: thread.isPinned,
          isLocked: thread.isLocked,
          createdAt: thread.createdAt,
          postCount,
          latestPost: latestPost ? {
            author: (latestPost as any).author,
            date: (latestPost as any).createdAt
          } : null
        };
      })
    );
    
    return {
      threads: threadsWithData,
      category,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  } catch (error) {
    console.error('Failed to fetch category threads:', error);
    return { 
      threads: [], 
      category: null, 
      pagination: { page: 1, limit, total: 0, totalPages: 0 } 
    };
  }
}

export async function createInitialCategories() {
  try {
    await connectToDatabase();
    
    // Check if categories already exist
    const count = await Category.countDocuments();
    if (count > 0) {
      return { success: true, message: 'Categories already exist' };
    }
    
    // Create initial categories
    await Category.create([
      {
        name: {
          en: 'General Discussion',
          de: 'Allgemeine Diskussion'
        },
        description: {
          en: 'Discuss any topic related to our community',
          de: 'Diskutiere alle Themen im Zusammenhang mit unserer Community'
        },
        slug: 'general',
        order: 1
      },
      {
        name: {
          en: 'Technology',
          de: 'Technologie'
        },
        description: {
          en: 'Discussions about technology, programming and software',
          de: 'Diskussionen über Technologie, Programmierung und Software'
        },
        slug: 'technology',
        order: 2
      },
      {
        name: {
          en: 'Gaming',
          de: 'Gaming'
        },
        description: {
          en: 'Talk about your favorite games and gaming experiences',
          de: 'Sprich über deine Lieblingsspiele und Gaming-Erlebnisse'
        },
        slug: 'gaming',
        order: 3
      }
    ]);
    
    return { success: true, message: 'Initial categories created' };
  } catch (error) {
    console.error('Failed to create initial categories:', error);
    return { success: false, message: 'Failed to create initial categories' };
  }
}
