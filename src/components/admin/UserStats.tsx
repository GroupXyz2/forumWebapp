"use client";

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { useAdminTranslations } from '@/hooks/useAdminTranslations';

interface UserStatsProps {
  userId: string;
  locale: string;
}

interface UserStatsData {
  threadCount: number;
  postCount: number;
  lastActiveAt: string | null;
  recentActivity: {
    type: 'thread' | 'post';
    title: string;
    threadId?: string;
    categoryId?: string;
    createdAt: string;
  }[];
}

export default function UserStats({ userId, locale }: UserStatsProps) {
  const [stats, setStats] = useState<UserStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useAdminTranslations(locale);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/${locale}/api/users/${userId}/stats`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch user stats');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching user stats:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [userId, locale]);
  
  if (loading) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg">
        <p className="text-red-500">{t('errorLoadingStats')}: {error}</p>
      </div>
    );
  }
  
  if (!stats) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg">
        <p className="text-gray-400">{t('noStatsAvailable')}</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-bold mb-4">{t('userActivity')}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-2xl font-bold">{stats.threadCount}</div>
          <div className="text-sm text-gray-400">{t('threadsCreated')}</div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-2xl font-bold">{stats.postCount}</div>
          <div className="text-sm text-gray-400">{t('postsWritten')}</div>
        </div>
        <div className="bg-gray-700 p-4 rounded-lg">
          <div className="text-sm font-bold">
            {stats.lastActiveAt 
              ? formatDate(new Date(stats.lastActiveAt)) 
              : t('neverActive')}
          </div>
          <div className="text-sm text-gray-400">{t('lastActive')}</div>
        </div>
      </div>
      
      <h4 className="font-semibold mb-2">{t('recentActivity')}</h4>
      
      {stats.recentActivity.length === 0 ? (
        <p className="text-gray-400 text-sm">{t('noRecentActivity')}</p>
      ) : (
        <div className="space-y-3">
          {stats.recentActivity.map((activity, index) => (
            <div key={index} className="bg-gray-700 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  {activity.type === 'thread' ? (
                    <span className="inline-block px-2 py-1 text-xs bg-blue-600 text-white rounded mr-2">
                      {t('createdThread')}
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 text-xs bg-green-600 text-white rounded mr-2">
                      {t('replied')}
                    </span>
                  )}
                  <a 
                    href={`/${locale}/forum/${activity.categoryId}/thread/${activity.threadId}`}
                    className="hover:text-blue-400"
                  >
                    {activity.title}
                  </a>
                </div>
                <div className="text-xs text-gray-400">
                  {formatDate(new Date(activity.createdAt))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
