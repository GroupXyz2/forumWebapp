'use server';

import connectToDatabase from '@/lib/db';
import AuditLog from '@/models/AuditLog';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

// Generic function to log an audit entry
export async function createAuditLog(
  actionType: string, 
  entityType: string,
  entityId: string,
  details: object,
  metadata?: object
) {
  try {
    await connectToDatabase();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error('No authenticated user for audit log');
    }
    
    const auditLog = new AuditLog({
      actionType,
      entityType,
      entityId: new mongoose.Types.ObjectId(entityId),
      details,
      performedBy: new mongoose.Types.ObjectId(session.user.id),
      performedAt: new Date(),
      ...(metadata ? { metadata } : {})
    });
    
    await auditLog.save();
    
    return {
      success: true,
      message: 'Audit log created'
    };
  } catch (error) {
    console.error('Create audit log error:', error);
    return {
      success: false, 
      message: 'Failed to create audit log'
    };
  }
}

// Function to get audit logs with various filters
export async function getAuditLogs({
  page = 1,
  limit = 50,
  entityType = null,
  entityId = null,
  actionType = null,
  performedBy = null,
  startDate = null,
  endDate = null
}: {
  page?: number;
  limit?: number;
  entityType?: string | null;
  entityId?: string | null;
  actionType?: string | null;
  performedBy?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
} = {}) {
  try {
    await connectToDatabase();
    
    // Check if user has permission
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'moderator'].includes(session.user.role)) {
      return {
        success: false,
        message: 'Not authorized to view audit logs',
        logs: [],
        pagination: { page, limit, total: 0, totalPages: 0 }
      };
    }
    
    // Build query with filters
    const query: any = {};
    
    if (entityType) query.entityType = entityType;
    if (entityId && mongoose.Types.ObjectId.isValid(entityId)) query.entityId = new mongoose.Types.ObjectId(entityId);
    if (actionType) query.actionType = actionType;
    if (performedBy && mongoose.Types.ObjectId.isValid(performedBy)) query.performedBy = new mongoose.Types.ObjectId(performedBy);
    
    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    if (Object.keys(dateFilter).length > 0) query.performedAt = dateFilter;
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = await AuditLog.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    // Fetch logs with populated references
    const logs = await AuditLog.find(query)
      .sort({ performedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('performedBy', 'name image role')
      .populate({
        path: 'entityId',
        select: 'name title content',
        // Options to handle potentially deleted entities
        options: { strictPopulate: false }
      })
      .lean();
    
    // Format logs for output
    const formattedLogs = logs.map((log: any) => ({
      id: log._id.toString(),
      actionType: log.actionType,
      entityType: log.entityType,
      entityId: typeof log.entityId === 'object' ? 
        log.entityId._id?.toString() || log.entityId.toString() : 
        log.entityId?.toString(),
      entityName: getEntityName(log.entityId, log.entityType),
      details: log.details,
      performedBy: log.performedBy ? {
        id: log.performedBy._id.toString(),
        name: log.performedBy.name,
        image: log.performedBy.image,
        role: log.performedBy.role
      } : null,
      performedAt: log.performedAt,
      metadata: log.metadata
    }));
    
    return {
      success: true,
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  } catch (error) {
    console.error('Get audit logs error:', error);
    return {
      success: false,
      message: 'Failed to retrieve audit logs',
      logs: [],
      pagination: { page, limit, total: 0, totalPages: 0 }
    };
  }
}

// Helper to get the entity name from populated entity
function getEntityName(entity: any, entityType: string): string {
  if (!entity || typeof entity !== 'object') return 'Unknown';
  
  switch (entityType) {
    case 'user':
      return entity.name || 'Unknown User';
    case 'thread':
      return entity.title || 'Unknown Thread';
    case 'post':
      return entity.content?.substring(0, 30) + '...' || 'Unknown Post';
    case 'category':
      return entity.name || 'Unknown Category';
    default:
      return 'Unknown';
  }
}

// Get audit logs for a specific entity
export async function getEntityAuditLogs(entityType: string, entityId: string, page = 1, limit = 20) {
  return getAuditLogs({
    page,
    limit,
    entityType,
    entityId
  });
}

// Get recent activity across the system
export async function getRecentActivity(limit = 20) {
  return getAuditLogs({
    page: 1,
    limit
  });
}
