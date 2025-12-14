import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';
import { ScheduleShareModel } from '@/lib/models/ScheduleShare';
import { UserModel } from '@/lib/models/User';

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
    const type = searchParams.get('type'); // 'received' or 'sent'

    let shares;
    if (type === 'received') {
      shares = await ScheduleShareModel.getReceivedRequests(userId);
    } else if (type === 'sent') {
      shares = await ScheduleShareModel.getSentRequests(userId);
    } else {
      return NextResponse.json({ message: '缺少 type 參數' }, { status: 400 });
    }

    // 獲取用戶資訊
    const requests = await Promise.all(
      shares.map(async (share) => {
        const targetUserId = type === 'received' ? share.senderId : share.receiverId;
        const user = await UserModel.findById(targetUserId);
        
        return {
          shareId: share._id?.toString(),
          user: user
            ? {
                id: user._id?.toString(),
                userId: user.userId,
                name: user.name,
                avatar: user.avatar,
                department: user.department,
              }
            : null,
          createdAt: share.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error('獲取課表分享請求失敗:', error);
    return NextResponse.json(
      { message: '獲取課表分享請求失敗' },
      { status: 500 }
    );
  }
}

