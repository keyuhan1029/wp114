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
    const queryId = typeof id === 'string' ? new ObjectId(id) : id;
    const queryUserId =
      typeof userId === 'string' ? new ObjectId(userId) : userId;

    const schedule = await db
      .collection<Schedule>(this.collectionName)
      .findOne({ _id: queryId, userId: queryUserId });

    return schedule;
  }

  static async findDefaultByUser(
    userId: string | ObjectId
  ): Promise<Schedule | null> {
    const db = await getDatabase();
    const queryUserId =
      typeof userId === 'string' ? new ObjectId(userId) : userId;

    // 確保只有一個默認課表
    await this.ensureSingleDefault(userId);

    const schedule = await db
      .collection<Schedule>(this.collectionName)
      .findOne({ userId: queryUserId, isDefault: true });

    // 如果沒有默認課表，返回第一個課表
    if (!schedule) {
      const firstSchedule = await db
        .collection<Schedule>(this.collectionName)
        .findOne({ userId: queryUserId });
      return firstSchedule || null;
    }

    return schedule;
  }

  /**
   * 確保用戶只有一個默認課表
   * 如果有多個默認課表，只保留最早創建的那個
   */
  static async ensureSingleDefault(
    userId: string | ObjectId
  ): Promise<void> {
    const db = await getDatabase();
    const queryUserId =
      typeof userId === 'string' ? new ObjectId(userId) : userId;

    const defaultSchedules = await db
      .collection<Schedule>(this.collectionName)
      .find({ userId: queryUserId, isDefault: true })
      .sort({ createdAt: 1 })
      .toArray();

    // 如果有多個默認課表，只保留第一個（最早創建的）
    if (defaultSchedules.length > 1) {
      const keepId = defaultSchedules[0]._id;
      const idsToUpdate = defaultSchedules
        .slice(1)
        .map((s) => s._id)
        .filter((id) => id && id.toString() !== keepId?.toString());

      if (idsToUpdate.length > 0) {
        await db
          .collection<Schedule>(this.collectionName)
          .updateMany(
            { _id: { $in: idsToUpdate } },
            { $set: { isDefault: false } }
          );
      }
    }
  }

  static async create(
    data: Omit<Schedule, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<Schedule> {
    const db = await getDatabase();

    const userObjectId =
      typeof data.userId === 'string' ? new ObjectId(data.userId) : data.userId;

    // 檢查是否已有相同名稱的課表
    const existingSchedule = await db
      .collection<Schedule>(this.collectionName)
      .findOne({
        userId: userObjectId,
        name: data.name.trim(),
      });

    if (existingSchedule) {
      throw new Error('已存在相同名稱的課表');
    }

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
          { userId: userObjectId },
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

    const queryId = typeof id === 'string' ? new ObjectId(id) : id;
    const queryUserId =
      typeof userId === 'string' ? new ObjectId(userId) : userId;

    // 如果要更新名稱，檢查是否已有相同名稱的課表（排除當前課表）
    if (data.name !== undefined) {
      const existingSchedule = await db
        .collection<Schedule>(this.collectionName)
        .findOne({
          userId: queryUserId,
          name: data.name.trim(),
          _id: { $ne: queryId },
        });

      if (existingSchedule) {
        throw new Error('已存在相同名稱的課表');
      }
    }

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

    // 如果更新了名稱，確保 trim
    if (updateData.name) {
      updateData.name = updateData.name.trim();
    }

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

    const queryId = typeof id === 'string' ? new ObjectId(id) : id;
    const queryUserId =
      typeof userId === 'string' ? new ObjectId(userId) : userId;

    const result = await db
      .collection<Schedule>(this.collectionName)
      .deleteOne({ _id: queryId, userId: queryUserId });

    return result.deletedCount === 1;
  }
}

