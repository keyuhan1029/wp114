import { getDatabase } from '../mongodb';
import { ObjectId } from 'mongodb';
import type { AnnouncementCategory } from './Announcement';

export interface AnnouncementSubscription {
  _id?: string | ObjectId;
  userId: ObjectId;              // 用户ID
  categories: AnnouncementCategory[]; // 订阅的公告类型数组
  createdAt: Date;
  updatedAt: Date;
}

export class AnnouncementSubscriptionModel {
  static collectionName = 'announcementSubscriptions';

  // 创建或更新订阅设置
  static async createOrUpdate(
    userId: string | ObjectId,
    categories: AnnouncementCategory[]
  ): Promise<AnnouncementSubscription> {
    const db = await getDatabase();
    const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const now = new Date();

    const subscription: Omit<AnnouncementSubscription, '_id'> = {
      userId: userIdObj,
      categories,
      createdAt: now,
      updatedAt: now,
    };

    // 使用 upsert 操作
    const result = await db.collection<AnnouncementSubscription>(this.collectionName).findOneAndUpdate(
      { userId: userIdObj },
      {
        $set: {
          categories,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
      }
    );

    return result as AnnouncementSubscription;
  }

  // 根据用户查找订阅设置
  static async findByUser(userId: string | ObjectId): Promise<AnnouncementSubscription | null> {
    const db = await getDatabase();
    const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const subscription = await db.collection<AnnouncementSubscription>(this.collectionName)
      .findOne({ userId: userIdObj });
    return subscription;
  }

  // 根据分类查找订阅用户
  static async findUsersByCategory(category: AnnouncementCategory): Promise<ObjectId[]> {
    const db = await getDatabase();
    const subscriptions = await db.collection<AnnouncementSubscription>(this.collectionName)
      .find({ categories: category })
      .toArray();
    return subscriptions.map(sub => sub.userId);
  }

  // 删除订阅设置
  static async delete(userId: string | ObjectId): Promise<boolean> {
    const db = await getDatabase();
    const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const result = await db.collection<AnnouncementSubscription>(this.collectionName).deleteOne({
      userId: userIdObj,
    });
    return result.deletedCount === 1;
  }
}

