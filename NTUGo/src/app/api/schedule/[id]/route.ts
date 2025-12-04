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

    const schedule = await ScheduleModel.findByIdAndUser(id, userId);
    if (!schedule) {
      return NextResponse.json({ message: '課表不存在' }, { status: 404 });
    }

    const items = await ScheduleItemModel.findBySchedule(id);

    const serializedSchedule = {
      ...schedule,
      _id: schedule._id?.toString(),
      userId: typeof schedule.userId === 'string'
        ? schedule.userId
        : schedule.userId.toString(),
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString(),
    };

    const serializedItems = items.map((item) => ({
      ...item,
      _id: item._id?.toString(),
      scheduleId: typeof item.scheduleId === 'string'
        ? item.scheduleId
        : item.scheduleId.toString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      schedule: serializedSchedule,
      items: serializedItems,
    });
  } catch (error: any) {
    console.error('取得課表失敗:', error);
    return NextResponse.json(
      { message: '取得課表失敗' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ message: '未登入' }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const { name, isDefault } = body;

    const updateData: any = {};
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json(
          { message: '課表名稱不能為空' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }
    if (isDefault !== undefined) {
      updateData.isDefault = !!isDefault;
    }

    const schedule = await ScheduleModel.update(id, userId, updateData);
    if (!schedule) {
      return NextResponse.json({ message: '課表不存在' }, { status: 404 });
    }

    const serialized = {
      ...schedule,
      _id: schedule._id?.toString(),
      userId: typeof schedule.userId === 'string'
        ? schedule.userId
        : schedule.userId.toString(),
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString(),
    };

    return NextResponse.json({ schedule: serialized });
  } catch (error: any) {
    console.error('更新課表失敗:', error);
    return NextResponse.json(
      { message: '更新課表失敗' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ message: '未登入' }, { status: 401 });
    }

    const { id } = await params;

    // 檢查課表是否存在且屬於該用戶
    const schedule = await ScheduleModel.findByIdAndUser(id, userId);
    if (!schedule) {
      return NextResponse.json({ message: '課表不存在' }, { status: 404 });
    }

    // 刪除所有相關的課程項目
    await ScheduleItemModel.deleteBySchedule(id);

    // 刪除課表
    const deleted = await ScheduleModel.delete(id, userId);
    if (!deleted) {
      return NextResponse.json({ message: '刪除課表失敗' }, { status: 500 });
    }

    return NextResponse.json({ message: '刪除成功' });
  } catch (error: any) {
    console.error('刪除課表失敗:', error);
    return NextResponse.json(
      { message: '刪除課表失敗' },
      { status: 500 }
    );
  }
}

