import { ObjectId } from 'mongodb';
import { getDatabase } from '../mongodb';

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected';

export interface Friendship {
  _id?: string | ObjectId;
  requesterId: ObjectId; // 發送請求的用戶
  addresseeId: ObjectId; // 接收請求的用戶
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface FriendWithUser {
  friendship: Friendship;
  user: {
    _id: string;
    userId?: string;
    name?: string;
    avatar?: string;
    department?: string;
    email: string;
  };
}

export class FriendshipModel {
  static collectionName = 'friendships';

  // 發送好友請求
  static async sendRequest(
    requesterId: string | ObjectId,
    addresseeId: string | ObjectId
  ): Promise<Friendship> {
    const db = await getDatabase();

    const requesterObjId = typeof requesterId === 'string' ? new ObjectId(requesterId) : requesterId;
    const addresseeObjId = typeof addresseeId === 'string' ? new ObjectId(addresseeId) : addresseeId;

    // 檢查是否已存在好友關係
    const existing = await db.collection<Friendship>(this.collectionName).findOne({
      $or: [
        { requesterId: requesterObjId, addresseeId: addresseeObjId },
        { requesterId: addresseeObjId, addresseeId: requesterObjId },
      ],
    });

    if (existing) {
      throw new Error('好友請求已存在或你們已經是好友');
    }

    const now = new Date();
    const newFriendship: Friendship = {
      requesterId: requesterObjId,
      addresseeId: addresseeObjId,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<Friendship>(this.collectionName).insertOne(newFriendship);
    return { ...newFriendship, _id: result.insertedId };
  }

  // 接受好友請求
  static async acceptRequest(
    friendshipId: string | ObjectId,
    userId: string | ObjectId
  ): Promise<Friendship | null> {
    const db = await getDatabase();

    const queryId = typeof friendshipId === 'string' ? new ObjectId(friendshipId) : friendshipId;
    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const result = await db.collection<Friendship>(this.collectionName).findOneAndUpdate(
      {
        _id: queryId,
        addresseeId: userObjId, // 只有接收者可以接受
        status: 'pending',
      },
      {
        $set: {
          status: 'accepted',
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    return (result as Friendship) || null;
  }

  // 拒絕/取消好友請求
  static async rejectRequest(
    friendshipId: string | ObjectId,
    userId: string | ObjectId
  ): Promise<boolean> {
    const db = await getDatabase();

    const queryId = typeof friendshipId === 'string' ? new ObjectId(friendshipId) : friendshipId;
    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    // 接收者可以拒絕，發送者可以取消
    const result = await db.collection<Friendship>(this.collectionName).deleteOne({
      _id: queryId,
      $or: [
        { addresseeId: userObjId },
        { requesterId: userObjId },
      ],
      status: 'pending',
    });

    return result.deletedCount === 1;
  }

  // 刪除好友
  static async removeFriend(
    friendshipId: string | ObjectId,
    userId: string | ObjectId
  ): Promise<boolean> {
    const db = await getDatabase();

    const queryId = typeof friendshipId === 'string' ? new ObjectId(friendshipId) : friendshipId;
    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const result = await db.collection<Friendship>(this.collectionName).deleteOne({
      _id: queryId,
      $or: [
        { addresseeId: userObjId },
        { requesterId: userObjId },
      ],
      status: 'accepted',
    });

    return result.deletedCount === 1;
  }

  // 取得用戶的好友列表
  static async getFriends(userId: string | ObjectId): Promise<Friendship[]> {
    const db = await getDatabase();

    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const friendships = await db.collection<Friendship>(this.collectionName)
      .find({
        $or: [
          { requesterId: userObjId },
          { addresseeId: userObjId },
        ],
        status: 'accepted',
      })
      .toArray();

    return friendships;
  }

  // 取得待處理的好友請求（收到的）
  static async getPendingRequests(userId: string | ObjectId): Promise<Friendship[]> {
    const db = await getDatabase();

    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const friendships = await db.collection<Friendship>(this.collectionName)
      .find({
        addresseeId: userObjId,
        status: 'pending',
      })
      .sort({ createdAt: -1 })
      .toArray();

    return friendships;
  }

  // 取得已發送的好友請求
  static async getSentRequests(userId: string | ObjectId): Promise<Friendship[]> {
    const db = await getDatabase();

    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const friendships = await db.collection<Friendship>(this.collectionName)
      .find({
        requesterId: userObjId,
        status: 'pending',
      })
      .sort({ createdAt: -1 })
      .toArray();

    return friendships;
  }

  // 檢查兩個用戶之間的好友狀態
  static async getFriendshipStatus(
    userId1: string | ObjectId,
    userId2: string | ObjectId
  ): Promise<{ status: FriendshipStatus | 'none'; friendship?: Friendship; direction?: 'sent' | 'received' }> {
    const db = await getDatabase();

    const user1ObjId = typeof userId1 === 'string' ? new ObjectId(userId1) : userId1;
    const user2ObjId = typeof userId2 === 'string' ? new ObjectId(userId2) : userId2;

    const friendship = await db.collection<Friendship>(this.collectionName).findOne({
      $or: [
        { requesterId: user1ObjId, addresseeId: user2ObjId },
        { requesterId: user2ObjId, addresseeId: user1ObjId },
      ],
    });

    if (!friendship) {
      return { status: 'none' };
    }

    const direction = friendship.requesterId.equals(user1ObjId) ? 'sent' : 'received';
    return { status: friendship.status, friendship, direction };
  }

  // 取得好友的 ID 列表
  static async getFriendIds(userId: string | ObjectId): Promise<ObjectId[]> {
    const friendships = await this.getFriends(userId);
    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    return friendships.map(f => 
      f.requesterId.equals(userObjId) ? f.addresseeId : f.requesterId
    );
  }

  // 取得推薦好友（還不是好友的用戶）
  static async getSuggestions(
    userId: string | ObjectId,
    limit: number = 10
  ): Promise<ObjectId[]> {
    const db = await getDatabase();

    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    // 取得所有已有關係的用戶 ID
    const existingRelations = await db.collection<Friendship>(this.collectionName)
      .find({
        $or: [
          { requesterId: userObjId },
          { addresseeId: userObjId },
        ],
      })
      .toArray();

    const excludeIds = new Set<string>();
    excludeIds.add(userObjId.toString());
    
    existingRelations.forEach(f => {
      excludeIds.add(f.requesterId.toString());
      excludeIds.add(f.addresseeId.toString());
    });

    const excludeObjectIds = Array.from(excludeIds).map(id => new ObjectId(id));

    // 取得推薦用戶
    const suggestions = await db.collection('users')
      .find({
        _id: { $nin: excludeObjectIds },
      })
      .limit(limit)
      .project({ _id: 1 })
      .toArray();

    return suggestions.map(s => s._id as ObjectId);
  }
}

