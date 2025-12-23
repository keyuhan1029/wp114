import { NextResponse } from 'next/server';
import { BusReminderModel } from '@/lib/models/BusReminder';
import { NotificationModel } from '@/lib/models/Notification';
import { triggerBusArrival } from '@/lib/pusher';
import { ObjectId } from 'mongodb';

/**
 * Vercel Cron Job 端点
 * 每分钟自动调用，检查并发送公车到站提醒
 * 
 * 配置方式：在 vercel.json 中添加
 * {
 *   "crons": [{
 *     "path": "/api/cron/bus-reminders",
 *     "schedule": "0 * * * * *"
 *   }]
 * }
 */
export async function GET(request: Request) {
  // Vercel Cron 会发送一个特殊的 header
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // 验证请求来源（可选，但推荐）
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { message: '未授權訪問' },
      { status: 401 }
    );
  }

  try {
    // 获取需要发送通知的提醒
    const dueReminders = await BusReminderModel.findDueReminders();

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
          continue;
        }
        
        // 如果已经到站了，标记为已通知并停用
        if (!notYetArrived) {
          await BusReminderModel.markAsNotified(reminder._id!);
          continue;
        }

        // 创建通知记录
        const notificationMessage = `${reminder.routeName}${reminder.direction === 0 ? '(去程)' : '(返程)'} 即將在 ${reminder.stopName} 到站，預計 ${estimatedMinutes} 分鐘後到達`;
        await NotificationModel.create({
          userId: userId,
          type: 'bus_arrival',
          title: '公車即將到站',
          content: notificationMessage,
          message: notificationMessage,
          relatedId: reminder._id instanceof ObjectId 
            ? reminder._id.toString() 
            : String(reminder._id),
          relatedType: 'bus_reminder',
        });

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
        } catch (pusherError: any) {
          console.error(`Pusher 推送失敗: userId=${userId}`, pusherError?.message || pusherError);
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

