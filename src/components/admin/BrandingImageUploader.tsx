'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Loader2, ImageIcon, X, Upload } from 'lucide-react';
import Image from 'next/image';
import { uploadBrandingImage, deleteBrandingImage } from '@/actions/brandingActions';
import enTranslations from '@/i18n/locales/en.json';
import deTranslations from '@/i18n/locales/de.json';

interface BrandingImageUploaderProps {
  settingKey: string;
  currentImageUrl?: string;
  title: string;
  description: string;
  locale: 'en' | 'de';
  onComplete: () => void;
}

export default function BrandingImageUploader({
  settingKey,
  currentImageUrl,
  title,
  description,
  locale,
  onComplete,
}: BrandingImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const translations = {
    en: {
      upload: "Upload Image",
      uploading: "Uploading...",
      drag_here: "Drag image here or click to upload",
      change: "Change Image",
      remove: "Remove Image",
      delete: "Delete",
      deleting: "Deleting...",
      type_error: "Only JPEG, PNG, GIF, SVG, and WEBP images are allowed",
      size_error: "Maximum file size is 5MB",
      upload_error: "Failed to upload image",
      upload_success: "Image uploaded successfully",
      delete_success: "Image removed successfully",
      max_dimensions: "Maximum dimensions: 2000x2000 pixels"
    },
    de: {
      upload: "Bild hochladen",
      uploading: "Wird hochgeladen...",
      drag_here: "Bild hierher ziehen oder klicken zum Hochladen",
      change: "Bild ändern",
      remove: "Bild entfernen",
      delete: "Löschen",
      deleting: "Wird gelöscht...",
      type_error: "Nur JPEG, PNG, GIF, SVG und WEBP Bilder sind erlaubt",
      size_error: "Maximale Dateigröße ist 5MB",
      upload_error: "Fehler beim Hochladen des Bildes",
      upload_success: "Bild erfolgreich hochgeladen",
      delete_success: "Bild erfolgreich entfernt",
      max_dimensions: "Maximale Abmessungen: 2000x2000 Pixel"
    }
  };

  const t = translations[locale];

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setError(t.type_error);
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError(t.size_error);
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setSuccess(null);
      
      // Create form data and upload
      const formData = new FormData();
      formData.append('file', file);

      // Use the server action for uploading
      const result = await uploadBrandingImage(formData, settingKey);
      
      if (result.success) {
        setSuccess(t.upload_success);
        // Notify parent component that upload is done
        onComplete();
      } else {
        throw new Error(result.message || t.upload_error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : t.upload_error);
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!currentImageUrl) return;
    
    try {
      setIsDeleting(true);
      setError(null);
      setSuccess(null);

      const result = await deleteBrandingImage(settingKey);
      
      if (result.success) {
        setSuccess(t.delete_success);
        onComplete();
      } else {
        throw new Error(result.message || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete image');
    } finally {
      setIsDeleting(false);
    }
  };

  // Automatically hide success message after 3 seconds
  if (success) {
    setTimeout(() => {
      setSuccess(null);
    }, 3000);
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>

      {currentImageUrl ? (
        <div className="mb-4">
          <div className="relative mb-2 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
            {/* Use next/image for better performance */}
            <div className="relative h-48 bg-gray-100 dark:bg-gray-900">
              <img
                src={currentImageUrl}
                alt={title}
                className="object-contain w-full h-full"
              />
            </div>
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600/90 text-white p-1 rounded-full hover:bg-blue-700"
                disabled={isUploading || isDeleting}
              >
                <Upload className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-600/90 text-white p-1 rounded-full hover:bg-red-700"
                disabled={isUploading || isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-4"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center py-6">
            <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isUploading ? t.uploading : t.drag_here}
            </p>
            {isUploading && (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500 mt-2" />
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded-md text-sm mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-700 p-2 rounded-md text-sm mb-4">
          {success}
        </div>
      )}

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center text-sm"
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t.uploading}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {currentImageUrl ? t.change : t.upload}
            </>
          )}
        </button>
        {currentImageUrl && (
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center ml-2 text-sm"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t.deleting}
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                {t.delete}
              </>
            )}
          </button>
        )}
      </div>
      
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        {t.max_dimensions}
      </p>
    </div>
  );
}
