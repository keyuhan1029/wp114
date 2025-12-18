import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';
import { ScheduleShareModel } from '@/lib/models/ScheduleShare';
import { triggerScheduleShareAccepted } from '@/lib/pusher';

async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const token = getTokenFromRequest(request as unknown as Request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || !payload.userId) return null;
  return payload.userId as string;
}

// 接受課表分享請求
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ message: '未登入' }, { status: 401 });
    }

    const { id: shareId } = await params;
    
    // 驗證 shareId 格式
    if (!shareId || shareId.trim() === '') {
      return NextResponse.json({ message: '缺少分享 ID' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { receiverScheduleId } = body;

    console.log('接受課表分享請求:', { shareId, userId, receiverScheduleId });
    
    const share = await ScheduleShareModel.acceptRequest(shareId, userId, receiverScheduleId);

    // 發送 Pusher 通知
    try {
      await triggerScheduleShareAccepted(share.senderId.toString(), {
        shareId: share._id?.toString(),
        receiverId: userId,
      });
    } catch (error) {
      console.error('發送 Pusher 通知失敗:', error);
    }

    const serialized = {
      ...share,
      _id: share._id?.toString(),
      senderId: share.senderId.toString(),
      receiverId: share.receiverId.toString(),
      scheduleId: share.scheduleId?.toString(),
      receiverScheduleId: share.receiverScheduleId?.toString(),
      createdAt: share.createdAt.toISOString(),
      updatedAt: share.updatedAt.toISOString(),
    };

    return NextResponse.json({ share: serialized });
  } catch (error: any) {
    console.error('接受課表分享請求失敗:', error);
    return NextResponse.json(
      { message: error.message || '接受課表分享請求失敗' },
      { status: 400 }
    );
  }
}

// 拒絕或刪除課表分享請求
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ message: '未登入' }, { status: 401 });
    }

    const { id: shareId } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // 'reject', 'cancel', or 'delete'

    if (action === 'cancel') {
      // 取消已發送的請求
      const deleted = await ScheduleShareModel.cancelRequest(shareId, userId);
      if (!deleted) {
        return NextResponse.json({ message: '找不到請求或無法取消' }, { status: 404 });
      }
    } else if (action === 'delete') {
      // 刪除已接受的分享
      const deleted = await ScheduleShareModel.deleteShare(shareId, userId);
      if (!deleted) {
        return NextResponse.json({ message: '找不到分享或無法刪除' }, { status: 404 });
      }
    } else {
      // 默認：拒絕收到的請求
      const deleted = await ScheduleShareModel.rejectRequest(shareId, userId);
      if (!deleted) {
        return NextResponse.json({ message: '找不到請求或無法拒絕' }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('處理課表分享請求失敗:', error);
    return NextResponse.json(
      { message: error.message || '處理課表分享請求失敗' },
      { status: 400 }
    );
  }
}

