import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';
import { PersonalEventModel } from '@/lib/models/PersonalEvent';

function parseDateParam(value: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (isNaN(d.getTime())) return undefined;
  return d;
}

async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const token = getTokenFromRequest(request as unknown as Request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || !payload.userId) return null;
  return payload.userId as string;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ message: '未登入' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = parseDateParam(searchParams.get('from'));
    const to = parseDateParam(searchParams.get('to'));

    const events = await PersonalEventModel.findByUser(userId, { from, to });

    // 將 Date 轉成 ISO 字串，方便前端使用
    const serialized = events.map((e) => ({
      ...e,
      _id: e._id?.toString(),
      userId: typeof e.userId === 'string' ? e.userId : e.userId.toString(),
      startTime: e.startTime.toISOString(),
      endTime: e.endTime.toISOString(),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    }));

    return NextResponse.json({ events: serialized });
  } catch (error: any) {
    console.error('取得個人行程失敗:', error);
    return NextResponse.json(
      { message: '取得個人行程失敗' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ message: '未登入' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, location, startTime, endTime, allDay } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { message: '缺少必要欄位（title, startTime, endTime）' },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { message: '時間格式錯誤' },
        { status: 400 }
      );
    }

    const event = await PersonalEventModel.create({
      userId,
      title,
      description,
      location,
      startTime: start,
      endTime: end,
      allDay: !!allDay,
      source: 'manual',
    });

    const serialized = {
      ...event,
      _id: event._id?.toString(),
      userId: typeof event.userId === 'string'
        ? event.userId
        : event.userId.toString(),
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };

    return NextResponse.json({ event: serialized }, { status: 201 });
  } catch (error: any) {
    console.error('新增個人行程失敗:', error);
    return NextResponse.json(
      { message: '新增個人行程失敗' },
      { status: 500 }
    );
  }
}


