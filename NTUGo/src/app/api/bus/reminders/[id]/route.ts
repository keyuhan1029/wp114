import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { BusReminderModel } from '@/lib/models/BusReminder';
import { ObjectId } from 'mongodb';

// 删除公车提醒
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { message: '未提供認證 token' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { message: '無效的 token' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: '無效的提醒 ID' },
        { status: 400 }
      );
    }

    const deleted = await BusReminderModel.delete(id, payload.userId);

    if (!deleted) {
      return NextResponse.json(
        { message: '提醒不存在或無權限刪除' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '提醒已刪除',
    });
  } catch (error: any) {
    console.error('删除公车提醒错误:', error);
    return NextResponse.json(
      { message: '删除公车提醒失败', error: error.message },
      { status: 500 }
    );
  }
}

