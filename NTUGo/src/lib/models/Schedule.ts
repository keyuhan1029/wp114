import { ObjectId } from 'mongodb';
import { getDatabase } from '../mongodb';

export interface Schedule {
  _id?: string | ObjectId;
  userId: string | ObjectId;
  name: string;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ScheduleModel {
  static collectionName = 'schedules';

  static async findByUser(
    userId: string | ObjectId
  ): Promise<Schedule[]> {
    const db = await getDatabase();
    const { ObjectId } = await import('mongodb');
    const queryUserId =
      typeof userId === 'string' ? new ObjectId(userId) : userId;

    const schedules = await db
      .collection<Schedule>(this.collectionName)
      .find({ userId: queryUserId })
      .sort({ isDefault: -1, createdAt: 1 })
      .toArray();

    return schedules;
  }

  static async findById(
    id: string | ObjectId
  ): Promise<Schedule | null> {
    const db = await getDatabase();
    const { ObjectId } = await import('mongodb');
    const queryId = typeof id === 'string' ? new ObjectId(id) : id;

    const schedule = await db
      .collection<Schedule>(this.collectionName)
      .findOne({ _id: queryId });

    return schedule;
  }

  static async findByIdAndUser(
    id: string | ObjectId,
    userId: string | ObjectId
  ): Promise<Schedule | null> {
    const db = await getDatabase();
    const { ObjectId } = await import('mongodb');
    const queryId = typeof id === 'string' ? new ObjectId(id) : id;
    const queryUserId =
      typeof userId === 'string' ? new ObjectId(userId) : userId;

    const schedule = await db
      .collection<Schedule>(this.collectionName)
      .findOne({ _id: queryId, userId: queryUserId });

    return schedule;
  }

  static async create(
    data: Omit<Schedule, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<Schedule> {
    const db = await getDatabase();
    const { ObjectId } = await import('mongodb');

    const userObjectId =
      typeof data.userId === 'string' ? new ObjectId(data.userId) : data.userId;

    const now = new Date();
    const newSchedule: Schedule = {
      ...data,
      userId: userObjectId,
      isDefault: data.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    };

    // 如果這是第一個課表或設為默認，將其他課表設為非默認
    if (newSchedule.isDefault) {
      await db
        .collection<Schedule>(this.collectionName)
        .updateMany(
          { userId: userObjectId, _id: { $ne: null } },
          { $set: { isDefault: false } }
        );
    } else {
      // 檢查是否已有課表，如果沒有則設為默認
      const existingCount = await db
        .collection<Schedule>(this.collectionName)
        .countDocuments({ userId: userObjectId });
      if (existingCount === 0) {
        newSchedule.isDefault = true;
      }
    }

    const result = await db
      .collection<Schedule>(this.collectionName)
      .insertOne(newSchedule);

    return { ...newSchedule, _id: result.insertedId };
  }

  static async update(
    id: string | ObjectId,
    userId: string | ObjectId,
    data: Partial<Omit<Schedule, '_id' | 'userId' | 'createdAt'>>
  ): Promise<Schedule | null> {
    const db = await getDatabase();
    const { ObjectId } = await import('mongodb');

    const queryId = typeof id === 'string' ? new ObjectId(id) : id;
    const queryUserId =
      typeof userId === 'string' ? new ObjectId(userId) : userId;

    // 如果設為默認，將其他課表設為非默認
    if (data.isDefault === true) {
      await db
        .collection<Schedule>(this.collectionName)
        .updateMany(
          { userId: queryUserId, _id: { $ne: queryId } },
          { $set: { isDefault: false } }
        );
    }

    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    const result = await db
      .collection<Schedule>(this.collectionName)
      .findOneAndUpdate(
        { _id: queryId, userId: queryUserId },
        { $set: updateData },
        { returnDocument: 'after' }
      );

    return (result as Schedule) || null;
  }

  static async delete(
    id: string | ObjectId,
    userId: string | ObjectId
  ): Promise<boolean> {
    const db = await getDatabase();
    const { ObjectId } = await import('mongodb');

    const queryId = typeof id === 'string' ? new ObjectId(id) : id;
    const queryUserId =
      typeof userId === 'string' ? new ObjectId(userId) : userId;

    const result = await db
      .collection<Schedule>(this.collectionName)
      .deleteOne({ _id: queryId, userId: queryUserId });

    return result.deletedCount === 1;
  }
}

