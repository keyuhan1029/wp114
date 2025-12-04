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

// 驗證課程項目是否屬於該用戶的課表
async function verifyItemOwnership(
  itemId: string,
  userId: string
): Promise<{ item: any; schedule: any } | null> {
  const item = await ScheduleItemModel.findById(itemId);
  if (!item) return null;

  const scheduleId =
    typeof item.scheduleId === 'string'
      ? item.scheduleId
      : item.scheduleId.toString();
  const schedule = await ScheduleModel.findByIdAndUser(scheduleId, userId);
  if (!schedule) return null;

  return { item, schedule };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ message: '未登入' }, { status: 401 });
    }

    const { itemId } = await params;

    const ownership = await verifyItemOwnership(itemId, userId);
    if (!ownership) {
      return NextResponse.json({ message: '課程項目不存在' }, { status: 404 });
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

    const updateData: any = {};
    if (courseName !== undefined) {
      if (typeof courseName !== 'string' || courseName.trim() === '') {
        return NextResponse.json(
          { message: '課程名稱不能為空' },
          { status: 400 }
        );
      }
      updateData.courseName = courseName.trim();
    }
    if (location !== undefined) {
      updateData.location = location?.trim() || '';
    }
    if (teacher !== undefined) {
      updateData.teacher = teacher?.trim() || '';
    }
    if (dayOfWeek !== undefined) {
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
      updateData.dayOfWeek = dayOfWeek;
    }
    if (periodStart !== undefined) {
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
      updateData.periodStart = periodStart;
    }
    if (periodEnd !== undefined) {
      if (
        typeof periodEnd !== 'number' ||
        periodEnd < 0 ||
        periodEnd > 14
      ) {
        return NextResponse.json(
          { message: '結束節次必須是 0-14 之間的數字' },
          { status: 400 }
        );
      }
      updateData.periodEnd = periodEnd;
    }
    if (periodStart !== undefined && periodEnd !== undefined) {
      if (periodEnd < periodStart) {
        return NextResponse.json(
          { message: '結束節次不能小於開始節次' },
          { status: 400 }
        );
      }
    }
    if (color !== undefined) {
      if (typeof color !== 'string' || color.trim() === '') {
        return NextResponse.json(
          { message: '顏色不能為空' },
          { status: 400 }
        );
      }
      updateData.color = color.trim();
    }

    const item = await ScheduleItemModel.update(
      itemId,
      ownership.item.scheduleId,
      updateData
    );

    if (!item) {
      return NextResponse.json(
        { message: '更新課程項目失敗' },
        { status: 500 }
      );
    }

    const serialized = {
      ...item,
      _id: item._id?.toString(),
      scheduleId: typeof item.scheduleId === 'string'
        ? item.scheduleId
        : item.scheduleId.toString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };

    return NextResponse.json({ item: serialized });
  } catch (error: any) {
    console.error('更新課程項目失敗:', error);
    return NextResponse.json(
      { message: '更新課程項目失敗' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ message: '未登入' }, { status: 401 });
    }

    const { itemId } = await params;

    const ownership = await verifyItemOwnership(itemId, userId);
    if (!ownership) {
      return NextResponse.json({ message: '課程項目不存在' }, { status: 404 });
    }

    const deleted = await ScheduleItemModel.delete(
      itemId,
      ownership.item.scheduleId
    );

    if (!deleted) {
      return NextResponse.json(
        { message: '刪除課程項目失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: '刪除成功' });
  } catch (error: any) {
    console.error('刪除課程項目失敗:', error);
    return NextResponse.json(
      { message: '刪除課程項目失敗' },
      { status: 500 }
    );
  }
}

