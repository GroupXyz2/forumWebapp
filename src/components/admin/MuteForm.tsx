"use client";

import { useState } from "react";
import { muteUser, unmuteUser } from "@/actions/adminActions";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface MuteFormProps {
  userId: string;
  isMuted: boolean;
  mutedUntil: string | null;
  isDisabled: boolean;
  locale: string;
}

export default function MuteForm({ 
  userId, 
  isMuted, 
  mutedUntil,
  isDisabled,
  locale 
}: MuteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duration, setDuration] = useState("1h");
  const [customDuration, setCustomDuration] = useState("1");
  const [customUnit, setCustomUnit] = useState("hours");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const t = useTranslations('Admin');
  
  const handleUnmute = async () => {
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    
    try {
      const result = await unmuteUser(userId);
      
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
  
  const handleMute = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    
    let durationInSeconds;
    
    if (duration === "custom") {
      const durationValue = parseInt(customDuration, 10);
      if (isNaN(durationValue) || durationValue <= 0) {
        setError(t('invalidDuration'));
        setIsSubmitting(false);
        return;
      }
      
      switch (customUnit) {
        case "minutes":
          durationInSeconds = durationValue * 60;
          break;
        case "hours":
          durationInSeconds = durationValue * 60 * 60;
          break;
        case "days":
          durationInSeconds = durationValue * 24 * 60 * 60;
          break;
        default:
          durationInSeconds = durationValue * 60 * 60;
      }
    } else {
      // Preset durations
      switch (duration) {
        case "1h":
          durationInSeconds = 60 * 60;
          break;
        case "6h":
          durationInSeconds = 6 * 60 * 60;
          break;
        case "12h":
          durationInSeconds = 12 * 60 * 60;
          break;
        case "24h":
          durationInSeconds = 24 * 60 * 60;
          break;
        default:
          durationInSeconds = 60 * 60;
      }
    }
    
    try {
      const result = await muteUser(userId, durationInSeconds);
      
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
  
  if (isMuted) {
    return (
      <div>
        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-800 rounded">
          <p className="font-medium">{t('userIsMuted')}</p>
          {mutedUntil && (
            <p className="text-sm mt-1">
              {t('mutedUntil')}: {formatDate(mutedUntil)}
            </p>
          )}
        </div>
        
        <button
          onClick={handleUnmute}
          disabled={isSubmitting || isDisabled}
          className={`w-full py-2 px-4 rounded font-medium
            ${isDisabled
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
            }
          `}
        >
          {isSubmitting ? t('processing') : t('unmuteUser')}
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
    <form onSubmit={handleMute}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {t('muteDuration')}
        </label>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full bg-gray-900 text-white border border-gray-700 rounded p-2"
          disabled={isDisabled}
        >
          <option value="1h">1 {t('hour')}</option>
          <option value="6h">6 {t('hours')}</option>
          <option value="12h">12 {t('hours')}</option>
          <option value="24h">24 {t('hours')}</option>
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
              <option value="minutes">{t('minutes')}</option>
              <option value="hours">{t('hours')}</option>
              <option value="days">{t('days')}</option>
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
            : 'bg-yellow-600 hover:bg-yellow-700 text-white'
          }
        `}
      >
        {isSubmitting ? t('processing') : t('muteUser')}
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
