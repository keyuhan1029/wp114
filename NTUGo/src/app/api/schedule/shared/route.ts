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

    // 獲取已接受的分享（包括我接受的分享和我發送且對方已接受並提供課表的分享）
    const shares = await ScheduleShareModel.getAcceptedSharesForUser(userId);

    // 獲取每個分享的好友資訊和他們的課表
    const sharedSchedules = await Promise.all(
      shares.map(async (share) => {
        // 判斷用戶是發送者還是接收者
        const isReceiver = share.receiverId.toString() === userId;
        const friendId = isReceiver ? share.senderId : share.receiverId;
        
        const friend = await UserModel.findById(friendId);
        if (!friend) return null;

        // 確定要顯示哪個課表
        let scheduleToShow;
        if (isReceiver) {
          // 我作為接收者：顯示發送者的課表（scheduleId 或默認課表）
          if (share.scheduleId) {
            scheduleToShow = await ScheduleModel.findById(share.scheduleId);
          } else {
            scheduleToShow = await ScheduleModel.findDefaultByUser(share.senderId);
          }
        } else {
          // 我作為發送者：顯示接收者提供的課表（receiverScheduleId）
          if (share.receiverScheduleId) {
            scheduleToShow = await ScheduleModel.findById(share.receiverScheduleId);
          } else {
            // 如果接收者沒有提供課表，顯示接收者的默認課表
            scheduleToShow = await ScheduleModel.findDefaultByUser(share.receiverId);
          }
        }

        if (!scheduleToShow) return null;

        // 獲取課表項目
        const items = await ScheduleItemModel.findBySchedule(scheduleToShow._id!);

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
            _id: scheduleToShow._id?.toString(),
            name: scheduleToShow.name,
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

