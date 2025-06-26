"use client";

import { useState } from "react";
import { banUser, unbanUser } from "@/actions/adminActions";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAdminTranslations } from "@/hooks/useAdminTranslations";

interface BanFormProps {
  userId: string;
  isBanned: boolean;
  bannedUntil: string | null;
  banReason: string;
  isDisabled: boolean;
  locale: string;
}

export default function BanForm({ 
  userId, 
  isBanned, 
  bannedUntil,
  banReason,
  isDisabled,
  locale 
}: BanFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("permanent");
  const [customDuration, setCustomDuration] = useState("24");
  const [customUnit, setCustomUnit] = useState("hours");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const t = useAdminTranslations(locale);
  
  const handleUnban = async () => {
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    
    try {
      const result = await unbanUser(userId);
      
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
  
  const handleBan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    
    if (!reason.trim()) {
      setError(t('banReasonRequired'));
      setIsSubmitting(false);
      return;
    }
    
    let durationInSeconds;
    if (duration === "permanent") {
      durationInSeconds = undefined;
    } else if (duration === "custom") {
      const durationValue = parseInt(customDuration, 10);
      if (isNaN(durationValue) || durationValue <= 0) {
        setError(t('invalidDuration'));
        setIsSubmitting(false);
        return;
      }
      
      switch (customUnit) {
        case "hours":
          durationInSeconds = durationValue * 60 * 60;
          break;
        case "days":
          durationInSeconds = durationValue * 24 * 60 * 60;
          break;
        case "weeks":
          durationInSeconds = durationValue * 7 * 24 * 60 * 60;
          break;
        case "months":
          durationInSeconds = durationValue * 30 * 24 * 60 * 60;
          break;
        default:
          durationInSeconds = durationValue * 60 * 60;
      }
    } else {
      // Preset durations
      switch (duration) {
        case "24h":
          durationInSeconds = 24 * 60 * 60;
          break;
        case "3days":
          durationInSeconds = 3 * 24 * 60 * 60;
          break;
        case "1week":
          durationInSeconds = 7 * 24 * 60 * 60;
          break;
        case "1month":
          durationInSeconds = 30 * 24 * 60 * 60;
          break;
        default:
          durationInSeconds = undefined;
      }
    }
    
    try {
      const result = await banUser(userId, reason, durationInSeconds);
      
      if (result.success) {
        setSuccess(result.message);
        setReason("");
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
  
  if (isBanned) {
    return (
      <div>
        <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded">
          <p className="font-medium">{t('userIsBanned')}</p>
          {bannedUntil ? (
            <p className="text-sm mt-1">
              {t('bannedUntil')}: {formatDate(bannedUntil)}
            </p>
          ) : (
            <p className="text-sm mt-1">{t('bannedPermanently')}</p>
          )}
          {banReason && (
            <div className="mt-2">
              <p className="text-sm text-gray-400">{t('banReason')}:</p>
              <p className="text-sm italic">"{banReason}"</p>
            </div>
          )}
        </div>
        
        <button
          onClick={handleUnban}
          disabled={isSubmitting || isDisabled}
          className={`w-full py-2 px-4 rounded font-medium
            ${isDisabled
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
            }
          `}
        >
          {isSubmitting ? t('processing') : t('unbanUser')}
        </button>
        
        {isDisabled && (
          <p className="text-yellow-500 text-sm mt-2">
            {t('cannotModerateHigherRole')}
          </p>
        )}
        
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {success && <p className="text-green-500 mt-2">{success}</p>}
      </div>
    );
  }
  
  return (
    <form onSubmit={handleBan}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {t('banReason')} *
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full bg-gray-900 text-white border border-gray-700 rounded p-2"
          rows={2}
          required
          disabled={isDisabled}
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {t('banDuration')}
        </label>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full bg-gray-900 text-white border border-gray-700 rounded p-2"
          disabled={isDisabled}
        >
          <option value="permanent">{t('permanentBan')}</option>
          <option value="24h">24 {t('hours')}</option>
          <option value="3days">3 {t('days')}</option>
          <option value="1week">1 {t('week')}</option>
          <option value="1month">1 {t('month')}</option>
          <option value="custom">{t('customDuration')}</option>
        </select>
        
        {duration === "custom" && (
          <div className="mt-3 flex">
            <input
              type="number"
              value={customDuration}
              onChange={(e) => setCustomDuration(e.target.value)}
              className="w-24 bg-gray-900 text-white border border-gray-700 rounded-l p-2"
              min="1"
              disabled={isDisabled}
            />
            <select
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              className="bg-gray-900 text-white border border-gray-700 rounded-r p-2 border-l-0"
              disabled={isDisabled}
            >
              <option value="hours">{t('hours')}</option>
              <option value="days">{t('days')}</option>
              <option value="weeks">{t('weeks')}</option>
              <option value="months">{t('months')}</option>
            </select>
          </div>
        )}
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting || isDisabled}
        className={`w-full py-2 px-4 rounded font-medium 
          ${isDisabled
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700 text-white'
          }
        `}
      >
        {isSubmitting ? t('processing') : t('banUser')}
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
