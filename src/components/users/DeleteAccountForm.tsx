'use client';

import { useState } from 'react';
import { processAccountDeletion } from '@/actions/userActions';

interface DeleteAccountFormProps {
  locale: string;
}

export default function DeleteAccountForm({ locale }: DeleteAccountFormProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Import translations
  const translations = {
    en: {
      deleteAccount: 'Delete Account',
      warning: 'Warning: This action cannot be undone',
      description: 'Deleting your account will:',
      point1: 'Permanently remove your account information',
      point2: 'Anonymize all your threads and posts',
      point3: 'Remove your profile from the forum',
      confirmText: 'I understand that this action is permanent',
      cancel: 'Cancel',
      confirm: 'Yes, delete my account',
      deleting: 'Deleting account...',
      errorOccurred: 'An error occurred:',
    },
    de: {
      deleteAccount: 'Konto löschen',
      warning: 'Warnung: Diese Aktion kann nicht rückgängig gemacht werden',
      description: 'Das Löschen deines Kontos wird:',
      point1: 'Deine Kontoinformationen dauerhaft entfernen',
      point2: 'Alle deine Threads und Beiträge anonymisieren',
      point3: 'Dein Profil aus dem Forum entfernen',
      confirmText: 'Ich verstehe, dass diese Aktion dauerhaft ist',
      cancel: 'Abbrechen',
      confirm: 'Ja, mein Konto löschen',
      deleting: 'Konto wird gelöscht...',
      errorOccurred: 'Ein Fehler ist aufgetreten:',
    }
  };
  
  // Select the appropriate translations
  const t = translations[locale === 'de' ? 'de' : 'en'];
  
  // Handle delete account submission
  const handleSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const result = await processAccountDeletion(locale, formData);
      
      if (!result.success) {
        setError(result.message);
        setIsSubmitting(false);
      }
      
      // If successful, the page will be redirected by the server action
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-red-600 dark:text-red-500">
        {t.deleteAccount}
      </h2>
      
      <p className="mt-1 text-gray-600 dark:text-gray-400">
        {t.warning}
      </p>
      
      <button
        onClick={() => setIsDialogOpen(true)}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        {t.deleteAccount}
      </button>
      
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold text-red-600 dark:text-red-500 mb-4">
              {t.deleteAccount}
            </h3>
            
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                {t.description}
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                <li>{t.point1}</li>
                <li>{t.point2}</li>
                <li>{t.point3}</li>
              </ul>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
                <p>{t.errorOccurred} {error}</p>
              </div>
            )}
            
            <form action={handleSubmit}>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none disabled:bg-red-400"
                >
                  {isSubmitting ? t.deleting : t.confirm}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
