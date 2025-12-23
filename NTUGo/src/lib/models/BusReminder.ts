import { getDatabase } from '../mongodb';
import { ObjectId } from 'mongodb';

export interface BusReminder {
  _id?: string | ObjectId;
  userId: ObjectId;              // 用户 ID
  stopUID: string;               // 站牌唯一识别码
  stopName: string;               // 站牌名称
  routeUID: string;               // 路线唯一识别码
  routeName: string;              // 路线名称
  direction: number;              // 去返程 (0: 去程, 1: 返程)
  targetArrivalTime: Date;        // 目标到站时间（预计到站时间）
  reminderTime: Date;             // 提醒时间（到站前5分钟）
  isActive: boolean;              // 是否激活
  isNotified: boolean;            // 是否已发送通知
  createdAt: Date;
  updatedAt: Date;
}

export class BusReminderModel {
  static collectionName = 'busReminders';

  // 创建提醒
  static async create(reminderData: {
    userId: string | ObjectId;
    stopUID: string;
    stopName: string;
    routeUID: string;
    routeName: string;
    direction: number;
    targetArrivalTime: Date;
  }): Promise<BusReminder> {
    const db = await getDatabase();
    const now = new Date();

    const userIdObj = typeof reminderData.userId === 'string' 
      ? new ObjectId(reminderData.userId) 
      : reminderData.userId;

    // 计算提醒时间（到站前5分钟）
    const reminderTime = new Date(reminderData.targetArrivalTime.getTime() - 5 * 60 * 1000);

    const reminder: Omit<BusReminder, '_id'> = {
      userId: userIdObj,
      stopUID: reminderData.stopUID,
      stopName: reminderData.stopName,
      routeUID: reminderData.routeUID,
      routeName: reminderData.routeName,
      direction: reminderData.direction,
      targetArrivalTime: reminderData.targetArrivalTime,
      reminderTime: reminderTime,
      isActive: true,
      isNotified: false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<BusReminder>(this.collectionName).insertOne(reminder as BusReminder);
    return { ...reminder, _id: result.insertedId } as BusReminder;
  }

  // 根据用户获取所有提醒
  static async findByUser(userId: string | ObjectId): Promise<BusReminder[]> {
    const db = await getDatabase();
    const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const reminders = await db.collection<BusReminder>(this.collectionName)
      .find({ userId: userIdObj })
      .sort({ reminderTime: 1 })
      .toArray();

    return reminders;
  }

  // 获取需要发送通知的提醒（提醒时间已到且未通知）
  static async findDueReminders(): Promise<BusReminder[]> {
    const db = await getDatabase();
    const now = new Date();

    // 查詢所有激活且未通知的提醒
    const allReminders = await db.collection<BusReminder>(this.collectionName)
      .find({
        isActive: true,
        isNotified: false,
      })
      .toArray();

    // 手動過濾：確保 reminderTime 已到，且 targetArrivalTime 未到
    const dueReminders = allReminders.filter((reminder) => {
      const reminderTime = reminder.reminderTime instanceof Date 
        ? reminder.reminderTime 
        : new Date(reminder.reminderTime);
      const targetArrivalTime = reminder.targetArrivalTime instanceof Date 
        ? reminder.targetArrivalTime 
        : new Date(reminder.targetArrivalTime);
      
      const reminderTimePassed = now.getTime() >= reminderTime.getTime();
      const notYetArrived = now.getTime() < targetArrivalTime.getTime();
      
      return reminderTimePassed && notYetArrived;
    });

    return dueReminders;
  }

  // 标记提醒为已通知
  static async markAsNotified(reminderId: string | ObjectId): Promise<boolean> {
    const db = await getDatabase();
    const reminderIdObj = typeof reminderId === 'string' ? new ObjectId(reminderId) : reminderId;

    const result = await db.collection<BusReminder>(this.collectionName).updateOne(
      { _id: reminderIdObj },
      { 
        $set: { 
          isNotified: true,
          updatedAt: new Date(),
        } 
      }
    );

    return result.modifiedCount === 1;
  }

  // 删除提醒
  static async delete(reminderId: string | ObjectId, userId: string | ObjectId): Promise<boolean> {
    const db = await getDatabase();
    const reminderIdObj = typeof reminderId === 'string' ? new ObjectId(reminderId) : reminderId;
    const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const result = await db.collection<BusReminder>(this.collectionName).deleteOne({
      _id: reminderIdObj,
      userId: userIdObj,
    });

    return result.deletedCount === 1;
  }

  // 检查是否已存在相同的提醒
  static async exists(
    userId: string | ObjectId,
    stopUID: string,
    routeUID: string,
    direction: number
  ): Promise<boolean> {
    const db = await getDatabase();
    const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const count = await db.collection<BusReminder>(this.collectionName).countDocuments({
      userId: userIdObj,
      stopUID: stopUID,
      routeUID: routeUID,
      direction: direction,
      isActive: true,
    });

    return count > 0;
  }

  // 停用过期提醒
  static async deactivateExpiredReminders(): Promise<number> {
    const db = await getDatabase();
    const now = new Date();

    const result = await db.collection<BusReminder>(this.collectionName).updateMany(
      {
        isActive: true,
        targetArrivalTime: { $lt: now },
      },
      {
        $set: {
          isActive: false,
          updatedAt: now,
        },
      }
    );

    return result.modifiedCount;
  }
}

