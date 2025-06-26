"use client";

import { useState } from "react";
import { warnUser } from "@/actions/adminActions";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface WarnFormProps {
  userId: string;
  warningCount: number;
  isDisabled: boolean;
  locale: string;
}

export default function WarnForm({ 
  userId, 
  warningCount,
  isDisabled,
  locale 
}: WarnFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const t = useTranslations('Admin');
  
  const handleWarn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    
    if (!warning.trim()) {
      setError(t('warningReasonRequired'));
      setIsSubmitting(false);
      return;
    }
    
    try {
      const result = await warnUser(userId, warning);
      
      if (result.success) {
        setSuccess(result.message);
        setWarning("");
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
    <form onSubmit={handleWarn}>
      <div className="mb-1">
        <p className="text-sm text-gray-400 mb-1">
          {t('currentWarningCount')}: <span className="font-medium text-yellow-400">{warningCount}</span>
        </p>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {t('warningReason')} *
        </label>
        <textarea
          value={warning}
          onChange={(e) => setWarning(e.target.value)}
          className="w-full bg-gray-900 text-white border border-gray-700 rounded p-2"
          rows={2}
          required
          disabled={isDisabled}
        />
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting || isDisabled}
        className={`w-full py-2 px-4 rounded font-medium 
          ${isDisabled
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-yellow-600 hover:bg-yellow-700 text-white'
          }
        `}
      >
        {isSubmitting ? t('processing') : t('submitWarning')}
      </button>
      
      {isDisabled && (
        <p className="text-yellow-500 text-sm mt-2">
          {t('cannotModerateHigherRole')}
        </p>
      )}
      
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && <p className="text-green-500 mt-2">{success}</p>}
    </form>
  );
}
