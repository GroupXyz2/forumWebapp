'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Loader2, ImageIcon, X } from 'lucide-react';
// Import locale translations
import enTranslations from '@/i18n/locales/en.json';
import deTranslations from '@/i18n/locales/de.json';

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  onError: (error: string) => void;
  locale: 'en' | 'de';
}

export default function ImageUploader({ onImageUploaded, onError, locale }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const translations = {
    en: {
      title: "Add an image",
      button: "Upload Image",
      uploading: "Uploading...",
      drag_here: "Drag image here or click to upload",
      remove: "Remove Image",
      limit_message: "Maximum 1 image allowed per post",
      type_error: "Only JPEG, PNG, GIF, and WEBP images are allowed",
      size_error: "Maximum file size is 2MB",
      upload_error: "Failed to upload image",
      insert_text: "Image uploaded successfully"
    },
    de: {
      title: "Bild hinzufügen",
      button: "Bild hochladen",
      uploading: "Wird hochgeladen...",
      drag_here: "Bild hierher ziehen oder klicken zum Hochladen",
      remove: "Bild entfernen",
      limit_message: "Maximal 1 Bild pro Beitrag erlaubt",
      type_error: "Nur JPEG, PNG, GIF und WEBP Bilder sind erlaubt",
      size_error: "Maximale Dateigröße ist 2MB",
      upload_error: "Fehler beim Hochladen des Bildes",
      insert_text: "Bild erfolgreich hochgeladen"
    }
  };

  const t = translations[locale];

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      onError(t.type_error);
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      onError(t.size_error);
      return;
    }

    try {
      setIsUploading(true);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Create form data and upload
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      
      if (data.success && data.url) {
        // Pass the URL to the parent component
        onImageUploaded(data.url);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setPreview(null);
      onError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // Notify parent component to remove image from content
    onImageUploaded('');
  };

  return (
    <div className="mt-2">
      {!preview ? (
        <div 
          className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center py-2">
            <ImageIcon className="h-6 w-6 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isUploading ? t.uploading : t.drag_here}
            </p>
            {isUploading && (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500 mt-2" />
            )}
          </div>
        </div>
      ) : (
        <div className="relative rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-auto max-h-48 object-contain"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-gray-900/70 text-white p-1 rounded-full hover:bg-red-500/90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
        {t.limit_message}
      </p>
    </div>
  );
}
