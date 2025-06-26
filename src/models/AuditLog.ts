import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  actionType: string;
  entityType: string;
  entityId: Schema.Types.ObjectId | string;
  details: object;
  performedBy: Schema.Types.ObjectId | string;
  performedAt: Date;
  metadata?: object;
}

const AuditLogSchema = new Schema<IAuditLog>({
  actionType: {
    type: String,
    required: true,
    enum: [
      'user_created', 
      'user_banned', 
      'user_unbanned',
      'user_muted',
      'user_unmuted',
      'user_warned',
      'user_role_changed',
      'thread_created',
      'thread_pinned',
      'thread_unpinned',
      'thread_locked',
      'thread_unlocked',
      'thread_deleted',
      'post_created',
      'post_deleted',
      'category_created',
      'category_updated',
      'category_deleted'
    ],
    index: true
  },
  entityType: {
    type: String,
    required: true,
    enum: ['user', 'thread', 'post', 'category'],
    index: true
  },
  entityId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'entityType',
    index: true
  },
  details: {
    type: Object,
    required: true
  },
  performedBy: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true
  },
  performedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    type: Object
  }
}, { timestamps: true });

// Create indexes for efficient queries
AuditLogSchema.index({ actionType: 1, performedAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, performedAt: -1 });
AuditLogSchema.index({ performedBy: 1, performedAt: -1 });

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
