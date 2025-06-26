'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';
import connectToDatabase from '@/lib/db';
import SiteSetting from '@/models/SiteSetting';
import { createAuditLog } from './auditActions';

/**
 * Initialize default settings if they don't exist
 */
export async function initializeSettings() {
  await connectToDatabase();
  
  // Check if settings exist
  const count = await SiteSetting.countDocuments();
  
  if (count === 0) {
    // Create default settings
    const defaultSettings = [
      {
        key: 'homepage_title',
        value: {
          en: 'Modern Discussion Platform',
          de: 'Moderne Diskussionsplattform',
        },
        type: 'string',
        scope: 'homepage',
      },
      {
        key: 'homepage_slogan',
        value: {
          en: 'Join our community to discuss your favorite topics in a modern, user-friendly environment.',
          de: 'Tritt unserer Community bei, um deine Lieblingsthemen in einer modernen, benutzerfreundlichen Umgebung zu diskutieren.',
        },
        type: 'text',
        scope: 'homepage',
      },
      {
        key: 'homepage_feature_1_title',
        value: {
          en: 'Dark & Light Mode',
          de: 'Dunkel- & Hellmodus',
        },
        type: 'string',
        scope: 'homepage',
      },
      {
        key: 'homepage_feature_1_description',
        value: {
          en: 'Switch between dark and light theme to suit your preferences.',
          de: 'Wechsle zwischen dunklem und hellem Design nach deinen Vorlieben.',
        },
        type: 'text',
        scope: 'homepage',
      },
      {
        key: 'homepage_feature_2_title',
        value: {
          en: 'Multilingual Support',
          de: 'Mehrsprachige Unterstützung',
        },
        type: 'string',
        scope: 'homepage',
      },
      {
        key: 'homepage_feature_2_description',
        value: {
          en: 'Full support for English and German languages.',
          de: 'Vollständige Unterstützung für englische und deutsche Sprache.',
        },
        type: 'text',
        scope: 'homepage',
      },
      {
        key: 'homepage_feature_3_title',
        value: {
          en: 'Discord Authentication',
          de: 'Discord-Authentifizierung',
        },
        type: 'string',
        scope: 'homepage',
      },
      {
        key: 'homepage_feature_3_description',
        value: {
          en: 'Securely sign in with your Discord account.',
          de: 'Melde dich sicher mit deinem Discord-Konto an.',
        },
        type: 'text',
        scope: 'homepage',
      },
      {
        key: 'primary_cta_text',
        value: {
          en: 'Browse Forums',
          de: 'Foren durchsuchen',
        },
        type: 'string',
        scope: 'homepage',
      },
    ];
    
    await SiteSetting.insertMany(defaultSettings);
    console.log('Default settings initialized');
  }
}

/**
 * Get all settings or settings by scope
 */
export async function getSettings(scope?: string) {
  await connectToDatabase();
  
  const query = scope ? { scope } : {};
  const settings = await SiteSetting.find(query).sort({ key: 1 }).lean();
  
  // Convert to a key-value map for easier access
  const settingsMap: Record<string, any> = {};
  for (const setting of settings) {
    settingsMap[setting.key] = setting;
  }
  
  return settingsMap;
}

/**
 * Get a single setting by key
 */
export async function getSetting(key: string) {
  await connectToDatabase();
  
  const setting = await SiteSetting.findOne({ key }).lean();
  return setting;
}

/**
 * Update a setting
 */
export async function updateSetting(key: string, value: any) {
  await connectToDatabase();
  
  const session = await getServerSession(authOptions);
  
  // Check if user is authorized
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  
  const oldSetting = await SiteSetting.findOne({ key });
  if (!oldSetting) {
    throw new Error(`Setting with key ${key} not found`);
  }
  
  const updatedSetting = await SiteSetting.findOneAndUpdate(
    { key },
    { $set: { value, updatedAt: new Date() } },
    { new: true }
  ).lean();
  
  // Create audit log entry
  await createAuditLog(
    'update_setting',
    'setting',
    key,
    {
      key,
      oldValue: oldSetting.value,
      newValue: value,
    }
  );
  
  // Revalidate homepage path for both locales to see changes immediately
  revalidatePath('/en');
  revalidatePath('/de');
  
  return updatedSetting;
}

/**
 * Update multiple settings at once
 */
export async function updateSettings(settings: { key: string; value: any }[]) {
  await connectToDatabase();
  
  const session = await getServerSession(authOptions);
  
  // Check if user is authorized
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  
  const updates = [];
  // Process each setting
  for (const setting of settings) {
    const oldSetting = await SiteSetting.findOne({ key: setting.key });
    
    if (!oldSetting) {
      continue; // Skip if setting doesn't exist
    }
    
    updates.push(
      SiteSetting.updateOne(
        { key: setting.key },
        { $set: { value: setting.value, updatedAt: new Date() } }
      )
    );
    
    // Add audit log for this setting
    await createAuditLog(
      'update_setting',
      'setting',
      setting.key,
      {
        key: setting.key,
        oldValue: oldSetting.value,
        newValue: setting.value,
      }
    );
  }
  
  // Execute all updates
  await Promise.all(updates);
  
  // Revalidate homepage path for both locales
  revalidatePath('/en');
  revalidatePath('/de');
  
  return true;
}
