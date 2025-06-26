import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import Thread from '@/models/Thread';
import Post from '@/models/Post';

export async function GET() {
  await connectToDatabase();
  const [userCount, threadCount, postCount] = await Promise.all([
    User.countDocuments(),
    Thread.countDocuments(),
    Post.countDocuments(),
  ]);
  return NextResponse.json({ userCount, threadCount, postCount });
}
