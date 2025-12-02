import { ObjectId } from 'mongodb';
import { getDatabase } from '../mongodb';

export interface PersonalEvent {
  _id?: string | ObjectId;
  userId: string | ObjectId;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  allDay?: boolean;
  source: 'manual' | 'ntu_imported';
  /**
   * 若此行程是由 NTU 官方行事曆匯入，紀錄對應的 NTU 事件 ID，
   * 以避免同一使用者重複匯入同一筆活動。
   */
  ntuEventId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PersonalEventQuery {
  from?: Date;
  to?: Date;
}

export class PersonalEventModel {
  static collectionName = 'personal_events';

  static async findByUser(
    userId: string | ObjectId,
    range?: PersonalEventQuery
  ): Promise<PersonalEvent[]> {
    const db = await getDatabase();
    const { ObjectId } = await import('mongodb');
    const queryUserId =
      typeof userId === 'string' ? new ObjectId(userId) : userId;

    const query: any = { userId: queryUserId };

    if (range?.from || range?.to) {
      query.startTime = {};
      if (range.from) {
        query.startTime.$gte = range.from;
      }
      if (range.to) {
        query.startTime.$lte = range.to;
      }
    }

    const events = await db
      .collection<PersonalEvent>(this.collectionName)
      .find(query)
      .sort({ startTime: 1 })
      .toArray();

    return events;
  }

  static async findById(
    id: string | ObjectId
  ): Promise<PersonalEvent | null> {
    const db = await getDatabase();
    const { ObjectId } = await import('mongodb');
    const queryId = typeof id === 'string' ? new ObjectId(id) : id;

    const event = await db
      .collection<PersonalEvent>(this.collectionName)
      .findOne({ _id: queryId });

    return event;
  }

  static async create(
    data: Omit<PersonalEvent, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<PersonalEvent> {
    const db = await getDatabase();
    const { ObjectId } = await import('mongodb');

    const userObjectId =
      typeof data.userId === 'string' ? new ObjectId(data.userId) : data.userId;

    const now = new Date();
    const newEvent: PersonalEvent = {
      ...data,
      userId: userObjectId,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection<PersonalEvent>(this.collectionName)
      .insertOne(newEvent);

    return { ...newEvent, _id: result.insertedId };
  }

  static async update(
    id: string | ObjectId,
    userId: string | ObjectId,
    data: Partial<Omit<PersonalEvent, '_id' | 'userId' | 'createdAt'>>
  ): Promise<PersonalEvent | null> {
    const db = await getDatabase();
    const { ObjectId } = await import('mongodb');

    const queryId = typeof id === 'string' ? new ObjectId(id) : id;
    const queryUserId =
      typeof userId === 'string' ? new ObjectId(userId) : userId;

    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };

    const result = await db
      .collection<PersonalEvent>(this.collectionName)
      .findOneAndUpdate(
        { _id: queryId, userId: queryUserId },
        { $set: updateData },
        { returnDocument: 'after' }
      );

    return (result as PersonalEvent) || null;
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
      .collection<PersonalEvent>(this.collectionName)
      .deleteOne({ _id: queryId, userId: queryUserId });

    return result.deletedCount === 1;
  }
}


