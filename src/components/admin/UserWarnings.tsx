"use client";

import { formatDate } from "@/lib/utils";
import { useAdminTranslations } from "@/hooks/useAdminTranslations";

interface Warning {
  warning: string;
  date: string;
  moderator: string;
}

interface UserWarningsProps {
  warnings: Warning[];
  locale: string;
}

export default function UserWarnings({ warnings, locale }: UserWarningsProps) {
  const t = useAdminTranslations(locale);
  
  if (!warnings || warnings.length === 0) {
    return (
      <div className="text-gray-400 italic">
        {t('noWarningsFound')}
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {warnings.map((warning, index) => (
        <div 
          key={index} 
          className="p-3 bg-yellow-900/20 border border-yellow-800/40 rounded"
        >
          <p className="text-white">
            {warning.warning}
          </p>
          <div className="mt-2 flex justify-between text-sm text-gray-400">
            <span>{formatDate(warning.date)}</span>
            <span>ID: {warning.moderator}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
