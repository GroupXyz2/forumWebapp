'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/db';
import Post from '@/models/Post';

/**
 * Toggle like on a post
 * @param postId The ID of the post to toggle like for
 * @returns Object with success status and like count
 */
export async function toggleLikePost(postId: string) {
  try {
    await connectToDatabase();
    
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { 
        success: false,
        message: 'You must be logged in to like posts',
        liked: false,
        likeCount: 0
      };
    }
    
    const userId = session.user.id;
    
    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return {
        success: false,
        message: 'Post not found',
        liked: false,
        likeCount: 0
      };
    }
    
    // Check if user already liked the post
    const alreadyLiked = post.likes.includes(userId);
    
    // Toggle like
    if (alreadyLiked) {
      // Unlike: remove userId from likes array
      post.likes = post.likes.filter(
        (id: any) => id.toString() !== userId.toString()
      );
    } else {
      // Like: add userId to likes array
      post.likes.push(userId);
    }
    
    // Save the updated post
    await post.save();
    
    // Get the thread and category to revalidate the path
    const thread = await (await import('@/models/Thread')).default.findById(post.thread);
    if (!thread) {
      return {
        success: false,
        message: 'Thread not found',
        liked: !alreadyLiked,
        likeCount: post.likes.length
      };
    }
    
    // Get the category ID
    const categoryId = thread.category.toString();
    
    // Revalidate the page
    revalidatePath(`/forum/${categoryId}/thread/${thread._id}`);
    
    return {
      success: true,
      liked: !alreadyLiked,
      likeCount: post.likes.length
    };
  } catch (error) {
    console.error('Error toggling like:', error);
    return {
      success: false,
      message: 'Failed to toggle like',
      liked: false,
      likeCount: 0
    };
  }
}

/**
 * Check if user has liked a post
 * @param postId The ID of the post to check
 * @returns Object indicating whether user has liked the post and the like count
 */
export async function hasUserLikedPost(postId: string) {
  try {
    await connectToDatabase();
    
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { 
        liked: false,
        likeCount: 0
      };
    }
    
    const userId = session.user.id;
    
    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return {
        liked: false,
        likeCount: 0
      };
    }
    
    // Check if user has liked the post
    const hasLiked = post.likes.some(
      (id: any) => id.toString() === userId.toString()
    );
    
    return {
      liked: hasLiked,
      likeCount: post.likes.length
    };
  } catch (error) {
    console.error('Error checking like status:', error);
    return {
      liked: false,
      likeCount: 0
    };
  }
}
