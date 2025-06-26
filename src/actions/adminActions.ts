'use server';

import connectToDatabase from '@/lib/db';
import Thread from '@/models/Thread';
import Post from '@/models/Post';
import User from '@/models/User';
import Category from '@/models/Category';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';
import { createAuditLog } from './auditActions';

// Helper function to check if user is admin or moderator
async function checkModeratorPermissions() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return {
      success: false,
      message: 'Not authenticated',
      isAuthorized: false
    };
  }
  
  if (session.user.role !== 'admin' && session.user.role !== 'moderator') {
    return {
      success: false,
      message: 'Not authorized. Only moderators and admins can perform this action',
      isAuthorized: false
    };
  }
  
  return {
    success: true,
    message: 'Authorized',
    isAuthorized: true,
    user: session.user
  };
}

export async function pinThread(threadId: string, isPinned: boolean) {
  try {
    await connectToDatabase();
    
    const auth = await checkModeratorPermissions();
    if (!auth.isAuthorized) {
      return auth;
    }
    
    const thread = await Thread.findById(threadId);
    
    if (!thread) {
      return {
        success: false,
        message: 'Thread not found'
      };
    }
    
    // Update thread with new pin status
    thread.isPinned = isPinned;
    await thread.save();
    
    // Revalidate both the category page and the thread page
    revalidatePath(`/forum/${thread.category}`);
    revalidatePath(`/forum/${thread.category}/thread/${threadId}`);
    
    // Create audit log
    await createAuditLog(
      isPinned ? 'thread_pinned' : 'thread_unpinned',
      'thread',
      threadId,
      {
        categoryId: thread.category.toString(),
        isPinned
      }
    );
    
    return {
      success: true,
      message: isPinned 
        ? 'Thread has been pinned successfully' 
        : 'Thread has been unpinned successfully'
    };
  } catch (error) {
    console.error('Pin thread error:', error);
    return {
      success: false,
      message: 'Failed to update thread pin status'
    };
  }
}

export async function lockThread(threadId: string, isLocked: boolean) {
  try {
    await connectToDatabase();
    
    const auth = await checkModeratorPermissions();
    if (!auth.isAuthorized) {
      return auth;
    }
    
    const thread = await Thread.findById(threadId);
    
    if (!thread) {
      return {
        success: false,
        message: 'Thread not found'
      };
    }
    
    // Update thread with new lock status
    thread.isLocked = isLocked;
    await thread.save();
    
    // Revalidate both the category page and the thread page
    revalidatePath(`/forum/${thread.category}`);
    revalidatePath(`/forum/${thread.category}/thread/${threadId}`);
    
    // Create audit log
    await createAuditLog(
      isLocked ? 'thread_locked' : 'thread_unlocked',
      'thread',
      threadId,
      { isLocked },
      { categoryId: thread.category.toString() }
    );
    
    return {
      success: true,
      message: isLocked 
        ? 'Thread has been locked successfully' 
        : 'Thread has been unlocked successfully'
    };
  } catch (error) {
    console.error('Lock thread error:', error);
    return {
      success: false,
      message: 'Failed to update thread lock status'
    };
  }
}

export async function deleteThread(threadId: string) {
  try {
    await connectToDatabase();
    
    const auth = await checkModeratorPermissions();
    if (!auth.isAuthorized) {
      return auth;
    }
    
    const thread = await Thread.findById(threadId);
    
    if (!thread) {
      return {
        success: false,
        message: 'Thread not found'
      };
    }
    
    const categoryId = thread.category;
    
    // Delete all posts associated with this thread first
    await Post.deleteMany({ thread: threadId });
    
    // Then delete the thread
    await Thread.deleteOne({ _id: threadId });
    
    // Revalidate the category page
    revalidatePath(`/forum/${categoryId}`);
    
    // Create audit log
    await createAuditLog(
      'thread_deleted',
      'thread',
      threadId,
      { deleted: true },
      { categoryId: categoryId.toString() }
    );
    
    return {
      success: true,
      message: 'Thread and all associated posts have been deleted successfully'
    };
  } catch (error) {
    console.error('Delete thread error:', error);
    return {
      success: false,
      message: 'Failed to delete thread'
    };
  }
}

