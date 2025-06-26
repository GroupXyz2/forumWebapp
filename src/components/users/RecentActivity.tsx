'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, MessageSquare, FileText } from 'lucide-react';

interface UserActivity {
  type: 'thread' | 'post';
  title: string;
  threadId: string;
  categoryId: string; 
  createdAt: string;
}

interface RecentActivityProps {
  userId: string;
  locale: string;
  translations: {
    loading: string;
    error: string;
    noActivity: string;
    postedIn: string;
    createdThread: string;
    posted: string;
    created: string;
    viewMore: string;
  }
}

export default function RecentActivity({ userId, locale, translations }: RecentActivityProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<UserActivity[]>([]);
  const [threadCount, setThreadCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  
  useEffect(() => {
    async function fetchUserActivity() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/${locale}/api/users/${userId}/stats`);
        
        if (!response.ok) {
          throw new Error(`Error fetching activity: ${response.statusText}`);
        }
        
        const data = await response.json();
        setActivity(data.recentActivity || []);
        setThreadCount(data.threadCount || 0);
        setPostCount(data.postCount || 0);
      } catch (err) {
        console.error('Failed to load user activity:', err);
        setError(err instanceof Error ? err.message : 'Failed to load activity');
      } finally {
        setLoading(false);
      }
    }
    
    if (userId) {
      fetchUserActivity();
    }
  }, [userId, locale]);
  
  // Format date relative to now (e.g., "3 days ago")
  function formatRelativeDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  }
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
        <span className="ml-2 text-gray-500 dark:text-gray-400">{translations.loading}</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>{translations.error}</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }
  
  if (activity.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>{translations.noActivity}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between mb-2">
        <div className="flex space-x-4">
          <div className="text-center">
            <span className="block text-2xl font-bold text-gray-700 dark:text-gray-300">{threadCount}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Threads</span>
          </div>
          <div className="text-center">
            <span className="block text-2xl font-bold text-gray-700 dark:text-gray-300">{postCount}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Posts</span>
          </div>
        </div>
      </div>
      
      <ul className="space-y-3">
        {activity.map((item, index) => (
          <li key={`${item.type}-${item.threadId}-${index}`} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
            <div className="flex gap-3">
              {item.type === 'thread' ? (
                <FileText className="h-5 w-5 text-blue-500 flex-shrink-0 mt-1" />
              ) : (
                <MessageSquare className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
              )}
              <div>
                <p className="text-gray-800 dark:text-gray-200 font-medium leading-tight">
                  {item.type === 'post' 
                    ? translations.postedIn 
                    : translations.createdThread}{' '}
                  <Link href={`/${locale}/forum/thread/${item.threadId}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                    {item.title}
                  </Link>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatRelativeDate(item.createdAt)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
