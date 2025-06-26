'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Thread from '@/models/Thread';
import Post from '@/models/Post';
import { createAuditLog } from './auditActions';
import { redirect } from 'next/navigation';

/**
 * Delete a user account and all associated data
 * This is a permanent action and cannot be undone
 */
import BannedAccount from '@/models/BannedAccount';

export async function deleteUserAccount(currentPassword?: string) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.id) {
      throw new Error('Not authenticated');
    }
    
    await connectToDatabase();
    
    // Find the user
    const user = await User.findById(session.user.id);
    if (!user) {
      throw new Error('User not found');
    }
    
    // For OAuth accounts, we don't need to check the password
    // For password-based accounts, we would validate the password here
    // but since this app uses Discord OAuth, we can skip that step
    
    // Log the deletion
    await createAuditLog(
      'delete_account',
      'user',
      user._id.toString(),
      {
        username: user.name,
        email: user.email,
        deletedBy: 'self', // User deleted their own account
      }
    );
    
    // First, anonymize all posts and threads by the user
    // We don't delete them to maintain conversation integrity
    await Thread.updateMany(
      { author: user._id },
      { 
        $set: { 
          title: "[Deleted Account]",
          content: "[This user has deleted their account]",
          authorName: "[Deleted Account]"
        } 
      }
    );
    
    await Post.updateMany(
      { author: user._id },
      { $set: { content: "[This user has deleted their account]" } }
    );
    
    // If user is banned, add them to BannedAccounts collection
    // This prevents re-registration ban evasion
    if (user.isBanned) {
      await BannedAccount.create({
        discordId: user.discordId,
        email: user.email,
        reason: user.banReason || 'Account was banned before deletion',
        bannedAt: new Date(),
        bannedUntil: user.bannedUntil || undefined, // If no end date, it's permanent
        bannedBy: user._id, // Self-reference as the user was already banned by an admin
        bannedUsername: user.name,
        isAccountDeletion: true
      });
      
      console.log(`Added banned user ${user.name} to BannedAccounts to prevent re-registration`);
    }
    
    // Delete the user account
    await User.findByIdAndDelete(user._id);
    
    return { success: true, message: 'Account successfully deleted' };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'An error occurred while deleting your account' 
    };
  }
}

/**
 * Process account deletion and handle redirect
 */
export async function processAccountDeletion(locale: string, formData: FormData) {
  const result = await deleteUserAccount();
  
  if (!result.success) {
    return result;
  }
  
  // Redirect to home page after successful deletion
  redirect(`/${locale}?accountDeleted=true`);
}
