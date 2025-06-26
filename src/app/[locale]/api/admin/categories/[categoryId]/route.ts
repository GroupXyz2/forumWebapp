import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Category from '@/models/Category';
import Thread from '@/models/Thread';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';
import { createAuditLog } from '@/actions/auditActions';

export async function PUT(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    
    // Check if user is admin (only admins can edit categories)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const categoryId = params.categoryId;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }
    
    // Find category
    const category = await Category.findById(categoryId);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
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
    
    // Check if updated slug is already taken (excluding this category)
    if (data.slug !== category.slug) {
      const existingCategory = await Category.findOne({ 
        slug: data.slug,
        _id: { $ne: categoryId }
      });
      
      if (existingCategory) {
        return NextResponse.json({ 
          error: 'A category with this slug already exists' 
        }, { status: 400 });
      }
    }
    
    // Save old values for audit log
    const oldValues = {
      name: category.name,
      slug: category.slug,
      description: category.description
    };
    
    // Update category
    category.name = data.name;
    category.slug = data.slug;
    category.description = data.description || '';
    category.color = data.color || '#3b82f6';
    category.icon = data.icon || 'folder';
    
    await category.save();
    
    // Create audit log
    await createAuditLog(
      'category_updated',
      'category',
      category._id.toString(),
      {
        oldValues,
        newValues: {
          name: category.name,
          slug: category.slug,
          description: category.description
        }
      }
    );
    
    // Get thread count
    const threadCount = await Thread.countDocuments({ category: category._id });
    
    // Format category for response
    const formattedCategory = {
      id: category._id.toString(),
      name: category.name,
      description: category.description,
      slug: category.slug,
      color: category.color,
      icon: category.icon,
      order: category.order,
      threadCount
    };
    
    return NextResponse.json({
      message: 'Category updated successfully',
      category: formattedCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    
    // Check if user is admin (only admins can delete categories)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const categoryId = params.categoryId;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }
    
    // Find category
    const category = await Category.findById(categoryId);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    // Check if category has threads
    const threadCount = await Thread.countDocuments({ category: categoryId });
    if (threadCount > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete category with threads. Delete all threads first or move them to another category.' 
      }, { status: 400 });
    }
    
    // Delete category
    await Category.findByIdAndDelete(categoryId);
    
    // Create audit log
    await createAuditLog(
      'category_deleted',
      'category',
      category._id.toString(),
      { name: category.name, slug: category.slug }
    );
    
    return NextResponse.json({
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' }, 
      { status: 500 }
    );
  }
}
