import { ObjectId } from 'mongodb';
import { getDatabase } from '../mongodb';

export type MessageType = 'text' | 'image' | 'file';

export interface FileInfo {
  url: string;
  name: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface Message {
  _id?: string | ObjectId;
  chatRoomId: ObjectId;
  senderId: ObjectId;
  type: MessageType;
  content: string;
  file?: FileInfo;        // 檔案資訊（圖片或檔案）
  readBy?: ObjectId[];    // 已讀用戶列表
  createdAt: Date;
}

export interface MessageWithSender extends Message {
  sender?: {
    id: string;
    userId?: string;
    name?: string;
    avatar?: string;
  };
}

export class MessageModel {
  static collectionName = 'messages';

  // 發送訊息
  static async create(
    chatRoomId: string | ObjectId,
    senderId: string | ObjectId,
    content: string,
    options?: {
      type?: MessageType;
      file?: FileInfo;
    }
  ): Promise<Message> {
    const db = await getDatabase();

    const roomObjId = typeof chatRoomId === 'string' ? new ObjectId(chatRoomId) : chatRoomId;
    const senderObjId = typeof senderId === 'string' ? new ObjectId(senderId) : senderId;

    const newMessage: Message = {
      chatRoomId: roomObjId,
      senderId: senderObjId,
      type: options?.type || 'text',
      content,
      file: options?.file,
      readBy: [senderObjId], // 發送者自動已讀
      createdAt: new Date(),
    };

    const result = await db.collection<Message>(this.collectionName).insertOne(newMessage);
    return { ...newMessage, _id: result.insertedId };
  }

  // 取得聊天室的訊息
  static async findByChatRoom(
    chatRoomId: string | ObjectId,
    limit: number = 50,
    beforeDate?: Date
  ): Promise<Message[]> {
    const db = await getDatabase();

    const roomObjId = typeof chatRoomId === 'string' ? new ObjectId(chatRoomId) : chatRoomId;

    const query: any = { chatRoomId: roomObjId };
    if (beforeDate) {
      query.createdAt = { $lt: beforeDate };
    }

    const messages = await db.collection<Message>(this.collectionName)
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // 返回時反轉順序，讓最舊的在前面
    return messages.reverse();
  }

  // 取得訊息 by ID
  static async findById(id: string | ObjectId): Promise<Message | null> {
    const db = await getDatabase();

    const queryId = typeof id === 'string' ? new ObjectId(id) : id;
    const message = await db.collection<Message>(this.collectionName).findOne({ _id: queryId });

    return message;
  }

  // 標記訊息為已讀
  static async markAsRead(
    chatRoomId: string | ObjectId,
    userId: string | ObjectId
  ): Promise<number> {
    const db = await getDatabase();

    const roomObjId = typeof chatRoomId === 'string' ? new ObjectId(chatRoomId) : chatRoomId;
    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const result = await db.collection<Message>(this.collectionName).updateMany(
      {
        chatRoomId: roomObjId,
        readBy: { $ne: userObjId },
      },
      {
        $addToSet: { readBy: userObjId },
      }
    );

    return result.modifiedCount;
  }

  // 取得未讀訊息數量
  static async getUnreadCount(
    chatRoomId: string | ObjectId,
    userId: string | ObjectId
  ): Promise<number> {
    const db = await getDatabase();

    const roomObjId = typeof chatRoomId === 'string' ? new ObjectId(chatRoomId) : chatRoomId;
    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const count = await db.collection<Message>(this.collectionName).countDocuments({
      chatRoomId: roomObjId,
      readBy: { $ne: userObjId },
    });

    return count;
  }

  // 取得用戶所有聊天室的未讀訊息數量
  static async getUnreadCountsByRooms(
    chatRoomIds: (string | ObjectId)[],
    userId: string | ObjectId
  ): Promise<Record<string, number>> {
    const db = await getDatabase();

    const roomObjIds = chatRoomIds.map(id => 
      typeof id === 'string' ? new ObjectId(id) : id
    );
    const userObjId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const pipeline = [
      {
        $match: {
          chatRoomId: { $in: roomObjIds },
          readBy: { $ne: userObjId },
        },
      },
      {
        $group: {
          _id: '$chatRoomId',
          count: { $sum: 1 },
        },
      },
    ];

    const results = await db.collection<Message>(this.collectionName)
      .aggregate(pipeline)
      .toArray();

    const counts: Record<string, number> = {};
    for (const result of results) {
      counts[result._id.toString()] = result.count;
    }

    return counts;
  }

  // 取得最新訊息
  static async getLatestMessage(
    chatRoomId: string | ObjectId
  ): Promise<Message | null> {
    const db = await getDatabase();

    const roomObjId = typeof chatRoomId === 'string' ? new ObjectId(chatRoomId) : chatRoomId;

    const message = await db.collection<Message>(this.collectionName)
      .findOne(
        { chatRoomId: roomObjId },
        { sort: { createdAt: -1 } }
      );

    return message;
  }

  // 刪除訊息（軟刪除可以之後實現）
  static async delete(
    messageId: string | ObjectId,
    senderId: string | ObjectId
  ): Promise<boolean> {
    const db = await getDatabase();

    const msgObjId = typeof messageId === 'string' ? new ObjectId(messageId) : messageId;
    const senderObjId = typeof senderId === 'string' ? new ObjectId(senderId) : senderId;

    // 只有發送者可以刪除自己的訊息
    const result = await db.collection<Message>(this.collectionName).deleteOne({
      _id: msgObjId,
      senderId: senderObjId,
    });

    return result.deletedCount === 1;
  }
}

