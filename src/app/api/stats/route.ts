import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/copilot-data/reader';

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error('Error getting dashboard stats:', err);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
