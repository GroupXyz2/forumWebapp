/**
 * Utility functions for content validation and rendering
 */
import { marked } from 'marked';
import { sanitizeHtml } from './serverSanitizer';

// DOMPurify wird nur clientseitig importiert
let DOMPurify: any = null;

/**
 * Counts the number of image tags in the content
 * Includes Markdown image syntax ![alt](url) and HTML <img> tags
 */
export function countImagesInContent(content: string): number {
  if (!content) return 0;
  
  // Count Markdown image syntax: ![alt text](url)
  const markdownImageRegex = /!\[.*?\]\(.*?\)/g;
  const markdownImages = content.match(markdownImageRegex) || [];
  
  // Count HTML image tags: <img src="..." />
  const htmlImageRegex = /<img[^>]*>/g;
  const htmlImages = content.match(htmlImageRegex) || [];
  
  return markdownImages.length + htmlImages.length;
}

/**
 * Checks if the content has more than the maximum allowed number of images
 */
export function hasExcessiveImages(content: string, maxAllowed: number = 1): boolean {
  return countImagesInContent(content) > maxAllowed;
}

/**
 * Extracts all image URLs from post content
 * Returns array of upload paths for local images
 */
export function extractImageUrls(content: string): string[] {
  if (!content) return [];
  
  const images: string[] = [];
  
  // Extract Markdown image URLs: ![alt text](url)
  const markdownImageRegex = /!\[.*?\]\((\/uploads\/[^)]+)\)/g;
  let match;
  while ((match = markdownImageRegex.exec(content)) !== null) {
    if (match[1].startsWith('/uploads/')) {
      images.push(match[1]);
    }
  }
  
  // Extract HTML image URLs: <img src="url" />
  const htmlImageRegex = /<img[^>]*src=["'](\/uploads\/[^"']+)["'][^>]*>/g;
  while ((match = htmlImageRegex.exec(content)) !== null) {
    if (match[1].startsWith('/uploads/')) {
      images.push(match[1]);
    }
  }
  
  return images;
}

/**
 * Converts Markdown content to HTML with basic sanitization
 * Used for rendering thread and post content
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';
  try {
    // Set options for marked (GitHub-flavored markdown, auto-linking URLs, etc.)
    marked.setOptions({
      renderer: new marked.Renderer(),
      gfm: true,          // GitHub-flavored markdown
      breaks: true,       // Translate line breaks to <br>
      pedantic: false     // Conform to markdown.pl
    });
    
    // Convert markdown to HTML and explicitly cast to string
    const html = marked.parse(markdown) as string;
    
    // Client-side sanitization
    if (typeof window !== 'undefined') {
      // Lazy-load DOMPurify only in browser context
      if (!DOMPurify) {
        // This is a dynamic import that will only run in the browser
        import('dompurify').then(module => {
          DOMPurify = module.default;
        });
      }
      
      if (DOMPurify) {
        // Configure purify to allow images
        const purifyConfig = {
          ADD_TAGS: ['img'],
          ADD_ATTR: ['target', 'src', 'alt', 'style', 'class', 'width', 'height']
        };
        
        return DOMPurify.sanitize(html, purifyConfig);
      }
    }
    // Server: sichere Sanitisierung
    return sanitizeHtml(html);
  } catch (error) {
    console.error('Error converting markdown to HTML:', error);
    // Return the original content as plain text if conversion fails
    return `<p>${markdown.replace(/\n/g, '<br>')}</p>`;
  }
}
