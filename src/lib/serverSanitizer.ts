/**
 * Simple sanitizer functions for server-side use
 */

/**
 * Sanitizes HTML strings on the server side
 * A basic implementation that removes the most dangerous content
 * @param html HTML string to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  return html
    // Remove script tags and their contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    
    // Remove event handlers
    .replace(/ on\w+="[^"]*"/g, '')
    .replace(/ on\w+='[^']*'/g, '')
    .replace(/ on\w+=\w+/g, '')
    
    // Remove javascript: protocol from links and images
    .replace(/javascript:/gi, 'nojavascript...')
    
    // Remove data: URLs except for allowed image types
    .replace(/data:(?!image\/(gif|png|jpeg|jpg|webp))[^;]*;/gi, 'data:invalid;')
    
    // Allow only specific tags
    // This is a simplified version, in production you'd want a proper parser
    // Keep only tags that are safe. This is not a comprehensive approach but provides basic protection
    .replace(/<(?!\/?(b|i|em|strong|span|p|br|hr|h[1-6]|ul|ol|li|blockquote|code|pre|img|a|table|thead|tbody|tr|th|td|div)\b)[^>]+>/gi, '');
}
