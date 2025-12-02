import { NextRequest, NextResponse } from 'next/server';
import { NTUOfficialCalendarSource } from '@/lib/calendar/ntuOfficial';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;

    const source = new NTUOfficialCalendarSource();
    const events = await source.getEvents({ from, to });

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error('取得 NTU 行事曆事件失敗:', error);
    return NextResponse.json(
      { message: '取得 NTU 行事曆事件失敗' },
      { status: 500 }
    );
  }
}


