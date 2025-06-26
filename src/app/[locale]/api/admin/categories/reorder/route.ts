import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Category from '@/models/Category';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

export async function POST(
  request: NextRequest
) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    
    // Check if user is admin (only admins can reorder categories)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const data = await request.json();
    
    if (!data.categories || !Array.isArray(data.categories)) {
      return NextResponse.json({ 
        error: 'Invalid request format. Expected array of categories.' 
      }, { status: 400 });
    }
    
    // Start a session for transaction
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();
    
    try {
      // Update each category's order
      const updatePromises = data.categories.map(async (cat: { id: string, order: number }) => {
        if (!mongoose.Types.ObjectId.isValid(cat.id)) {
          throw new Error(`Invalid category ID: ${cat.id}`);
        }
        
        return Category.findByIdAndUpdate(
          cat.id,
          { order: cat.order },
          { session: mongoSession }
        );
      });
      
      await Promise.all(updatePromises);
      await mongoSession.commitTransaction();
      
      return NextResponse.json({
        message: 'Categories reordered successfully'
      });
    } catch (error) {
      await mongoSession.abortTransaction();
      throw error;
    } finally {
      mongoSession.endSession();
    }
  } catch (error) {
    console.error('Error reordering categories:', error);
    return NextResponse.json(
      { error: 'Failed to reorder categories' }, 
      { status: 500 }
    );
  }
}
