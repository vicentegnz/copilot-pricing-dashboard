import { NextResponse } from 'next/server';
import { getSessionDetail } from '@/lib/copilot-data/reader';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const detail = await getSessionDetail(id);
    if (!detail) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (err) {
    console.error('Error getting session detail:', err);
    return NextResponse.json({ error: 'Failed to load session' }, { status: 500 });
  }
}
