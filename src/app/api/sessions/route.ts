import { NextResponse } from 'next/server';
import { getAllSessions } from '@/lib/copilot-data/reader';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '100', 10);
    const sessions = await getAllSessions();
    return NextResponse.json(sessions.slice(0, limit));
  } catch (err) {
    console.error('Error getting sessions:', err);
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 });
  }
}
