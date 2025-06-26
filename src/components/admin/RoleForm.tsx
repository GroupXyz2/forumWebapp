"use client";

import { useState } from "react";
import { changeUserRole } from "@/actions/adminActions";
import { useRouter } from "next/navigation";
import { useAdminTranslations } from "@/hooks/useAdminTranslations";

interface RoleFormProps {
  userId: string;
  currentRole: string;
  isDisabled: boolean;
  locale: string;
}

export default function RoleForm({ 
  userId, 
  currentRole,
  isDisabled,
  locale 
}: RoleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState(currentRole);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const t = useAdminTranslations(locale);
  
  const handleRoleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    
    if (role === currentRole) {
      setError(t('roleAlreadyAssigned'));
      setIsSubmitting(false);
      return;
    }
    
    try {
      const result = await changeUserRole(userId, role as 'admin' | 'moderator' | 'user');
      
      if (result.success) {
        setSuccess(result.message);
        router.refresh();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(t('errorOccurred'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleRoleChange}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {t('selectRole')} 
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full bg-gray-900 text-white border border-gray-700 rounded p-2"
          disabled={isDisabled}
        >
          <option value="user">{t('roleUser')}</option>
          <option value="moderator">{t('roleModerator')}</option>
          <option value="admin">{t('roleAdmin')}</option>
        </select>
        <p className="text-sm text-gray-400 mt-2">
          {t('currentRole')}: <span className="font-medium">{currentRole}</span>
        </p>
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting || isDisabled || role === currentRole}
        className={`w-full py-2 px-4 rounded font-medium 
          ${isDisabled || role === currentRole
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }
        `}
      >
        {isSubmitting ? t('processing') : t('changeRole')}
      </button>
      
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && <p className="text-green-500 mt-2">{success}</p>}
    </form>
  );
}
