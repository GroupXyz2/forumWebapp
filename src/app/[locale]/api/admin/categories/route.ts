import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Category from '@/models/Category';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';
import { createAuditLog } from '@/actions/auditActions';

export async function GET(
  request: NextRequest
) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    
    // Check if user is authorized
    if (!session?.user || !['admin', 'moderator'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get all categories, sorted by order
    const categories = await Category.find().sort({ order: 1 }).lean();
    
    // Format categories for the client
    const formattedCategories = categories.map((cat: any) => ({
      id: cat._id.toString(),
      name: cat.name,
      description: cat.description,
      slug: cat.slug,
      color: cat.color || '#3b82f6',
      icon: cat.icon || 'folder',
      order: cat.order || 0
    }));
    
    return NextResponse.json({
      categories: formattedCategories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' }, 
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    
    // Check if user is admin (only admins can create categories)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.slug) {
      return NextResponse.json({ 
        error: 'Name and slug are required' 
      }, { status: 400 });
    }
    
    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(data.slug)) {
      return NextResponse.json({ 
        error: 'Slug can only contain lowercase letters, numbers, and hyphens' 
      }, { status: 400 });
    }
    
    // Check if slug is already taken
    const existingCategory = await Category.findOne({ slug: data.slug });
    if (existingCategory) {
      return NextResponse.json({ 
        error: 'A category with this slug already exists' 
      }, { status: 400 });
    }
    
    // Get highest order value
    const highestOrder = await Category.findOne().sort({ order: -1 }).select('order').lean();
    const newOrder = highestOrder ? ((highestOrder as any).order || 0) + 1 : 0;
    
    // Create new category
    const newCategory = new Category({
      name: data.name,
      description: data.description || '',
      slug: data.slug,
      color: data.color || '#3b82f6',
      icon: data.icon || 'folder',
      order: newOrder
    });
    
    await newCategory.save();
    
    // Create audit log
    await createAuditLog(
      'category_created',
      'category',
      newCategory._id.toString(),
      { name: newCategory.name, slug: newCategory.slug }
    );
    
    // Format the new category for the response
    const category = {
      id: newCategory._id.toString(),
      name: newCategory.name,
      description: newCategory.description,
      slug: newCategory.slug,
      color: newCategory.color,
      icon: newCategory.icon,
      order: newCategory.order,
      threadCount: 0 // New category has no threads yet
    };
    
    return NextResponse.json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' }, 
      { status: 500 }
    );
  }
}
