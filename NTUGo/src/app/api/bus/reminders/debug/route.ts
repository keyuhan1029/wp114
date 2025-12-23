import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * 調試 API：查看所有提醒的詳細狀態
 * 用於診斷提醒未觸發的問題
 */
export async function GET(request: Request) {
  try {
    const db = await getDatabase();
    const now = new Date();

    // 獲取所有提醒
    const allReminders = await db.collection('busReminders')
      .find({})
      .toArray();

    const reminderDetails = allReminders.map((reminder: any) => {
      const reminderTime = reminder.reminderTime instanceof Date 
        ? reminder.reminderTime 
        : new Date(reminder.reminderTime);
      const targetArrivalTime = reminder.targetArrivalTime instanceof Date 
        ? reminder.targetArrivalTime 
        : new Date(reminder.targetArrivalTime);
      
      const reminderTimePassed = now.getTime() >= reminderTime.getTime();
      const notYetArrived = now.getTime() < targetArrivalTime.getTime();
      const remainingMs = targetArrivalTime.getTime() - now.getTime();
      const estimatedMinutes = Math.floor(remainingMs / 60000);
      const minutesUntilReminder = Math.floor((reminderTime.getTime() - now.getTime()) / 60000);

      return {
        _id: reminder._id instanceof ObjectId ? reminder._id.toString() : reminder._id,
        userId: reminder.userId instanceof ObjectId ? reminder.userId.toString() : reminder.userId,
        routeName: reminder.routeName,
        stopName: reminder.stopName,
        routeUID: reminder.routeUID,
        direction: reminder.direction,
        reminderTime: reminderTime.toISOString(),
        targetArrivalTime: targetArrivalTime.toISOString(),
        now: now.toISOString(),
        reminderTimePassed,
        notYetArrived,
        estimatedMinutes,
        minutesUntilReminder,
        isActive: reminder.isActive,
        isNotified: reminder.isNotified,
        shouldNotify: reminderTimePassed && notYetArrived && reminder.isActive && !reminder.isNotified,
        createdAt: reminder.createdAt instanceof Date ? reminder.createdAt.toISOString() : reminder.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      now: now.toISOString(),
      totalReminders: allReminders.length,
      activeReminders: allReminders.filter((r: any) => r.isActive && !r.isNotified).length,
      dueReminders: reminderDetails.filter((r: any) => r.shouldNotify).length,
      reminders: reminderDetails,
    });
  } catch (error: any) {
    console.error('獲取提醒調試信息錯誤:', error);
    return NextResponse.json(
      { message: '獲取提醒調試信息失敗', error: error.message },
      { status: 500 }
    );
  }
}

