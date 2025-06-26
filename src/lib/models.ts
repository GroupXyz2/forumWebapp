// This file ensures all models are imported and registered with Mongoose
import User from '@/models/User';
import Thread from '@/models/Thread';
import Post from '@/models/Post';
import Category from '@/models/Category';
import AuditLog from '@/models/AuditLog';
import BannedAccount from '@/models/BannedAccount';
import SiteSetting from '@/models/SiteSetting';

// Export the models to be used elsewhere
export {
  User,
  Thread,
  Post,
  Category,
  AuditLog,
  BannedAccount,
  SiteSetting
};
