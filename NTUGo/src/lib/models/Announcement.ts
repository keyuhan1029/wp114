import { getDatabase } from '../mongodb';
import { ObjectId } from 'mongodb';

export type AnnouncementCategory = '社團資訊' | '國際交流' | '社會服務' | '小福/鹿鳴堂' | '一般公告';

export interface Announcement {
  _id?: string | ObjectId;
  sourceId: string;              // 来源网站的唯一标识（用于去重）
  title: string;                // 公告标题
  content: string;               // 公告内容
  category: AnnouncementCategory; // 公告类型
  publishDate: Date;            // 发布日期
  sourceUrl: string;            // 来源链接
  isPinned: boolean;            // 是否置顶
  createdAt: Date;
  updatedAt: Date;
}

export class AnnouncementModel {
  static collectionName = 'announcements';

  // 创建公告
  static async create(announcementData: {
    sourceId: string;
    title: string;
    content: string;
    category: AnnouncementCategory;
    publishDate: Date;
    sourceUrl: string;
    isPinned?: boolean;
  }): Promise<Announcement> {
    const db = await getDatabase();
    const now = new Date();

    const announcement: Omit<Announcement, '_id'> = {
      sourceId: announcementData.sourceId,
      title: announcementData.title,
      content: announcementData.content,
      category: announcementData.category,
      publishDate: announcementData.publishDate,
      sourceUrl: announcementData.sourceUrl,
      isPinned: announcementData.isPinned || false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<Announcement>(this.collectionName).insertOne(announcement as Announcement);
    return { ...announcement, _id: result.insertedId } as Announcement;
  }

  // 根据 sourceId 查找公告（用于去重）
  static async findBySourceId(sourceId: string): Promise<Announcement | null> {
    const db = await getDatabase();
    const announcement = await db.collection<Announcement>(this.collectionName)
      .findOne({ sourceId });
    return announcement;
  }

  // 根据分类查找公告
  static async findByCategory(
    category: AnnouncementCategory,
    limit: number = 50,
    skip: number = 0
  ): Promise<Announcement[]> {
    const db = await getDatabase();
    const announcements = await db.collection<Announcement>(this.collectionName)
      .find({ category })
      .sort({ isPinned: -1, publishDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    return announcements;
  }

  // 查找最近的公告
  static async findRecent(
    limit: number = 50,
    skip: number = 0,
    categories?: AnnouncementCategory[]
  ): Promise<Announcement[]> {
    const db = await getDatabase();
    const query: any = {};
    if (categories && categories.length > 0) {
      query.category = { $in: categories };
    }
    
    const announcements = await db.collection<Announcement>(this.collectionName)
      .find(query)
      .sort({ isPinned: -1, publishDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    return announcements;
  }

  // 获取所有公告（分页）
  static async findAll(
    limit: number = 50,
    skip: number = 0,
    category?: AnnouncementCategory
  ): Promise<Announcement[]> {
    const db = await getDatabase();
    const query: any = {};
    if (category) {
      query.category = category;
    } else {
      // 如果沒有指定分類，排除「一般公告」類別（已移除）
      query.category = { $ne: '一般公告' };
    }
    
    const announcements = await db.collection<Announcement>(this.collectionName)
      .find(query)
      .sort({ isPinned: -1, publishDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    return announcements;
  }

  // 获取公告总数
  static async count(category?: AnnouncementCategory): Promise<number> {
    const db = await getDatabase();
    const query: any = {};
    if (category) {
      query.category = category;
    } else {
      // 如果沒有指定分類，排除「一般公告」類別（已移除）
      query.category = { $ne: '一般公告' };
    }
    return await db.collection<Announcement>(this.collectionName).countDocuments(query);
  }

  // 根据 ID 查找公告
  static async findById(announcementId: string | ObjectId): Promise<Announcement | null> {
    const db = await getDatabase();
    const id = typeof announcementId === 'string' ? new ObjectId(announcementId) : announcementId;
    const announcement = await db.collection<Announcement>(this.collectionName)
      .findOne({ _id: id });
    return announcement;
  }

  // 删除旧公告（清理）
  static async deleteOld(daysOld: number = 90): Promise<number> {
    const db = await getDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await db.collection<Announcement>(this.collectionName).deleteMany({
      createdAt: { $lt: cutoffDate },
      isPinned: false,
    });

    return result.deletedCount;
  }
}

