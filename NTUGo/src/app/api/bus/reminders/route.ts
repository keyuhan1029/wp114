import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { BusReminderModel } from '@/lib/models/BusReminder';
import { ObjectId } from 'mongodb';

// 获取用户的所有公车提醒
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

    return NextResponse.json({
      success: true,
      reminders: reminders.map((reminder) => ({
        _id: reminder._id instanceof ObjectId ? reminder._id.toString() : reminder._id,
        stopUID: reminder.stopUID,
        stopName: reminder.stopName,
        routeUID: reminder.routeUID,
        routeName: reminder.routeName,
        direction: reminder.direction,
        targetArrivalTime: reminder.targetArrivalTime instanceof Date 
          ? reminder.targetArrivalTime.toISOString() 
          : reminder.targetArrivalTime,
        reminderTime: reminder.reminderTime instanceof Date 
          ? reminder.reminderTime.toISOString() 
          : reminder.reminderTime,
        isActive: reminder.isActive,
        isNotified: reminder.isNotified,
        createdAt: reminder.createdAt instanceof Date 
          ? reminder.createdAt.toISOString() 
          : reminder.createdAt,
        updatedAt: reminder.updatedAt instanceof Date 
          ? reminder.updatedAt.toISOString() 
          : reminder.updatedAt,
      })),
    });
  } catch (error: any) {
    console.error('获取公车提醒列表错误:', error);
    return NextResponse.json(
      { message: '获取公车提醒列表失败', error: error.message },
      { status: 500 }
    );
  }
}

// 创建公车提醒
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

    const { stopUID, stopName, routeUID, routeName, direction, estimateTime } = await request.json();

    if (!stopUID || !stopName || !routeUID || !routeName || direction === undefined || !estimateTime) {
      return NextResponse.json(
        { message: '請提供所有必要欄位' },
        { status: 400 }
      );
    }

    // estimateTime 是秒数，转换为 Date
    const now = new Date();
    const targetArrivalTime = new Date(now.getTime() + estimateTime * 1000);

    // 检查是否已存在相同的提醒
    const exists = await BusReminderModel.exists(
      payload.userId,
      stopUID,
      routeUID,
      direction
    );

    if (exists) {
      return NextResponse.json(
        { message: '您已經為此路線設置了提醒' },
        { status: 409 }
      );
    }

    // 创建提醒
    const reminder = await BusReminderModel.create({
      userId: payload.userId,
      stopUID,
      stopName,
      routeUID,
      routeName,
      direction,
      targetArrivalTime,
    });

    return NextResponse.json({
      success: true,
      reminder: {
        _id: reminder._id instanceof ObjectId ? reminder._id.toString() : reminder._id,
        stopUID: reminder.stopUID,
        stopName: reminder.stopName,
        routeUID: reminder.routeUID,
        routeName: reminder.routeName,
        direction: reminder.direction,
        targetArrivalTime: reminder.targetArrivalTime instanceof Date 
          ? reminder.targetArrivalTime.toISOString() 
          : reminder.targetArrivalTime,
        reminderTime: reminder.reminderTime instanceof Date 
          ? reminder.reminderTime.toISOString() 
          : reminder.reminderTime,
        isActive: reminder.isActive,
        isNotified: reminder.isNotified,
        createdAt: reminder.createdAt instanceof Date 
          ? reminder.createdAt.toISOString() 
          : reminder.createdAt,
        updatedAt: reminder.updatedAt instanceof Date 
          ? reminder.updatedAt.toISOString() 
          : reminder.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('创建公车提醒错误:', error);
    return NextResponse.json(
      { message: '创建公车提醒失败', error: error.message },
      { status: 500 }
    );
  }
}

