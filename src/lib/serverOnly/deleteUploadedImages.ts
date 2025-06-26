import path from 'path';
import fs from 'fs';
import { extractImageUrls } from '../contentUtils';

/**
 * Deletes uploaded image files associated with post content (server only)
 */
export async function deleteUploadedImages(content: string): Promise<void> {
  if (!content) return;
  const imageUrls = extractImageUrls(content);
  if (imageUrls.length === 0) return;
  for (const imageUrl of imageUrls) {
    try {
      const imagePath = path.join(process.cwd(), 'public', imageUrl);
      if (fs.existsSync(imagePath)) {
        await fs.promises.unlink(imagePath);
        console.log(`Deleted uploaded image: ${imagePath}`);
      }
    } catch (error) {
      console.error(`Failed to delete image ${imageUrl}:`, error);
    }
  }
}
