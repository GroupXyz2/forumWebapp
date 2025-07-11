import { getUserById } from '@/actions/adminActions';
import { getSession } from '@/lib/auth';
import Link from 'next/link';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import BanForm from '@/components/admin/BanForm';
import MuteForm from '@/components/admin/MuteForm';
import WarnForm from '@/components/admin/WarnForm';
import RoleForm from '@/components/admin/RoleForm';
import UserWarnings from '@/components/admin/UserWarnings';
import UserStats from '@/components/admin/UserStats';
import { redirect } from 'next/navigation';
import { getLocaleTranslation } from '@/i18n/getLocaleTranslation';

export default async function UserDetailPage({
  params
}: {
  params: { locale: string; userId: string }
}) {
  // In Next.js 15+, we need to await params before using them
  const awaitedParams = await params;
  const { locale, userId } = awaitedParams;
  
  const session = await getSession();
  const t = await getLocaleTranslation(locale);
  // Function to get translations from the Admin namespace
  const tAdmin = (key: string, placeholders?: Record<string, string>) => t(`admin.${key.toLowerCase()}`, placeholders);
  
  // Check if user is admin or moderator
  if (!session?.user || !['admin', 'moderator'].includes(session.user.role)) {
    redirect(`/${locale}/forum`);
  }
  
  const { success, user, message } = await getUserById(userId);
  
  if (!success || !user) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">{tAdmin('userNotFound')}</h1>
        <p className="text-red-500">{message}</p>
        <div className="mt-4">
          <Link
            href={`/${locale}/admin/users`}
            className="text-blue-500 hover:text-blue-700"
          >
            &larr; {tAdmin('backToUserList')}
          </Link>
        </div>
      </div>
    );
  }
  
  const isAdmin = session.user.role === 'admin';
  const isBanned = user.isBanned;
  const isMuted = user.isMuted;
  const isTargetHigherRole = 
    (user.role === 'admin') || 
    (user.role === 'moderator' && session.user.role !== 'admin');
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{tAdmin('userManagement')}</h1>
        <Link
          href={`/${locale}/admin/users`}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          {tAdmin('backToUserList')}
        </Link>
      </div>
      
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || 'User'}
                width={120}
                height={120}
                className="rounded-full"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                {user.name?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>
          
          <div className="flex-grow">
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-gray-400">{user.email}</p>
            
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="text-gray-400">{tAdmin('userId')}:</span>
                <span className="ml-2 font-mono text-sm">{user.id}</span>
              </div>
              
              <div>
                <span className="text-gray-400">{tAdmin('role')}:</span>
                <span className="ml-2">
                  <span className={`
                    px-2 py-1 rounded text-xs font-bold
                    ${user.role === 'admin' ? 'bg-red-600 text-white' : 
                      user.role === 'moderator' ? 'bg-purple-600 text-white' : 
                      'bg-blue-600 text-white'}
                  `}>
                    {user.role.toUpperCase()}
                  </span>
                </span>
              </div>
              
              <div>
                <span className="text-gray-400">{tAdmin('accountCreated')}:</span>
                <span className="ml-2">{formatDate(user.createdAt)}</span>
              </div>
              
              <div>
                <span className="text-gray-400">{tAdmin('status')}:</span>
                <span className="ml-2">
                  {isBanned ? (
                    <span className="text-red-500 font-bold">{tAdmin('banned')}</span>
                  ) : isMuted ? (
                    <span className="text-yellow-500 font-bold">{tAdmin('muted')}</span>
                  ) : (
                    <span className="text-green-500 font-bold">{tAdmin('active')}</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Moderation Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Ban Action */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4">
            {isBanned ? tAdmin('unbanUser') : tAdmin('banUser')}
          </h3>
          <BanForm 
            userId={user.id} 
            isBanned={isBanned} 
            bannedUntil={user.bannedUntil}
            banReason={user.banReason}
            isDisabled={isTargetHigherRole}
            locale={locale}
          />
        </div>
        
        {/* Mute Action */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4">
            {isMuted ? tAdmin('unmuteUser') : tAdmin('muteUser')}
          </h3>
          <MuteForm 
            userId={user.id} 
            isMuted={isMuted} 
            mutedUntil={user.mutedUntil}
            isDisabled={isTargetHigherRole}
            locale={locale}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Warning Action */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4">{tAdmin('warnUser')}</h3>
          <WarnForm 
            userId={user.id} 
            warningCount={user.warningCount}
            isDisabled={isTargetHigherRole}
            locale={locale}
          />
        </div>
        
        {/* Role Management - Admin only */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4">{tAdmin('changeRole')}</h3>
          <RoleForm 
            userId={user.id} 
            currentRole={user.role} 
            isDisabled={!isAdmin || user.id === session.user.id}
            locale={locale}
          />
          {!isAdmin && (
            <p className="text-yellow-500 text-sm mt-2">
              {tAdmin('onlyAdminCanChangeRoles')}
            </p>
          )}
          {user.id === session.user.id && isAdmin && (
            <p className="text-yellow-500 text-sm mt-2">
              {tAdmin('cannotChangeOwnRole')}
            </p>
          )}
        </div>
      </div>
      
      {/* Warning History */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-lg font-bold mb-4">{tAdmin('warningHistory')}</h3>
        <UserWarnings warnings={user.warnings || []} locale={locale} />
      </div>
      
      {/* User Stats and Activity */}
      <UserStats userId={user.id} locale={locale} />
    </div>
  );
}
