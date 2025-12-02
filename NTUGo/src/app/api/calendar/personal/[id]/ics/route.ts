import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';
import { PersonalEventModel } from '@/lib/models/PersonalEvent';
import { buildIcsForPersonalEvent } from '@/lib/calendar/ics';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getTokenFromRequest(request as unknown as Request);
    if (!token) {
      return NextResponse.json({ message: '未登入' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ message: '未登入' }, { status: 401 });
    }

    const userId = payload.userId as string;
    const event = await PersonalEventModel.findById(id);

    if (!event) {
      return NextResponse.json(
        { message: '找不到行程' },
        { status: 404 }
      );
    }

    // 確認擁有權
    const eventUserId =
      typeof event.userId === 'string' ? event.userId : event.userId.toString();
    if (eventUserId !== userId) {
      return NextResponse.json(
        { message: '無權限存取此行程' },
        { status: 403 }
      );
    }

    const ics = buildIcsForPersonalEvent(event);

    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="event-${id}.ics"`,
      },
    });
  } catch (error: any) {
    console.error('匯出行程 .ics 失敗:', error);
    return NextResponse.json(
      { message: '匯出行程失敗' },
      { status: 500 }
    );
  }
}


