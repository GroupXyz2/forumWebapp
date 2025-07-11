import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { User, Thread, Post } from '@/lib/models'; // Import models from central file

export async function GET() {
  await connectToDatabase();
  const [userCount, threadCount, postCount] = await Promise.all([
    User.countDocuments(),
    Thread.countDocuments(),
    Post.countDocuments(),
  ]);
  return NextResponse.json({ userCount, threadCount, postCount });
}
