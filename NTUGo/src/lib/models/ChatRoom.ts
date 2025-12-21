import { ObjectId } from 'mongodb';
import { getDatabase } from '../mongodb';

export type ChatRoomType = 'private' | 'group';

export interface ChatRoom {
  _id?: string | ObjectId;
  type: ChatRoomType;
  name?: string; // 群組名稱（私聊時為空）
  members: ObjectId[]; // 成員 ID 列表
  createdBy?: ObjectId; // 建立者（群組時使用）
  lastMessageAt?: Date; // 最後訊息時間
  lastMessage?: string; // 最後訊息預覽
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRoomWithDetails extends ChatRoom {
  memberDetails?: Array<{
    id: string;
    userId?: string;
    name?: string;
    avatar?: string;
    department?: string;
  }>;
  unreadCount?: number;
}

export class ChatRoomModel {
  static collectionName = 'chatrooms';

  // 建立私聊聊天室
  static async createPrivateChat(
    userId1: string | ObjectId,
    userId2: string | ObjectId
  ): Promise<ChatRoom> {
    const db = await getDatabase();

    const user1ObjId = typeof userId1 === 'string' ? new ObjectId(userId1) : userId1;
    const user2ObjId = typeof userId2 === 'string' ? new ObjectId(userId2) : userId2;

    // 檢查是否已存在私聊
    const existing = await this.findPrivateChat(userId1, userId2);
    if (existing) {
      return existing;
    }

    const now = new Date();
    const newChatRoom: ChatRoom = {
      type: 'private',
      members: [user1ObjId, user2ObjId],
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<ChatRoom>(this.collectionName).insertOne(newChatRoom);
    return { ...newChatRoom, _id: result.insertedId };
  }

  // 建立群組聊天室
  static async createGroupChat(
    name: string,
    creatorId: string | ObjectId,
    memberIds: (string | ObjectId)[]
  ): Promise<ChatRoom> {
    const db = await getDatabase();

    const creatorObjId = typeof creatorId === 'string' ? new ObjectId(creatorId) : creatorId;
    const memberObjIds = memberIds.map(id => 
      typeof id === 'string' ? new ObjectId(id) : id
    );

    // 確保建立者在成員列表中
    if (!memberObjIds.some(id => id.equals(creatorObjId))) {
      memberObjIds.push(creatorObjId);
    }

    const now = new Date();
    const newChatRoom: ChatRoom = {
      type: 'group',
      name,
      members: memberObjIds,
      createdBy: creatorObjId,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<ChatRoom>(this.collectionName).insertOne(newChatRoom);
    return { ...newChatRoom, _id: result.insertedId };
  }

  // 尋找私聊聊天室
  static async findPrivateChat(
    userId1: string | ObjectId,
    userId2: string | ObjectId
  ): Promise<ChatRoom | null> {
    const db = await getDatabase();

    const user1ObjId = typeof userId1 === 'string' ? new ObjectId(userId1) : userId1;
    const user2ObjId = typeof userId2 === 'string' ? new ObjectId(userId2) : userId2;

    const chatRoom = await db.collection<ChatRoom>(this.collectionName).findOne({
      type: 'private',
      members: { $all: [user1ObjId, user2ObjId], $size: 2 },
    });

    return chatRoom;
  }

  // 取得聊天室
  static async findById(id: string | ObjectId): Promise<ChatRoom | null> {
    const db = await getDatabase();

    const queryId = typeof id === 'string' ? new ObjectId(id) : id;
    const chatRoom = await db.collection<ChatRoom>(this.collectionName).findOne({ _id: queryId });

    return chatRoom;
  }

  // 取得用戶的所有聊天室
  static async findByUser(userId: string | ObjectId): Promise<ChatRoom[]> {
    const db = await getDatabase();

    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const chatRooms = await db.collection<ChatRoom>(this.collectionName)
      .find({
        members: userObjId,
      })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .toArray();

    return chatRooms;
  }

  // 檢查用戶是否為聊天室成員
  static async isMember(
    chatRoomId: string | ObjectId,
    userId: string | ObjectId
  ): Promise<boolean> {
    const db = await getDatabase();

    const roomObjId = typeof chatRoomId === 'string' ? new ObjectId(chatRoomId) : chatRoomId;
    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const chatRoom = await db.collection<ChatRoom>(this.collectionName).findOne({
      _id: roomObjId,
      members: userObjId,
    });

    return chatRoom !== null;
  }

  // 更新最後訊息
  static async updateLastMessage(
    chatRoomId: string | ObjectId,
    message: string
  ): Promise<void> {
    const db = await getDatabase();

    const roomObjId = typeof chatRoomId === 'string' ? new ObjectId(chatRoomId) : chatRoomId;

    await db.collection<ChatRoom>(this.collectionName).updateOne(
      { _id: roomObjId },
      {
        $set: {
          lastMessageAt: new Date(),
          lastMessage: message.substring(0, 100), // 只保存前 100 字作為預覽
          updatedAt: new Date(),
        },
      }
    );
  }

  // 新增成員到群組
  static async addMember(
    chatRoomId: string | ObjectId,
    userId: string | ObjectId
  ): Promise<boolean> {
    const db = await getDatabase();

    const roomObjId = typeof chatRoomId === 'string' ? new ObjectId(chatRoomId) : chatRoomId;
    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const result = await db.collection<ChatRoom>(this.collectionName).updateOne(
      { _id: roomObjId, type: 'group' },
      {
        $addToSet: { members: userObjId },
        $set: { updatedAt: new Date() },
      }
    );

    return result.modifiedCount === 1;
  }

  // 從群組移除成員
  static async removeMember(
    chatRoomId: string | ObjectId,
    userId: string | ObjectId
  ): Promise<boolean> {
    const db = await getDatabase();

    const roomObjId = typeof chatRoomId === 'string' ? new ObjectId(chatRoomId) : chatRoomId;
    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const result = await db.collection<ChatRoom>(this.collectionName).updateOne(
      { _id: roomObjId, type: 'group' },
      {
        $pull: { members: userObjId },
        $set: { updatedAt: new Date() },
      }
    );

    return result.modifiedCount === 1;
  }

  // 更新群組名稱
  static async updateGroupName(
    chatRoomId: string | ObjectId,
    name: string
  ): Promise<boolean> {
    const db = await getDatabase();

    const roomObjId = typeof chatRoomId === 'string' ? new ObjectId(chatRoomId) : chatRoomId;

    const result = await db.collection<ChatRoom>(this.collectionName).updateOne(
      { _id: roomObjId, type: 'group' },
      {
        $set: {
          name,
          updatedAt: new Date(),
        },
      }
    );

    return result.modifiedCount === 1;
  }

  // 取得或建立私聊
  static async getOrCreatePrivateChat(
    userId1: string | ObjectId,
    userId2: string | ObjectId
  ): Promise<ChatRoom> {
    const existing = await this.findPrivateChat(userId1, userId2);
    if (existing) {
      return existing;
    }
    return this.createPrivateChat(userId1, userId2);
  }
}

