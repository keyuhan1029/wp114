import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { BusReminderModel } from '@/lib/models/BusReminder';
import { ObjectId } from 'mongodb';

/**
 * 测试API：查看用户的提醒详情
 * 用于调试提醒时间计算
 */
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

    const reminders = await BusReminderModel.findByUser(payload.userId);
    const now = new Date();

    const reminderDetails = reminders.map((reminder) => {
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

      return {
        _id: reminder._id instanceof ObjectId ? reminder._id.toString() : reminder._id,
        routeName: reminder.routeName,
        stopName: reminder.stopName,
        reminderTime: reminderTime.toISOString(),
        targetArrivalTime: targetArrivalTime.toISOString(),
        now: now.toISOString(),
        reminderTimePassed,
        notYetArrived,
        estimatedMinutes,
        isActive: reminder.isActive,
        isNotified: reminder.isNotified,
        shouldNotify: reminderTimePassed && notYetArrived && reminder.isActive && !reminder.isNotified,
      };
    });

    return NextResponse.json({
      success: true,
      reminders: reminderDetails,
      now: now.toISOString(),
    });
  } catch (error: any) {
    console.error('获取提醒详情错误:', error);
    return NextResponse.json(
      { message: '获取提醒详情失败', error: error.message },
      { status: 500 }
    );
  }
}

