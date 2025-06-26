import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import SiteSetting from "@/models/SiteSetting";

/**
 * GET /api/admin/settings
 * Get all settings or settings filtered by scope
 */
export async function GET(request: NextRequest) {
  try {
    // Connect to database first
    await connectToDatabase();
    
    // Check if a scope or key is provided as a query parameter
    const url = new URL(request.url);
    const scope = url.searchParams.get('scope');
    const key = url.searchParams.get('key');
    
    // For 'content' scope or specific content page keys, we don't require admin auth
    const isPublicRequest = 
      scope === 'content' || 
      (key && ['page_terms', 'page_privacy', 'page_contact'].includes(key));
    
    // For non-public requests, verify admin access
    if (!isPublicRequest) {
      const session = await getServerSession(authOptions);
      if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    let query = {};
    if (scope) query = { scope };
    if (key) query = { key };
    
    const settings = await SiteSetting.find(query).sort({ key: 1 }).lean();
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/settings
 * Update multiple settings in a single request
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    if (!body || !Array.isArray(body.settings)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    const updates = [];
    
    for (const setting of body.settings) {
      if (!setting.key || setting.value === undefined) {
        continue;
      }
      
      // Find the existing setting
      const existingSetting = await SiteSetting.findOne({ key: setting.key });
      if (!existingSetting) {
        continue;
      }
      
      // Update the setting
      updates.push(
        SiteSetting.updateOne(
          { key: setting.key },
          { $set: { value: setting.value, updatedAt: new Date() } }
        )
      );
    }
    
    // Execute all updates
    if (updates.length > 0) {
      await Promise.all(updates);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
