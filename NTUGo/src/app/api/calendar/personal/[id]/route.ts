import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';
import { PersonalEventModel } from '@/lib/models/PersonalEvent';

async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const token = getTokenFromRequest(request as unknown as Request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || !payload.userId) return null;
  return payload.userId as string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ message: '未登入' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, location, startTime, endTime, allDay } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (allDay !== undefined) updateData.allDay = !!allDay;
    if (startTime !== undefined) {
      const s = new Date(startTime);
      if (isNaN(s.getTime())) {
        return NextResponse.json(
          { message: 'startTime 時間格式錯誤' },
          { status: 400 }
        );
      }
      updateData.startTime = s;
    }
    if (endTime !== undefined) {
      const e = new Date(endTime);
      if (isNaN(e.getTime())) {
        return NextResponse.json(
          { message: 'endTime 時間格式錯誤' },
          { status: 400 }
        );
      }
      updateData.endTime = e;
    }

    const updated = await PersonalEventModel.update(
      id,
      userId,
      updateData
    );

    if (!updated) {
      return NextResponse.json(
        { message: '找不到行程或無權限' },
        { status: 404 }
      );
    }

    const serialized = {
      ...updated,
      _id: updated._id?.toString(),
      userId:
        typeof updated.userId === 'string'
          ? updated.userId
          : updated.userId.toString(),
      startTime: updated.startTime.toISOString(),
      endTime: updated.endTime.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };

    return NextResponse.json({ event: serialized });
  } catch (error: any) {
    console.error('更新個人行程失敗:', error);
    return NextResponse.json(
      { message: '更新個人行程失敗' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ message: '未登入' }, { status: 401 });
    }

    const ok = await PersonalEventModel.delete(id, userId);
    if (!ok) {
      return NextResponse.json(
        { message: '找不到行程或無權限' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('刪除個人行程失敗:', error);
    return NextResponse.json(
      { message: '刪除個人行程失敗' },
      { status: 500 }
    );
  }
}