export async function deletePost(postId: string) {
  try {
    await connectToDatabase();
    
    const auth = await checkModeratorPermissions();
    if (!auth.isAuthorized) {
      return auth;
    }
    
    const post = await Post.findById(postId).populate('thread');
    
    if (!post) {
      return {
        success: false,
        message: 'Post not found'
      };
    }
    
    // We can't delete the first post in a thread as it's the thread content
    // Check if this is the first post
    const firstPost = await Post.findOne({ thread: post.thread }).sort({ createdAt: 1 }).lean();
    
    // Type assertion to handle Mongoose lean() return type
    const firstPostId = firstPost ? (firstPost as any)._id.toString() : null;
    
    if (firstPost && firstPostId === postId) {
      return {
        success: false,
        message: 'Cannot delete the first post in a thread. Delete the entire thread instead.'
      };
    }
    
    // Delete the post
    await Post.deleteOne({ _id: postId });
    
    // Revalidate the thread page
    const threadData = post.thread as any;
    const categoryId = threadData.category;
    const threadId = threadData._id;
    
    revalidatePath(`/forum/${categoryId}/thread/${threadId}`);
    
    // Create audit log
    await createAuditLog(
      'post_deleted',
      'post',
      postId,
      { deleted: true },
      { threadId, categoryId }
    );
    
    return {
      success: true,
      message: 'Post has been deleted successfully'
    };
  } catch (error) {
    console.error('Delete post error:', error);
    return {
      success: false,
      message: 'Failed to delete post'
    };
  }
}

export async function getAllThreads(
  page: number = 1,
  limit: number = 20,
  filter: string = 'all' // 'all', 'pinned', 'locked', 'reported'
) {
  try {
    await connectToDatabase();
    
    const auth = await checkModeratorPermissions();
    if (!auth.isAuthorized) {
      return {
        success: false,
        message: 'Not authorized',
        threads: [],
        pagination: { page, limit, total: 0, totalPages: 0 }
      };
    }
    
    // Build query based on filter
    let query: any = {};
    if (filter === 'pinned') {
      query.isPinned = true;
    } else if (filter === 'locked') {
      query.isLocked = true;
    }
    
    const skip = (page - 1) * limit;
    const total = await Thread.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    const threads = await Thread.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name image')
      .populate('category', 'name slug')
      .lean();
    
    // Format the threads for the admin panel
    const formattedThreads = threads.map((thread: any) => ({
      id: thread._id.toString(),
      title: thread.title,
      content: '', // Thread content is now stored in the first post
      author: {
        id: thread.author._id.toString(),
        name: thread.author.name,
        image: thread.author.image
      },
      category: {
        id: thread.category._id.toString(),
        name: thread.category.name,
        slug: thread.category.slug
      },
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      isPinned: thread.isPinned,
      isLocked: thread.isLocked,
      views: thread.views
    }));
    
    return {
      success: true,
      threads: formattedThreads,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  } catch (error) {
    console.error('Get all threads error:', error);
    return {
      success: false,
      message: 'Failed to retrieve threads',
      threads: [],
      pagination: { page, limit, total: 0, totalPages: 0 }
    };
  }
}

// User Management Actions

export async function getAllUsers(
  page: number = 1,
  limit: number = 20,
  filter: string = 'all' // 'all', 'banned', 'muted', 'warned', 'admin', 'moderator', 'user'
) {
  try {
    await connectToDatabase();
    
    const auth = await checkModeratorPermissions();
    if (!auth.isAuthorized) {
      return {
        success: false,
        message: 'Not authorized',
        users: [],
        pagination: { page, limit, total: 0, totalPages: 0 }
      };
    }
    
    // Build query based on filter
    let query: any = {};
    if (filter === 'banned') {
      query.isBanned = true;
    } else if (filter === 'muted') {
      query.isMuted = true;
    } else if (filter === 'warned') {
      query.warningCount = { $gt: 0 };
    } else if (['admin', 'moderator', 'user'].includes(filter)) {
      query.role = filter;
    }
    
    const skip = (page - 1) * limit;
    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Format the users for the admin panel and secure sensitive information
    const formattedUsers = (users as any[]).map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      isBanned: user.isBanned || false,
      bannedUntil: user.bannedUntil || null,
      banReason: user.banReason || '',
      isMuted: user.isMuted || false,
      mutedUntil: user.mutedUntil || null,
      warningCount: user.warningCount || 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    
    return {
      success: true,
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  } catch (error) {
    console.error('Get all users error:', error);
    return {
      success: false,
      message: 'Failed to retrieve users',
      users: [],
      pagination: { page, limit, total: 0, totalPages: 0 }
    };
  }
}

export async function getUserById(userId: string) {
  try {
    await connectToDatabase();
    
    const auth = await checkModeratorPermissions();
    if (!auth.isAuthorized) {
      return {
        success: false,
        message: 'Not authorized',
        user: null
      };
    }
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return {
        success: false,
        message: 'Invalid user ID format',
        user: null
      };
    }
    
    const user = await User.findById(userId).lean() as any;
    
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        user: null
      };
    }
    
    // Format and secure user data
    const formattedUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      isBanned: user.isBanned || false,
      bannedUntil: user.bannedUntil || null,
      banReason: user.banReason || '',
      isMuted: user.isMuted || false,
      mutedUntil: user.mutedUntil || null,
      warningCount: user.warningCount || 0,
      warnings: user.warnings || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    
    return {
      success: true,
      user: formattedUser
    };
  } catch (error) {
    console.error('Get user by ID error:', error);
    return {
      success: false,
      message: 'Failed to retrieve user',
      user: null
    };
  }
}

