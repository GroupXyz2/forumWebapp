'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';

// Import locale translations
import enTranslations from "@/i18n/locales/en.json";
import deTranslations from "@/i18n/locales/de.json";

const translations = {
  en: enTranslations,
  de: deTranslations,
};

interface AuditLog {
  id: string;
  actionType: string;
  entityType: string;
  entityId: string;
  details: any;
  performedBy: {
    id: string;
    name: string;
    image?: string;
  };
  performedAt: string;
  metadata?: any;
}

interface AuditLogTableProps {
  locale: string;
}

export default function AuditLogTable({ locale }: AuditLogTableProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({
    actionType: '',
    entityType: '',
    performedBy: '',
    dateFrom: '',
    dateTo: ''
  });
  
  // Use direct translation object
  const t = translations[locale as 'en' | 'de'];

  // Helper for root-level keys
  const tr = (key: string) => ((t as any)[key] || key);
  // Helper for admin keys
  const ta = (key: string) => ((t.admin as any)?.[key] || key);
  // Helper for forum keys
  const tf = (key: string) => ((t.forum as any)?.[key] || key);
  // Helper for common keys
  const tc = (key: string) => ((t.common as any)?.[key] || key);
  
  useEffect(() => {
    fetchLogs();
  }, [page, filter]);
  
  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // Build query string
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      
      if (filter.actionType) params.append('actionType', filter.actionType);
      if (filter.entityType) params.append('entityType', filter.entityType);
      if (filter.performedBy) params.append('performedBy', filter.performedBy);
      if (filter.dateFrom) params.append('dateFrom', filter.dateFrom);
      if (filter.dateTo) params.append('dateTo', filter.dateTo);
      
      const response = await fetch(`/${locale}/api/admin/audit-logs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      
      const data = await response.json();
      setLogs(data.logs);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };
  
  const formatActionType = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  const renderEntityType = (type: string) => {
    switch(type) {
      case 'user':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">{tf('users')}</span>;
      case 'thread':
        return <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">{tf('threads')}</span>;
      case 'post':
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded">{tf('posts')}</span>;
      case 'category':
        return <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded">{tf('categories')}</span>;
      default:
        return type;
    }
  };
  
  if (loading && page === 1) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
        {tr('errorOccurred')}: {error}
      </div>
    );
  }
  
  return (
    <div>
      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {tr('action')}
          </label>
          <select
            name="actionType"
            value={filter.actionType}
            onChange={handleFilterChange}
            className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
          >
            <option value="">{tr('allActions')}</option>
            <option value="user_banned">User Banned</option>
            <option value="user_unbanned">User Unbanned</option>
            <option value="user_muted">User Muted</option>
            <option value="user_unmuted">User Unmuted</option>
            <option value="user_warned">User Warned</option>
            <option value="user_role_changed">User Role Changed</option>
            <option value="thread_created">Thread Created</option>
            <option value="thread_pinned">Thread Pinned</option>
            <option value="thread_unpinned">Thread Unpinned</option>
            <option value="thread_locked">Thread Locked</option>
            <option value="thread_unlocked">Thread Unlocked</option>
            <option value="thread_deleted">Thread Deleted</option>
            <option value="post_created">Post Created</option>
            <option value="post_deleted">Post Deleted</option>
            <option value="category_created">Category Created</option>
            <option value="category_updated">Category Updated</option>
            <option value="category_deleted">Category Deleted</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {tr('target')}
          </label>
          <select
            name="entityType"
            value={filter.entityType}
            onChange={handleFilterChange}
            className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
          >
            <option value="">{tr('allTargets')}</option>
            <option value="user">User</option>
            <option value="thread">Thread</option>
            <option value="post">Post</option>
            <option value="category">Category</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {tr('dateRange')}
          </label>
          <input
            type="date"
            name="dateFrom"
            value={filter.dateFrom}
            onChange={handleFilterChange}
            className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 mb-2"
            placeholder="From"
          />
        </div>
        
        <div className="self-end">
          <input
            type="date"
            name="dateTo"
            value={filter.dateTo}
            onChange={handleFilterChange}
            className="w-full rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
            placeholder="To"
          />
        </div>
        
        <div className="self-end">
          <button
            onClick={() => {
              setFilter({
                actionType: '',
                entityType: '',
                performedBy: '',
                dateFrom: '',
                dateTo: ''
              });
              setPage(1);
            }}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {tc('reset')}
          </button>
        </div>
      </div>
      
      {/* Table */}
      {logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {tr('auditLogEmpty')}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {tr('action')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {tr('target')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {tr('performer')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {tr('date')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {tr('details')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-4 py-4 whitespace-nowrap">
                      {formatActionType(log.actionType)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {renderEntityType(log.entityType)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {log.performedBy.image ? (
                          <img
                            src={log.performedBy.image}
                            alt={log.performedBy.name}
                            className="h-6 w-6 rounded-full mr-2"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2">
                            {log.performedBy.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span>{log.performedBy.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {formatDate(new Date(log.performedAt))}
                    </td>
                    <td className="px-4 py-4">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => page > 1 && setPage(page - 1)}
                disabled={page === 1}
                className={`px-4 py-2 rounded ${
                  page === 1
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                &larr; {tc('previous')}
              </button>
              
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {tr('page')} {page} / {totalPages}
              </span>
              
              <button
                onClick={() => page < totalPages && setPage(page + 1)}
                disabled={page === totalPages}
                className={`px-4 py-2 rounded ${
                  page === totalPages
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {tc('next')} &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
