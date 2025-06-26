import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import AuditLog from '@/models/AuditLog';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authOptions);
    
    // Only allow admins and moderators to access audit logs
    if (!session?.user || !['admin', 'moderator'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const actionType = url.searchParams.get('actionType') || '';
    const entityType = url.searchParams.get('entityType') || '';
    const performedBy = url.searchParams.get('performedBy') || '';
    const dateFrom = url.searchParams.get('dateFrom') || '';
    const dateTo = url.searchParams.get('dateTo') || '';
    
    // Build query
    let query: any = {};
    
    if (actionType) query.actionType = actionType;
    if (entityType) query.entityType = entityType;
    if (performedBy) query.performedBy = performedBy;
    
    if (dateFrom || dateTo) {
      query.performedAt = {};
      if (dateFrom) query.performedAt.$gte = new Date(dateFrom);
      if (dateTo) query.performedAt.$lte = new Date(dateTo);
    }
    
    // Get total count for pagination
    const totalLogs = await AuditLog.countDocuments(query);
    
    // Get logs with pagination
    const skip = (page - 1) * limit;
    const logs = await AuditLog.find(query)
      .sort({ performedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('performedBy', 'name image')
      .lean();
    
    // Format logs for the client
    const formattedLogs = logs.map((log: any) => ({
      id: log._id.toString(),
      actionType: log.actionType,
      entityType: log.entityType,
      entityId: log.entityId.toString(),
      details: log.details,
      performedBy: {
        id: (log.performedBy?._id || log.performedBy).toString(),
        name: log.performedBy?.name || 'Unknown',
        image: log.performedBy?.image || null
      },
      performedAt: log.performedAt,
      metadata: log.metadata || {}
    }));
    
    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total: totalLogs,
        totalPages: Math.ceil(totalLogs / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' }, 
      { status: 500 }
    );
  }
}
