import { ObjectId } from 'mongodb';
import { getDatabase } from '../mongodb';

export type NotificationType = 'friend_request' | 'friend_accepted' | 'new_message' | 'group_invite' | 'schedule_share' | 'bus_arrival';

export interface Notification {
  _id?: string | ObjectId;
    userId: ObjectId;           // 接收通知的用戶
    type: NotificationType;
    title: string;
    content?: string;           // 改為可選，因為有些通知使用 message 欄位
    message?: string;           // 通知訊息
    relatedId?: string;         // 相關資源 ID（如 friendshipId, roomId, shareId）
    relatedType?: string;       // 相關資源類型（如 'friendship', 'schedule_share'）
    senderId?: ObjectId;        // 發送者 ID（用於顯示頭像）
    isRead: boolean;
    createdAt: Date;
}

export interface NotificationWithSender extends Notification {
  sender?: {
    id: string;
    name?: string;
    avatar?: string;
  };
}

export class NotificationModel {
  static collectionName = 'notifications';

  // 建立通知
  static async create(data: {
    userId: string | ObjectId;
    type: NotificationType;
    title: string;
    content?: string;
    message?: string;
    relatedId?: string;
    relatedType?: string;
    senderId?: string | ObjectId;
  }): Promise<Notification> {
    const db = await getDatabase();

    const userObjId = typeof data.userId === 'string' ? new ObjectId(data.userId) : data.userId;
    const senderObjId = data.senderId 
      ? (typeof data.senderId === 'string' ? new ObjectId(data.senderId) : data.senderId)
      : undefined;

    const notification: Notification = {
      userId: userObjId,
      type: data.type,
      title: data.title,
      content: data.content,
      message: data.message,
      relatedId: data.relatedId,
      relatedType: data.relatedType,
      senderId: senderObjId,
      isRead: false,
      createdAt: new Date(),
    };

    const result = await db.collection<Notification>(this.collectionName).insertOne(notification);
    return { ...notification, _id: result.insertedId };
  }

  // 取得用戶的通知列表
  static async findByUser(
    userId: string | ObjectId,
    limit: number = 50,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    const db = await getDatabase();

    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const query: any = { userId: userObjId };
    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await db.collection<Notification>(this.collectionName)
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return notifications;
  }

  // 取得未讀通知數量
  static async getUnreadCount(userId: string | ObjectId): Promise<number> {
    const db = await getDatabase();

    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const count = await db.collection<Notification>(this.collectionName).countDocuments({
      userId: userObjId,
      isRead: false,
    });

    return count;
  }

  // 標記單一通知為已讀
  static async markAsRead(
    notificationId: string | ObjectId,
    userId: string | ObjectId
  ): Promise<boolean> {
    const db = await getDatabase();

    const notifObjId = typeof notificationId === 'string' ? new ObjectId(notificationId) : notificationId;
    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const result = await db.collection<Notification>(this.collectionName).updateOne(
      { _id: notifObjId, userId: userObjId },
      { $set: { isRead: true } }
    );

    return result.modifiedCount === 1;
  }

  // 標記所有通知為已讀
  static async markAllAsRead(userId: string | ObjectId): Promise<number> {
    const db = await getDatabase();

    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const result = await db.collection<Notification>(this.collectionName).updateMany(
      { userId: userObjId, isRead: false },
      { $set: { isRead: true } }
    );

    return result.modifiedCount;
  }

  // 刪除通知
  static async delete(
    notificationId: string | ObjectId,
    userId: string | ObjectId
  ): Promise<boolean> {
    const db = await getDatabase();

    const notifObjId = typeof notificationId === 'string' ? new ObjectId(notificationId) : notificationId;
    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const result = await db.collection<Notification>(this.collectionName).deleteOne({
      _id: notifObjId,
      userId: userObjId,
    });

    return result.deletedCount === 1;
  }

  // 刪除舊通知（清理）
  static async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const db = await getDatabase();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await db.collection<Notification>(this.collectionName).deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true,
    });

    return result.deletedCount;
  }
}

