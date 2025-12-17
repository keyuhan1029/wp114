import { ObjectId } from 'mongodb';
import { getDatabase } from '../mongodb';

export type ScheduleShareStatus = 'pending' | 'accepted' | 'rejected';

export interface ScheduleShare {
  _id?: string | ObjectId;
  senderId: ObjectId; // 發送分享請求的用戶
  receiverId: ObjectId; // 接收分享請求的用戶
  scheduleId?: ObjectId; // 發送者要分享的課表 ID（如果未指定，則分享默認課表）
  receiverScheduleId?: ObjectId; // 接收者要分享的課表 ID（在接受請求時選擇）
  status: ScheduleShareStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class ScheduleShareModel {
  static collectionName = 'schedule_shares';

  // 發送課表分享請求
  static async sendRequest(
    senderId: string | ObjectId,
    receiverId: string | ObjectId,
    scheduleId?: string | ObjectId
  ): Promise<ScheduleShare> {
    const db = await getDatabase();

    const senderObjId = typeof senderId === 'string' ? new ObjectId(senderId) : senderId;
    const receiverObjId = typeof receiverId === 'string' ? new ObjectId(receiverId) : receiverId;
    const scheduleObjId = scheduleId 
      ? (typeof scheduleId === 'string' ? new ObjectId(scheduleId) : scheduleId)
      : undefined;

    // 檢查是否已存在相同課表的分享關係
    if (scheduleObjId) {
      const existing = await db.collection<ScheduleShare>(this.collectionName).findOne({
        senderId: senderObjId,
        receiverId: receiverObjId,
        scheduleId: scheduleObjId,
      });

      if (existing) {
        if (existing.status === 'pending') {
          throw new Error('已發送課表分享請求，等待對方回應');
        }
        if (existing.status === 'accepted') {
          // 如果已接受的分享是相同的課表，返回現有記錄（前端會顯示已分享提示）
          return existing;
        }
      }
    } else {
      // 如果沒有指定 scheduleId，檢查是否有未指定 scheduleId 的分享
      const existing = await db.collection<ScheduleShare>(this.collectionName).findOne({
        senderId: senderObjId,
        receiverId: receiverObjId,
        $or: [
          { scheduleId: { $exists: false } },
          { scheduleId: { $eq: null } },
        ],
      } as any);

      if (existing) {
        if (existing.status === 'pending') {
          throw new Error('已發送課表分享請求，等待對方回應');
        }
        if (existing.status === 'accepted') {
          return existing;
        }
      }
    }

    const share: ScheduleShare = {
      senderId: senderObjId,
      receiverId: receiverObjId,
      scheduleId: scheduleObjId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 檢查是否有 rejected 的記錄需要更新
    let rejectedExisting: ScheduleShare | null = null;
    if (scheduleObjId) {
      rejectedExisting = await db.collection<ScheduleShare>(this.collectionName).findOne({
        senderId: senderObjId,
        receiverId: receiverObjId,
        scheduleId: scheduleObjId,
        status: 'rejected',
      });
    } else {
      rejectedExisting = await db.collection<ScheduleShare>(this.collectionName).findOne({
        senderId: senderObjId,
        receiverId: receiverObjId,
        $or: [
          { scheduleId: { $exists: false } },
          { scheduleId: { $eq: null } },
        ],
        status: 'rejected',
      } as any);
    }

    if (rejectedExisting) {
      // 更新現有的 rejected 記錄
      const result = await db.collection<ScheduleShare>(this.collectionName).findOneAndUpdate(
        { _id: rejectedExisting._id },
        {
          $set: {
            status: 'pending',
            scheduleId: scheduleObjId,
            updatedAt: new Date(),
          },
        },
        { returnDocument: 'after' }
      );
      return (result as ScheduleShare) || share;
    }

    const result = await db.collection<ScheduleShare>(this.collectionName).insertOne(share);
    return { ...share, _id: result.insertedId };
  }

  // 接受課表分享請求
  static async acceptRequest(
    shareId: string | ObjectId,
    receiverId: string | ObjectId,
    receiverScheduleId?: string | ObjectId
  ): Promise<ScheduleShare> {
    const db = await getDatabase();

    let shareObjId: ObjectId;
    try {
      shareObjId = typeof shareId === 'string' ? new ObjectId(shareId) : shareId;
    } catch (error) {
      throw new Error(`無效的分享 ID 格式: ${shareId}`);
    }

    const receiverObjId = typeof receiverId === 'string' ? new ObjectId(receiverId) : receiverId;
    const receiverScheduleObjId = receiverScheduleId 
      ? (typeof receiverScheduleId === 'string' ? new ObjectId(receiverScheduleId) : receiverScheduleId)
      : undefined;

    // 先查找分享記錄，不限制 receiverId，以便調試
    const share = await db.collection<ScheduleShare>(this.collectionName).findOne({
      _id: shareObjId,
    });

    if (!share) {
      throw new Error(`找不到分享請求 (ID: ${shareId})`);
    }

    // 檢查是否是接收者
    if (!share.receiverId.equals(receiverObjId)) {
      throw new Error('您不是此分享請求的接收者');
    }

    if (share.status !== 'pending') {
      throw new Error(`此請求已處理 (狀態: ${share.status})`);
    }

    const updateData: any = {
      status: 'accepted',
      updatedAt: new Date(),
    };

    // 如果提供了接收者的課表 ID，則保存
    if (receiverScheduleObjId) {
      updateData.receiverScheduleId = receiverScheduleObjId;
    }

    const result = await db.collection<ScheduleShare>(this.collectionName).findOneAndUpdate(
      { 
        _id: shareObjId,
        receiverId: receiverObjId,
        status: 'pending'
      },
      {
        $set: updateData,
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new Error('更新分享請求失敗');
    }

    return result as ScheduleShare;
  }

  // 拒絕或刪除課表分享請求
  static async rejectRequest(
    shareId: string | ObjectId,
    receiverId: string | ObjectId
  ): Promise<boolean> {
    const db = await getDatabase();

    const shareObjId = typeof shareId === 'string' ? new ObjectId(shareId) : shareId;
    const receiverObjId = typeof receiverId === 'string' ? new ObjectId(receiverId) : receiverId;

    const result = await db.collection<ScheduleShare>(this.collectionName).findOneAndUpdate(
      {
        _id: shareObjId,
        receiverId: receiverObjId,
        status: 'pending',
      },
      {
        $set: {
          status: 'rejected',
          updatedAt: new Date(),
        },
      }
    );

    return !!result;
  }

  // 取消已發送的請求
  static async cancelRequest(
    shareId: string | ObjectId,
    senderId: string | ObjectId
  ): Promise<boolean> {
    const db = await getDatabase();

    const shareObjId = typeof shareId === 'string' ? new ObjectId(shareId) : shareId;
    const senderObjId = typeof senderId === 'string' ? new ObjectId(senderId) : senderId;

    const result = await db.collection<ScheduleShare>(this.collectionName).deleteOne({
      _id: shareObjId,
      senderId: senderObjId,
      status: 'pending',
    });

    return result.deletedCount > 0;
  }

  // 刪除已接受的分享
  static async deleteShare(
    shareId: string | ObjectId,
    userId: string | ObjectId
  ): Promise<boolean> {
    const db = await getDatabase();

    const shareObjId = typeof shareId === 'string' ? new ObjectId(shareId) : shareId;
    const userIdObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const result = await db.collection<ScheduleShare>(this.collectionName).deleteOne({
      _id: shareObjId,
      $or: [
        { senderId: userIdObjId },
        { receiverId: userIdObjId },
      ],
      status: 'accepted',
    });

    return result.deletedCount > 0;
  }

  // 獲取收到的分享請求
  static async getReceivedRequests(receiverId: string | ObjectId): Promise<ScheduleShare[]> {
    const db = await getDatabase();

    const receiverObjId = typeof receiverId === 'string' ? new ObjectId(receiverId) : receiverId;

    const shares = await db
      .collection<ScheduleShare>(this.collectionName)
      .find({
        receiverId: receiverObjId,
        status: 'pending',
      })
      .sort({ createdAt: -1 })
      .toArray();

    return shares;
  }

  // 獲取已發送的分享請求
  static async getSentRequests(senderId: string | ObjectId): Promise<ScheduleShare[]> {
    const db = await getDatabase();

    const senderObjId = typeof senderId === 'string' ? new ObjectId(senderId) : senderId;

    const shares = await db
      .collection<ScheduleShare>(this.collectionName)
      .find({
        senderId: senderObjId,
        status: 'pending',
      })
      .sort({ createdAt: -1 })
      .toArray();

    return shares;
  }

  // 獲取已接受的好友課表分享列表（我可以看到的好友課表）
  static async getAcceptedSharesForUser(userId: string | ObjectId): Promise<ScheduleShare[]> {
    const db = await getDatabase();

    const userIdObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const shares = await db
      .collection<ScheduleShare>(this.collectionName)
      .find({
        receiverId: userIdObjId,
        status: 'accepted',
      })
      .sort({ updatedAt: -1 })
      .toArray();

    return shares;
  }

  // 獲取已分享給用戶的課表列表（分享給我的好友課表）
  static async getAcceptedSharesFromUser(userId: string | ObjectId): Promise<ScheduleShare[]> {
    const db = await getDatabase();

    const userIdObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const shares = await db
      .collection<ScheduleShare>(this.collectionName)
      .find({
        senderId: userIdObjId,
        status: 'accepted',
      })
      .sort({ updatedAt: -1 })
      .toArray();

    return shares;
  }
}

