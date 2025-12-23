import { NextResponse } from 'next/server';
import { BusReminderModel } from '@/lib/models/BusReminder';
import { NotificationModel } from '@/lib/models/Notification';
import { triggerBusArrival } from '@/lib/pusher';
import { ObjectId } from 'mongodb';

/**
 * 检查并发送公车到站提醒
 * 这个 API 应该被定时任务调用（例如每30秒或每分钟）
 * 或者可以通过 cron job 调用
 */
export async function POST(request: Request) {
  try {
    // 可选：添加 API key 验证以防止未授权访问
    const authHeader = request.headers.get('authorization');
    const expectedKey = process.env.BUS_REMINDER_API_KEY;
    
    if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json(
        { message: '未授權訪問' },
        { status: 401 }
      );
    }

    // 获取需要发送通知的提醒
    const dueReminders = await BusReminderModel.findDueReminders();

    console.log(`[${new Date().toISOString()}] 检查提醒: 找到 ${dueReminders.length} 个到期的提醒`);

    if (dueReminders.length === 0) {
      return NextResponse.json({
        success: true,
        message: '沒有需要發送的通知',
        count: 0,
      });
    }

    const results = [];

    for (const reminder of dueReminders) {
      try {
        const userId = reminder.userId instanceof ObjectId 
          ? reminder.userId.toString() 
          : String(reminder.userId);

        // 计算剩余分钟数
        const now = new Date();
        const remainingMs = reminder.targetArrivalTime.getTime() - now.getTime();
        const estimatedMinutes = Math.max(0, Math.floor(remainingMs / 60000));

        // 检查提醒时间是否已到（到站前5分钟）
        const reminderTimePassed = now.getTime() >= reminder.reminderTime.getTime();
        const notYetArrived = now.getTime() < reminder.targetArrivalTime.getTime();
        
        // 如果提醒时间还没到，跳过
        if (!reminderTimePassed) {
          console.log(`提醒 ${reminder._id} 时间未到，跳过 (提醒时间: ${reminder.reminderTime.toISOString()}, 当前时间: ${now.toISOString()})`);
          continue;
        }
        
        // 如果已经到站了，标记为已通知并停用
        if (!notYetArrived) {
          console.log(`提醒 ${reminder._id} 已过期（公车已到站），标记为已通知`);
          await BusReminderModel.markAsNotified(reminder._id!);
          continue;
        }
        
        console.log(`发送提醒通知: ${reminder.routeName} 在 ${reminder.stopName}, 预计 ${estimatedMinutes} 分钟后到达`);

        // 创建通知记录
        const notificationMessage = `${reminder.routeName}${reminder.direction === 0 ? '(去程)' : '(返程)'} 即將在 ${reminder.stopName} 到站，預計 ${estimatedMinutes} 分鐘後到達`;
        const notification = await NotificationModel.create({
          userId: userId,
          type: 'bus_arrival',
          title: '公車即將到站',
          content: notificationMessage, // 使用 content 字段以确保兼容性
          message: notificationMessage, // 同时设置 message 字段
          relatedId: reminder._id instanceof ObjectId 
            ? reminder._id.toString() 
            : String(reminder._id),
          relatedType: 'bus_reminder',
        });

        console.log(`通知已创建: ${notification._id}`);

        // 通过 Pusher 实时推送
        try {
          await triggerBusArrival(userId, {
            reminderId: reminder._id instanceof ObjectId 
              ? reminder._id.toString() 
              : String(reminder._id),
            stopName: reminder.stopName,
            routeName: reminder.routeName,
            direction: reminder.direction,
            estimatedMinutes: estimatedMinutes,
          });
          console.log(`Pusher 推送成功: userId=${userId}`);
        } catch (pusherError) {
          console.warn('Pusher 推送失敗:', pusherError);
          // Pusher 错误不影响通知记录
        }

        // 标记为已通知
        await BusReminderModel.markAsNotified(reminder._id!);

        results.push({
          reminderId: reminder._id instanceof ObjectId 
            ? reminder._id.toString() 
            : String(reminder._id),
          success: true,
        });
      } catch (error: any) {
        console.error(`處理提醒 ${reminder._id} 失敗:`, error);
        results.push({
          reminderId: reminder._id instanceof ObjectId 
            ? reminder._id.toString() 
            : String(reminder._id),
          success: false,
          error: error.message,
        });
      }
    }

    // 停用过期提醒
    await BusReminderModel.deactivateExpiredReminders();

    return NextResponse.json({
      success: true,
      message: `已處理 ${dueReminders.length} 個提醒`,
      count: dueReminders.length,
      results: results,
    });
  } catch (error: any) {
    console.error('檢查公車提醒錯誤:', error);
    return NextResponse.json(
      { message: '檢查公車提醒失敗', error: error.message },
      { status: 500 }
    );
  }
}
