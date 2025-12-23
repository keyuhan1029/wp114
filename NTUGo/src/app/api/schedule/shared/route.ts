import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';
import { ScheduleShareModel } from '@/lib/models/ScheduleShare';
import { UserModel } from '@/lib/models/User';
import { ScheduleModel } from '@/lib/models/Schedule';
import { ScheduleItemModel } from '@/lib/models/ScheduleItem';

async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const token = getTokenFromRequest(request as unknown as Request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || !payload.userId) return null;
  return payload.userId as string;
}

// 獲取已接受的好友課表分享列表（我可以看到的好友課表）
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ message: '未登入' }, { status: 401 });
    }

    // 獲取已接受的分享（我接受了哪些好友的分享）
    const shares = await ScheduleShareModel.getAcceptedSharesForUser(userId);

    // 獲取每個分享的好友資訊和他們的課表
    const sharedSchedules = await Promise.all(
      shares.map(async (share) => {
        const friend = await UserModel.findById(share.senderId);
        if (!friend) return null;

        // 獲取好友的默認課表
        const defaultSchedule = await ScheduleModel.findDefaultByUser(share.senderId);
        if (!defaultSchedule) return null;

        // 獲取課表項目
        const items = await ScheduleItemModel.findBySchedule(defaultSchedule._id!);

        return {
          shareId: share._id?.toString(),
          friend: {
            id: friend._id?.toString(),
            userId: friend.userId,
            name: friend.name,
            avatar: friend.avatar,
            department: friend.department,
          },
          schedule: {
            _id: defaultSchedule._id?.toString(),
            name: defaultSchedule.name,
            items: items.map((item) => ({
              ...item,
              _id: item._id?.toString(),
              scheduleId: item.scheduleId.toString(),
            })),
          },
        };
      })
    );

    // 過濾掉 null 值
    const validShares = sharedSchedules.filter((s) => s !== null);

    return NextResponse.json({ sharedSchedules: validShares });
  } catch (error: any) {
    console.error('獲取已分享課表失敗:', error);
    return NextResponse.json(
      { message: '獲取已分享課表失敗' },
      { status: 500 }
    );
  }
}

