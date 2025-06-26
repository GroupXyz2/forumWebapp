'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toggleLikePost } from '@/actions/likeActions';

interface LikeButtonProps {
  postId: string;
  initialLikeCount: number;
  initialLiked: boolean;
  locale: string;
}

export default function LikeButton({ postId, initialLikeCount, initialLiked, locale }: LikeButtonProps) {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLikeToggle = async () => {
    if (!session) {
      // Redirect to login if not authenticated
      window.location.href = `/${locale}/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await toggleLikePost(postId);
      
      if (result.success) {
        setLiked(result.liked);
        setLikeCount(result.likeCount);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <button
      onClick={handleLikeToggle}
      disabled={isLoading}
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm ${
        liked
          ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
      } transition-colors`}
      aria-label={liked ? "Unlike" : "Like"}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`} 
        fill={liked ? "currentColor" : "none"}
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" 
        />
      </svg>
      <span>{likeCount}</span>
    </button>
  );
}
