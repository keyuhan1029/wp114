import { ObjectId } from 'mongodb';
import { getDatabase } from '../mongodb';

export type ScheduleShareStatus = 'pending' | 'accepted' | 'rejected';

export interface ScheduleShare {
  _id?: string | ObjectId;
  senderId: ObjectId; // 發送分享請求的用戶
  receiverId: ObjectId; // 接收分享請求的用戶
  status: ScheduleShareStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class ScheduleShareModel {
  static collectionName = 'schedule_shares';

  // 發送課表分享請求
  static async sendRequest(
    senderId: string | ObjectId,
    receiverId: string | ObjectId
  ): Promise<ScheduleShare> {
    const db = await getDatabase();

    const senderObjId = typeof senderId === 'string' ? new ObjectId(senderId) : senderId;
    const receiverObjId = typeof receiverId === 'string' ? new ObjectId(receiverId) : receiverId;

    // 檢查是否已存在分享關係
    const existing = await db.collection<ScheduleShare>(this.collectionName).findOne({
      senderId: senderObjId,
      receiverId: receiverObjId,
    });

    if (existing) {
      if (existing.status === 'pending') {
        throw new Error('已發送課表分享請求，等待對方回應');
      }
      if (existing.status === 'accepted') {
        throw new Error('已與對方分享課表');
      }
      // 如果是 rejected，可以重新發送
    }

    const share: ScheduleShare = {
      senderId: senderObjId,
      receiverId: receiverObjId,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (existing && existing.status === 'rejected') {
      // 更新現有的 rejected 記錄
      const result = await db.collection<ScheduleShare>(this.collectionName).findOneAndUpdate(
        { _id: existing._id },
        {
          $set: {
            status: 'pending',
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
    receiverId: string | ObjectId
  ): Promise<ScheduleShare> {
    const db = await getDatabase();

    let shareObjId: ObjectId;
    try {
      shareObjId = typeof shareId === 'string' ? new ObjectId(shareId) : shareId;
    } catch (error) {
      throw new Error(`無效的分享 ID 格式: ${shareId}`);
    }

    const receiverObjId = typeof receiverId === 'string' ? new ObjectId(receiverId) : receiverId;

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

    const result = await db.collection<ScheduleShare>(this.collectionName).findOneAndUpdate(
      { 
        _id: shareObjId,
        receiverId: receiverObjId,
        status: 'pending'
      },
      {
        $set: {
          status: 'accepted',
          updatedAt: new Date(),
        },
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

