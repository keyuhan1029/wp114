import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';
import { NTUOfficialCalendarSource } from '@/lib/calendar/ntuOfficial';
import { PersonalEventModel } from '@/lib/models/PersonalEvent';

async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const token = getTokenFromRequest(request as unknown as Request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || !payload.userId) return null;
  return payload.userId as string;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ message: '未登入' }, { status: 401 });
    }

    const body = await request.json();
    const { ntuEventId, from, to } = body;

    if (!ntuEventId) {
      return NextResponse.json(
        { message: '缺少 ntuEventId' },
        { status: 400 }
      );
    }

    const source = new NTUOfficialCalendarSource();
    // 若前端沒給範圍，就抓未來一年的活動再過濾
    const nowIso = new Date().toISOString();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    const events = await source.getEvents({
      from: from || nowIso,
      to: to || oneYearLater.toISOString(),
    });

    const event = events.find((e) => e.id === ntuEventId);
    if (!event) {
      return NextResponse.json(
        { message: '找不到指定的 NTU 活動' },
        { status: 404 }
      );
    }

    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    // 檢查是否已經匯入過同一個 NTU 活動
    const db = await (await import('@/lib/mongodb')).getDatabase();
    const { ObjectId } = await import('mongodb');
    const userObjectId =
      typeof userId === 'string' ? new ObjectId(userId) : userId;

    const existing = await db
      .collection('personal_events')
      .findOne({
        userId: userObjectId,
        source: 'ntu_imported',
        ntuEventId: event.id,
      });

    if (existing) {
      return NextResponse.json(
        { message: '此校內活動已在你的個人行事曆中' },
        { status: 409 }
      );
    }

    const personal = await PersonalEventModel.create({
      userId,
      title: event.title,
      description: event.description,
      location: event.location,
      startTime: start,
      endTime: end,
      allDay: event.allDay,
      source: 'ntu_imported',
      ntuEventId: event.id,
    });

    const serialized = {
      ...personal,
      _id: personal._id?.toString(),
      userId:
        typeof personal.userId === 'string'
          ? personal.userId
          : personal.userId.toString(),
      startTime: personal.startTime.toISOString(),
      endTime: personal.endTime.toISOString(),
      createdAt: personal.createdAt.toISOString(),
      updatedAt: personal.updatedAt.toISOString(),
    };

    return NextResponse.json({ event: serialized }, { status: 201 });
  } catch (error: any) {
    console.error('將 NTU 活動加入個人行事曆失敗:', error);
    return NextResponse.json(
      { message: '將 NTU 活動加入個人行事曆失敗' },
      { status: 500 }
    );
  }
}


