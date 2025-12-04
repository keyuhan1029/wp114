import { ObjectId } from 'mongodb';
import { getDatabase } from '../mongodb';

export interface ScheduleItem {
  _id?: string | ObjectId;
  scheduleId: string | ObjectId;
  courseName: string;
  location?: string;
  teacher?: string;
  dayOfWeek: number; // 0=週一, 4=週五
  periodStart: number; // 開始節次 1-10
  periodEnd: number; // 結束節次 1-10
  color: string; // hex顏色
  createdAt: Date;
  updatedAt: Date;
}

export class ScheduleItemModel {
  static collectionName = 'schedule_items';

  static async findBySchedule(
    scheduleId: string | ObjectId
  ): Promise<ScheduleItem[]> {
    const db = await getDatabase();
    const { ObjectId } = await import('mongodb');
    const queryScheduleId =
      typeof scheduleId === 'string' ? new ObjectId(scheduleId) : scheduleId;

    const items = await db
      .collection<ScheduleItem>(this.collectionName)
      .find({ scheduleId: queryScheduleId })
      .sort({ dayOfWeek: 1, periodStart: 1 })
      .toArray();

    return items;
  }

  static async findById(
    id: string | ObjectId
  ): Promise<ScheduleItem | null> {
    const db = await getDatabase();
    const { ObjectId } = await import('mongodb');
    const queryId = typeof id === 'string' ? new ObjectId(id) : id;

    const item = await db
      .collection<ScheduleItem>(this.collectionName)
      .findOne({ _id: queryId });

    return item;
  }

  static async findByIdAndSchedule(
    id: string | ObjectId,
    scheduleId: string | ObjectId
  ): Promise<ScheduleItem | null> {
    const db = await getDatabase();
    const { ObjectId } = await import('mongodb');
    const queryId = typeof id === 'string' ? new ObjectId(id) : id;
    const queryScheduleId =
      typeof scheduleId === 'string' ? new ObjectId(scheduleId) : scheduleId;

    const item = await db
      .collection<ScheduleItem>(this.collectionName)
      .findOne({ _id: queryId, scheduleId: queryScheduleId });

    return item;
  }

  static async create(
    data: Omit<ScheduleItem, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<ScheduleItem> {
    const db = await getDatabase();
    const { ObjectId } = await import('mongodb');

    const scheduleObjectId =
      typeof data.scheduleId === 'string'
        ? new ObjectId(data.scheduleId)
        : data.scheduleId;

    const now = new Date();
    const newItem: ScheduleItem = {
      ...data,
      scheduleId: scheduleObjectId,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection<ScheduleItem>(this.collectionName)
      .insertOne(newItem);

    return { ...newItem, _id: result.insertedId };
  }

  static async update(
    id: string | ObjectId,
    scheduleId: string | ObjectId,
    data: Partial<Omit<ScheduleItem, '_id' | 'scheduleId' | 'createdAt'>>
  ): Promise<ScheduleItem | null> {
    const db = await getDatabase();
    const { ObjectId } = await import('mongodb');

    const queryId = typeof id === 'string' ? new ObjectId(id) : id;
    const queryScheduleId =
      typeof scheduleId === 'string' ? new ObjectId(scheduleId) : scheduleId;

    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    const result = await db
      .collection<ScheduleItem>(this.collectionName)
      .findOneAndUpdate(
        { _id: queryId, scheduleId: queryScheduleId },
        { $set: updateData },
        { returnDocument: 'after' }
      );

    return (result as ScheduleItem) || null;
  }

  static async delete(
    id: string | ObjectId,
    scheduleId: string | ObjectId
  ): Promise<boolean> {
    const db = await getDatabase();
    const { ObjectId } = await import('mongodb');

    const queryId = typeof id === 'string' ? new ObjectId(id) : id;
    const queryScheduleId =
      typeof scheduleId === 'string' ? new ObjectId(scheduleId) : scheduleId;

    const result = await db
      .collection<ScheduleItem>(this.collectionName)
      .deleteOne({ _id: queryId, scheduleId: queryScheduleId });

    return result.deletedCount === 1;
  }

  static async deleteBySchedule(
    scheduleId: string | ObjectId
  ): Promise<number> {
    const db = await getDatabase();
    const { ObjectId } = await import('mongodb');
    const queryScheduleId =
      typeof scheduleId === 'string' ? new ObjectId(scheduleId) : scheduleId;

    const result = await db
      .collection<ScheduleItem>(this.collectionName)
      .deleteMany({ scheduleId: queryScheduleId });

    return result.deletedCount;
  }
}

