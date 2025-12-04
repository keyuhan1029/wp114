import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';
import { ScheduleModel } from '@/lib/models/Schedule';

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

    const schedules = await ScheduleModel.findByUser(userId);

    const serialized = schedules.map((s) => ({
      ...s,
      _id: s._id?.toString(),
      userId: typeof s.userId === 'string' ? s.userId : s.userId.toString(),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    return NextResponse.json({ schedules: serialized });
  } catch (error: any) {
    console.error('取得課表列表失敗:', error);
    return NextResponse.json(
      { message: '取得課表列表失敗' },
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
    const { name, isDefault } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { message: '課表名稱不能為空' },
        { status: 400 }
      );
    }

    const schedule = await ScheduleModel.create({
      userId,
      name: name.trim(),
      isDefault: !!isDefault,
    });

    const serialized = {
      ...schedule,
      _id: schedule._id?.toString(),
      userId: typeof schedule.userId === 'string'
        ? schedule.userId
        : schedule.userId.toString(),
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString(),
    };

    return NextResponse.json({ schedule: serialized }, { status: 201 });
  } catch (error: any) {
    console.error('創建課表失敗:', error);
    return NextResponse.json(
      { message: '創建課表失敗' },
      { status: 500 }
    );
  }
}