export async function banUser(userId: string, reason: string, duration?: number) {
  try {
    await connectToDatabase();
    
    const auth = await checkModeratorPermissions();
    if (!auth.isAuthorized) {
      return auth;
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    // Don't allow banning admins
    if (user.role === 'admin') {
      return {
        success: false,
        message: 'Cannot ban administrators'
      };
    }
    
    // Don't allow moderators to ban other moderators (only admins can)
    if (user.role === 'moderator' && auth.user?.role !== 'admin') {
      return {
        success: false,
        message: 'Only administrators can ban moderators'
      };
    }
    
    // Set ban details
    const bannedUntil = duration ? new Date(Date.now() + duration * 1000) : null; // duration in seconds
    
    user.isBanned = true;
    user.bannedUntil = bannedUntil;
    user.banReason = reason;
    
    await user.save();
    
    // Revalidate user-related paths
    revalidatePath(`/admin/users`);
    revalidatePath(`/admin/users/${userId}`);
    
    // Create audit log
    await createAuditLog(
      'user_banned',
      'user',
      userId,
      { reason },
      { duration, bannedUntil: bannedUntil ? bannedUntil.toISOString() : null }
    );
    
    return {
      success: true,
      message: bannedUntil 
        ? `User has been banned until ${bannedUntil.toLocaleString()}` 
        : 'User has been banned permanently'
    };
  } catch (error) {
    console.error('Ban user error:', error);
    return {
      success: false,
      message: 'Failed to ban user'
    };
  }
}

export async function unbanUser(userId: string) {
  try {
    await connectToDatabase();
    
    const auth = await checkModeratorPermissions();
    if (!auth.isAuthorized) {
      return auth;
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    if (!user.isBanned) {
      return {
        success: false,
        message: 'User is not currently banned'
      };
    }
    
    // Remove ban
    user.isBanned = false;
    user.bannedUntil = null;
    user.banReason = '';
    
    await user.save();
    
    // Revalidate user-related paths
    revalidatePath(`/admin/users`);
    revalidatePath(`/admin/users/${userId}`);
    
    // Create audit log
    await createAuditLog(
      'user_unbanned',
      'user',
      userId,
      { unbanned: true }
    );
    
    return {
      success: true,
      message: 'User has been unbanned successfully'
    };
  } catch (error) {
    console.error('Unban user error:', error);
    return {
      success: false,
      message: 'Failed to unban user'
    };
  }
}

export async function muteUser(userId: string, duration: number) {
  try {
    await connectToDatabase();
    
    const auth = await checkModeratorPermissions();
    if (!auth.isAuthorized) {
      return auth;
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    // Don't allow muting admins
    if (user.role === 'admin') {
      return {
        success: false,
        message: 'Cannot mute administrators'
      };
    }
    
    // Don't allow moderators to mute other moderators (only admins can)
    if (user.role === 'moderator' && auth.user?.role !== 'admin') {
      return {
        success: false,
        message: 'Only administrators can mute moderators'
      };
    }
    
    // Set mute details (duration is required for muting)
    const mutedUntil = new Date(Date.now() + duration * 1000); // duration in seconds
    
    user.isMuted = true;
    user.mutedUntil = mutedUntil;
    
    await user.save();
    
    // Revalidate user-related paths
    revalidatePath(`/admin/users`);
    revalidatePath(`/admin/users/${userId}`);
    
    // Create audit log
    await createAuditLog(
      'user_muted',
      'user',
      userId,
      { isMuted: true },
      { duration, mutedUntil: mutedUntil ? mutedUntil.toISOString() : null }
    );
    
    return {
      success: true,
      message: `User has been muted until ${mutedUntil.toLocaleString()}`
    };
  } catch (error) {
    console.error('Mute user error:', error);
    return {
      success: false,
      message: 'Failed to mute user'
    };
  }
}

export async function unmuteUser(userId: string) {
  try {
    await connectToDatabase();
    
    const auth = await checkModeratorPermissions();
    if (!auth.isAuthorized) {
      return auth;
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    if (!user.isMuted) {
      return {
        success: false,
        message: 'User is not currently muted'
      };
    }
    
    // Remove mute
    user.isMuted = false;
    user.mutedUntil = null;
    
    await user.save();
    
    // Revalidate user-related paths
    revalidatePath(`/admin/users`);
    revalidatePath(`/admin/users/${userId}`);
    
    // Create audit log
    await createAuditLog(
      'user_unmuted',
      'user',
      userId,
      { isMuted: false }
    );
    
    return {
      success: true,
      message: 'User has been unmuted successfully'
    };
  } catch (error) {
    console.error('Unmute user error:', error);
    return {
      success: false,
      message: 'Failed to unmute user'
    };
  }
}

export async function warnUser(userId: string, warning: string) {
  try {
    await connectToDatabase();
    
    const auth = await checkModeratorPermissions();
    if (!auth.isAuthorized) {
      return auth;
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    // Don't allow warning admins
    if (user.role === 'admin') {
      return {
        success: false,
        message: 'Cannot warn administrators'
      };
    }
    
    // Don't allow moderators to warn other moderators (only admins can)
    if (user.role === 'moderator' && auth.user?.role !== 'admin') {
      return {
        success: false,
        message: 'Only administrators can warn moderators'
      };
    }
    
    // Add warning
    const warningObject = {
      warning,
      date: new Date(),
      moderator: auth.user?.id || 'system'
    };
    
    // Initialize the warnings array if it doesn't exist
    if (!user.warnings) {
      user.warnings = [];
    }
    
    user.warnings.push(warningObject);
    user.warningCount = (user.warnings.length || 0) + 1;
    
    await user.save();
    
    // Revalidate user-related paths
    revalidatePath(`/admin/users`);
    revalidatePath(`/admin/users/${userId}`);
    
    // Create audit log
    await createAuditLog(
      'user_warned',
      'user',
      userId,
      { warning },
      { warningCount: user.warningCount }
    );
    
    return {
      success: true,
      message: 'Warning has been added to the user'
    };
  } catch (error) {
    console.error('Warn user error:', error);
    return {
      success: false,
      message: 'Failed to warn user'
    };
  }
}

export async function changeUserRole(userId: string, newRole: 'admin' | 'moderator' | 'user') {
  try {
    await connectToDatabase();
    
    const auth = await checkModeratorPermissions();
    if (!auth.isAuthorized || auth.user?.role !== 'admin') {
      return {
        success: false,
        message: 'Only administrators can change user roles'
      };
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    // Don't allow changing your own role (prevent removing yourself as admin)
    if (user._id.toString() === auth.user?.id) {
      return {
        success: false,
        message: 'You cannot change your own role'
      };
    }
    
    // Change role
    user.role = newRole;
    await user.save();
    
    // Revalidate user-related paths
    revalidatePath(`/admin/users`);
    revalidatePath(`/admin/users/${userId}`);
    
    // Create audit log
    await createAuditLog(
      'user_role_changed',
      'user',
      userId,
      { oldRole: user.role, newRole },
      { changedAt: new Date().toISOString() }
    );
    
    return {
      success: true,
      message: `User role has been changed to ${newRole} successfully`
    };
  } catch (error) {
    console.error('Change user role error:', error);
    return {
      success: false,
      message: 'Failed to change user role'
    };
  }
}

export async function getUserDetails(userId: string) {
  try {
    await connectToDatabase();
    
    const auth = await checkModeratorPermissions();
    if (!auth.isAuthorized) {
      return {
        success: false,
        message: 'Not authorized',
        user: null
      };
    }
    
    // Get user with populated warnings
    const user = await User.findById(userId)
      .populate('warnings.issuedBy', 'name image role')
      .lean();
    
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        user: null
      };
    }
    
    // Get user activity stats
    const threadCount = await Thread.countDocuments({ author: userId });
    const postCount = await Post.countDocuments({ author: userId });
    
    // Format the user for the admin panel, using type assertions to handle Mongoose lean() return type
    const userData = user as any;
    const formattedUser = {
      id: userData._id.toString(),
      name: userData.name,
      email: userData.email,
      image: userData.image,
      discordId: userData.discordId,
      role: userData.role,
      isBanned: userData.isBanned,
      banReason: userData.banReason,
      bannedUntil: userData.bannedUntil,
      isMuted: userData.isMuted,
      mutedUntil: userData.mutedUntil,
      warningCount: userData.warningCount || 0,
      warnings: userData.warnings || [],
      createdAt: userData.createdAt,
      stats: {
        threadCount,
        postCount
      }
    };
    
    return {
      success: true,
      user: formattedUser
    };
  } catch (error) {
    console.error('Get user details error:', error);
    return {
      success: false,
      message: 'Failed to retrieve user details',
      user: null
    };
  }
}
