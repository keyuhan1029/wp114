import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { ScheduleModel } from '@/lib/models/Schedule';
import { ScheduleItemModel } from '@/lib/models/ScheduleItem';
import { UserModel } from '@/lib/models/User';
import { ObjectId } from 'mongodb';

// 課程時間對照表（台大標準時間）
const PERIOD_TIMES = [
  { period: 0, start: '07:10', end: '08:00' },   // 第 0 節
  { period: 1, start: '08:10', end: '09:00' },   // 第 1 節
  { period: 2, start: '09:10', end: '10:00' },   // 第 2 節
  { period: 3, start: '10:20', end: '11:10' },   // 第 3 節
  { period: 4, start: '11:20', end: '12:10' },   // 第 4 節
  { period: 5, start: '12:20', end: '13:10' },   // 第 5 節（午餐）
  { period: 6, start: '13:20', end: '14:10' },   // 第 6 節
  { period: 7, start: '14:20', end: '15:10' },   // 第 7 節
  { period: 8, start: '15:30', end: '16:20' },   // 第 8 節
  { period: 9, start: '16:30', end: '17:20' },   // 第 9 節
  { period: 10, start: '17:30', end: '18:20' },  // 第 10 節
  { period: 11, start: '18:25', end: '19:15' },  // 第 A 節
  { period: 12, start: '19:20', end: '20:10' },  // 第 B 節
  { period: 13, start: '20:15', end: '21:05' },  // 第 C 節
  { period: 14, start: '21:10', end: '22:00' },  // 第 D 節
];

function getCurrentPeriod(): number | null {
  // TODO: 測試用 - 強制返回第 3 節，測試完成後請移除此行
  // return 3; // 第 3 節 (10:20-11:10)
  
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  for (const periodInfo of PERIOD_TIMES) {
    if (currentTime >= periodInfo.start && currentTime <= periodInfo.end) {
      return periodInfo.period;
    }
  }
  return null;
}

function getCurrentDayOfWeek(): number {
  // TODO: 測試用 - 強制返回週一，測試完成後請移除此行
  // return 0; // 0=週一
  
  const now = new Date();
  const day = now.getDay();
  // 轉換為 0=週一, 4=週五 的格式
  return day === 0 ? 6 : day - 1;
}

// 取得用戶當前狀態
export async function GET(request: Request) {
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

    const url = new URL(request.url);
    const targetUserId = url.searchParams.get('userId') || payload.userId;

    if (!ObjectId.isValid(targetUserId)) {
      return NextResponse.json(
        { message: '無效的用戶 ID' },
        { status: 400 }
      );
    }

    // 先檢查是否有自定義狀態
    const user = await UserModel.findById(targetUserId);
    if (user?.customStatus) {
      return NextResponse.json({
        status: 'custom',
        customStatus: user.customStatus,
        location: null,
        courseName: null,
        message: user.customStatus,
      });
    }

    // 取得用戶的預設課表
    const schedules = await ScheduleModel.findByUser(targetUserId);
    const defaultSchedule = schedules.find(s => s.isDefault) || schedules[0];

    if (!defaultSchedule) {
      return NextResponse.json({
        status: 'no class',
        location: null,
        courseName: null,
        message: '無課表資料',
      });
    }

    const scheduleId = defaultSchedule._id instanceof ObjectId 
      ? defaultSchedule._id 
      : new ObjectId(String(defaultSchedule._id));

    // 取得課表項目
    const items = await ScheduleItemModel.findBySchedule(scheduleId);

    if (items.length === 0) {
      return NextResponse.json({
        status: 'no class',
        location: null,
        courseName: null,
        message: '課表為空',
      });
    }

    // 取得當前時間和星期
    const currentPeriod = getCurrentPeriod();
    const currentDayOfWeek = getCurrentDayOfWeek();

    // 如果是週末
    if (currentDayOfWeek > 4) {
      return NextResponse.json({
        status: 'no class',
        location: null,
        courseName: null,
        message: '週末',
      });
    }

    // 如果不在任何課程時間
    if (currentPeriod === null) {
      return NextResponse.json({
        status: 'no class',
        location: null,
        courseName: null,
        message: '不在上課時間',
      });
    }

    // 查找當前時段的課程
    const currentClass = items.find(
      item => 
        item.dayOfWeek === currentDayOfWeek &&
        currentPeriod >= item.periodStart &&
        currentPeriod <= item.periodEnd
    );

    if (currentClass) {
      return NextResponse.json({
        status: 'in class',
        location: currentClass.location || null,
        courseName: currentClass.courseName,
        message: currentClass.location 
          ? `@ ${currentClass.location}` 
          : `上課中：${currentClass.courseName}`,
      });
    }

    return NextResponse.json({
      status: 'no class',
      location: null,
      courseName: null,
      message: '目前沒課',
    });
  } catch (error: any) {
    console.error('取得用戶狀態錯誤:', error);
    return NextResponse.json(
      { message: '取得用戶狀態失敗' },
      { status: 500 }
    );
  }
}

// 批量取得多個用戶的狀態
export async function POST(request: Request) {
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

    const body = await request.json();
    const { userIds } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { message: '請提供用戶 ID 列表' },
        { status: 400 }
      );
    }

    // 限制一次最多查詢 50 個用戶
    const limitedUserIds = userIds.slice(0, 50);

    // 取得當前時間和星期
    const currentPeriod = getCurrentPeriod();
    const currentDayOfWeek = getCurrentDayOfWeek();

    const statuses: Record<string, { status: string; location: string | null; courseName: string | null }> = {};

    // 如果是週末或不在課程時間
    if (currentDayOfWeek > 4 || currentPeriod === null) {
      for (const userId of limitedUserIds) {
        statuses[userId] = {
          status: 'no class',
          location: null,
          courseName: null,
        };
      }
      return NextResponse.json({ statuses });
    }

    // 對每個用戶查詢狀態
    for (const userId of limitedUserIds) {
      if (!ObjectId.isValid(userId)) {
        statuses[userId] = {
          status: 'no class',
          location: null,
          courseName: null,
        };
        continue;
      }

      try {
        const schedules = await ScheduleModel.findByUser(userId);
        const defaultSchedule = schedules.find(s => s.isDefault) || schedules[0];

        if (!defaultSchedule) {
          statuses[userId] = {
            status: 'no class',
            location: null,
            courseName: null,
          };
          continue;
        }

        const scheduleId = defaultSchedule._id instanceof ObjectId 
          ? defaultSchedule._id 
          : new ObjectId(String(defaultSchedule._id));

        const items = await ScheduleItemModel.findBySchedule(scheduleId);

        const currentClass = items.find(
          item => 
            item.dayOfWeek === currentDayOfWeek &&
            currentPeriod >= item.periodStart &&
            currentPeriod <= item.periodEnd
        );

        if (currentClass) {
          statuses[userId] = {
            status: 'in class',
            location: currentClass.location || null,
            courseName: currentClass.courseName,
          };
        } else {
          statuses[userId] = {
            status: 'no class',
            location: null,
            courseName: null,
          };
        }
      } catch {
        statuses[userId] = {
          status: 'no class',
          location: null,
          courseName: null,
        };
      }
    }

    return NextResponse.json({ statuses });
  } catch (error: any) {
    console.error('批量取得用戶狀態錯誤:', error);
    return NextResponse.json(
      { message: '批量取得用戶狀態失敗' },
      { status: 500 }
    );
  }
}

