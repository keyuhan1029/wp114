import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';
import { ScheduleModel } from '@/lib/models/Schedule';
import { ScheduleItemModel } from '@/lib/models/ScheduleItem';

async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const token = getTokenFromRequest(request as unknown as Request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || !payload.userId) return null;
  return payload.userId as string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ message: '未登入' }, { status: 401 });
    }

    const { id } = await params;

    // 驗證課表屬於該用戶
    const schedule = await ScheduleModel.findByIdAndUser(id, userId);
    if (!schedule) {
      return NextResponse.json({ message: '課表不存在' }, { status: 404 });
    }

    const items = await ScheduleItemModel.findBySchedule(id);

    const serialized = items.map((item) => ({
      ...item,
      _id: item._id?.toString(),
      scheduleId: typeof item.scheduleId === 'string'
        ? item.scheduleId
        : item.scheduleId.toString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    return NextResponse.json({ items: serialized });
  } catch (error: any) {
    console.error('取得課程項目失敗:', error);
    return NextResponse.json(
      { message: '取得課程項目失敗' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ message: '未登入' }, { status: 401 });
    }

    const { id } = await params;

    // 驗證課表屬於該用戶
    const schedule = await ScheduleModel.findByIdAndUser(id, userId);
    if (!schedule) {
      return NextResponse.json({ message: '課表不存在' }, { status: 404 });
    }

    const body = await request.json();
    const {
      courseName,
      location,
      teacher,
      dayOfWeek,
      periodStart,
      periodEnd,
      color,
    } = body;

    if (!courseName || typeof courseName !== 'string' || courseName.trim() === '') {
      return NextResponse.json(
        { message: '課程名稱不能為空' },
        { status: 400 }
      );
    }

    if (
      typeof dayOfWeek !== 'number' ||
      dayOfWeek < 0 ||
      dayOfWeek > 4
    ) {
      return NextResponse.json(
        { message: '星期必須是 0-4 之間的數字（0=週一，4=週五）' },
        { status: 400 }
      );
    }

    if (
      typeof periodStart !== 'number' ||
      periodStart < 0 ||
      periodStart > 14
    ) {
      return NextResponse.json(
        { message: '開始節次必須是 0-14 之間的數字' },
        { status: 400 }
      );
    }

    if (
      typeof periodEnd !== 'number' ||
      periodEnd < 0 ||
      periodEnd > 14 ||
      periodEnd < periodStart
    ) {
      return NextResponse.json(
        { message: '結束節次必須是 0-14 之間的數字，且不能小於開始節次' },
        { status: 400 }
      );
    }

    if (!color || typeof color !== 'string') {
      return NextResponse.json(
        { message: '顏色不能為空' },
        { status: 400 }
      );
    }

    const item = await ScheduleItemModel.create({
      scheduleId: id,
      courseName: courseName.trim(),
      location: location?.trim() || '',
      teacher: teacher?.trim() || '',
      dayOfWeek,
      periodStart,
      periodEnd,
      color: color.trim(),
    });

    const serialized = {
      ...item,
      _id: item._id?.toString(),
      scheduleId: typeof item.scheduleId === 'string'
        ? item.scheduleId
        : item.scheduleId.toString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };

    return NextResponse.json({ item: serialized }, { status: 201 });
  } catch (error: any) {
    console.error('新增課程項目失敗:', error);
    return NextResponse.json(
      { message: '新增課程項目失敗' },
      { status: 500 }
    );
  }
}

