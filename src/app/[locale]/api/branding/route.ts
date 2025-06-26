import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import SiteSetting from '@/models/SiteSetting';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'branding';
    
    // Build query based on scope
    const query = scope ? { scope } : {};
    
    // Find settings
    const settings = await SiteSetting.find(query).sort({ key: 1 }).lean();
    
    // Return settings
    return NextResponse.json({ success: true, settings }, { status: 200 });
  } catch (error) {
    console.error('Error fetching branding settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
