'use server';

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectToDatabase from '@/lib/db';
import SiteSetting from '@/models/SiteSetting';
import { revalidatePath } from 'next/cache';
import { deleteUploadedImages } from '@/lib/serverOnly/deleteUploadedImages';

// Directory for branding uploads
const brandingUploadsDir = join(process.cwd(), 'public', 'uploads', 'branding');

/**
 * Uploads an image for use in site settings
 * Only admins can upload branding images
 */
export async function uploadBrandingImage(
  formData: FormData,
  settingKey: string
): Promise<{ success: boolean; url?: string; message?: string }> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session?.user.role !== 'admin') {
      return { success: false, message: 'Unauthorized. Only admins can upload branding images.' };
    }

    // Get the file from form data
    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, message: 'No file provided' };
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      return { 
        success: false,
        message: 'Invalid file type. Only JPEG, PNG, GIF, SVG, and WEBP images are allowed'
      };
    }

    // Validate file size (max 5MB for branding images)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        message: 'File is too large. Maximum size is 5MB'
      };
    }

    // Ensure upload directory exists
    if (!existsSync(brandingUploadsDir)) {
      await mkdir(brandingUploadsDir, { recursive: true });
    }

    // Generate unique file name
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = join(brandingUploadsDir, fileName);
    const fileUrl = `/uploads/branding/${fileName}`;

    // Convert file to buffer and save
    const buffer = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(buffer));

    // Connect to database
    await connectToDatabase();

    // Find the setting to update
    let setting = await SiteSetting.findOne({ key: settingKey });
    if (!setting) {
      // Create the setting if it does not exist
      setting = new SiteSetting({
        key: settingKey,
        value: fileUrl,
        type: 'image',
        scope: 'branding',
        updatedAt: new Date()
      });
    } else {
      // Delete old image if it exists
      if (setting.value && typeof setting.value === 'string' && setting.value.startsWith('/uploads/')) {
        try {
          // Create a fake HTML content with the image to use our existing deleteUploadedImages function
          const fakeHtml = `<img src="${setting.value}">`;
          await deleteUploadedImages(fakeHtml);
        } catch (err) {
          console.error('Error deleting old image:', err);
          // Continue even if deletion fails
        }
      }
      // Update setting with new image URL
      setting.value = fileUrl;
      setting.updatedAt = new Date();
    }
    await setting.save();

    // Revalidate pages
    revalidatePath('/en');
    revalidatePath('/de');
    revalidatePath('/en/admin/settings');
    revalidatePath('/de/admin/settings');

    return {
      success: true,
      url: fileUrl
    };
  } catch (error) {
    console.error('Error uploading branding image:', error);
    return {
      success: false,
      message: 'Failed to upload image'
    };
  }
}

/**
 * Delete a branding image
 */
export async function deleteBrandingImage(
  settingKey: string
): Promise<{ success: boolean; message?: string }> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session?.user.role !== 'admin') {
      return { success: false, message: 'Unauthorized. Only admins can delete branding images.' };
    }

    await connectToDatabase();

    // Find the setting
    const setting = await SiteSetting.findOne({ key: settingKey });
    if (!setting || !setting.value) {
      return {
        success: false,
        message: 'Image not found'
      };
    }

    // Delete the image if it exists
    if (typeof setting.value === 'string' && setting.value.startsWith('/uploads/')) {
      try {
        const fakeHtml = `<img src="${setting.value}">`;
        await deleteUploadedImages(fakeHtml);
      } catch (err) {
        console.error('Error deleting image:', err);
        // Continue even if deletion fails
      }
    }

    // Reset the setting value
    setting.value = '';
    setting.updatedAt = new Date();
    await setting.save();

    // Revalidate pages
    revalidatePath('/en');
    revalidatePath('/de');
    revalidatePath('/en/admin/settings');
    revalidatePath('/de/admin/settings');

    return {
      success: true,
      message: 'Image deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting branding image:', error);
    return {
      success: false,
      message: 'Failed to delete image'
    };
  }
}
