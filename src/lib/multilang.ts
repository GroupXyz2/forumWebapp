/**
 * Utility functions for handling multilingual content
 */

// Helper function to get localized string from multilingual object
export const getLocalizedString = (obj: any, locale: string): string => {
  if (!obj) return '';
  
  // If it's already a string, return it
  if (typeof obj === 'string') return obj;
  
  // If it's an object with language keys, get the appropriate one
  if (typeof obj === 'object' && obj !== null) {
    // Check for locale-specific value
    if (obj[locale]) return obj[locale];
    
    // Fallback to English
    if (obj.en) return obj.en;
    
    // Fallback to German
    if (obj.de) return obj.de;
    
    // Fallback to first value in object
    const firstValue = Object.values(obj)[0];
    if (typeof firstValue === 'string') return firstValue;
  }
  
  // If all else fails, safely convert to string
  return String(obj || '');
};

// Type guard to check if an object is a multilingual object
export const isMultilingual = (obj: any): boolean => {
  return typeof obj === 'object' && obj !== null && (obj.en !== undefined || obj.de !== undefined);
};
