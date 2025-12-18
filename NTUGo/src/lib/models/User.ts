import { getDatabase } from '../mongodb';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

export interface User {
  _id?: string | ObjectId;
  userId?: string; // 用戶自定義的 ID
  email: string;
  password?: string; // 只有使用 email/password 註冊的用戶才有
  name?: string;
  googleId?: string; // Google OAuth 用戶的 ID
  avatar?: string;
  department?: string; // 系所
  provider: 'email' | 'google'; // 登入方式
  emailVerified?: boolean; // 郵箱是否已驗證
  emailVerifiedAt?: Date; // 郵箱驗證時間
  isSchoolEmail?: boolean; // 是否為學校郵箱（通過域名判斷）
  lastSeen?: Date; // 最後上線時間
  createdAt: Date;
  updatedAt: Date;
}

// 判斷用戶是否在線（30 秒內有心跳）
export function isUserOnline(lastSeen?: Date): boolean {
  if (!lastSeen) return false;
  const now = new Date();
  const diff = now.getTime() - new Date(lastSeen).getTime();
  return diff < 30000; // 30 秒
}

export class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    const db = await getDatabase();
    const user = await db.collection<User>('users').findOne({ email });
    return user;
  }

  static async findByGoogleId(googleId: string): Promise<User | null> {
    const db = await getDatabase();
    const user = await db.collection<User>('users').findOne({ googleId });
    return user;
  }

  static async create(userData: {
    email: string;
    password?: string;
    name?: string;
    googleId?: string;
    avatar?: string;
    provider: 'email' | 'google';
    userId?: string;
  }): Promise<User> {
    const db = await getDatabase();
    
    // 如果提供密碼，則進行加密
    const hashedPassword = userData.password
      ? await bcrypt.hash(userData.password, 10)
      : undefined;

    const newUser: User = {
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      googleId: userData.googleId,
      avatar: userData.avatar,
      provider: userData.provider,
      userId: userData.userId,
      emailVerified: false,
      emailVerifiedAt: undefined,
      isSchoolEmail: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<User>('users').insertOne(newUser);
    return { ...newUser, _id: result.insertedId.toString() } as User;
  }

  static async findByUserId(userId: string): Promise<User | null> {
    const db = await getDatabase();
    const user = await db.collection<User>('users').findOne({ userId });
    return user;
  }

  static async updateUserId(email: string, userId: string): Promise<User | null> {
    const db = await getDatabase();
    const result = await db.collection<User>('users').findOneAndUpdate(
      { email },
      {
        $set: {
          userId,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );
    return (result as User) || null;
  }

  static async verifyPassword(user: User, password: string): Promise<boolean> {
    if (!user.password) {
      return false;
    }
    return bcrypt.compare(password, user.password);
  }

  static async updateGoogleUser(
    email: string,
    googleData: {
      googleId: string;
      name?: string;
      avatar?: string;
      provider?: 'google';
    }
  ): Promise<User | null> {
    const db = await getDatabase();
    const updateData: any = {
      googleId: googleData.googleId,
      name: googleData.name,
      avatar: googleData.avatar,
      updatedAt: new Date(),
    };
    if (googleData.provider) {
      updateData.provider = googleData.provider;
    }
    const result = await db.collection<User>('users').findOneAndUpdate(
      { email },
      {
        $set: updateData,
      },
      { returnDocument: 'after' }
    );
    return (result as User) || null;
  }

  static async updateProfile(
    userId: string | ObjectId,
    updateData: {
      name?: string;
      avatar?: string;
      userId?: string;
      department?: string;
    }
  ): Promise<User | null> {
    const db = await getDatabase();
    
    // 如果提供 userId，檢查是否已被其他用戶使用
    if (updateData.userId) {
      const existingUser = await db.collection<User>('users').findOne({ 
        userId: updateData.userId,
        _id: { $ne: typeof userId === 'string' ? new ObjectId(userId) : userId }
      });
      if (existingUser) {
        throw new Error('此用戶 ID 已被使用');
      }
    }

    const queryId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (updateData.name !== undefined) {
      updateFields.name = updateData.name;
    }
    if (updateData.avatar !== undefined) {
      updateFields.avatar = updateData.avatar;
    }
    if (updateData.userId !== undefined) {
      updateFields.userId = updateData.userId;
    }
    if (updateData.department !== undefined) {
      updateFields.department = updateData.department;
    }

    const result = await db.collection<User>('users').findOneAndUpdate(
      { _id: queryId },
      {
        $set: updateFields,
      },
      { returnDocument: 'after' }
    );
    return (result as User) || null;
  }

  static async findById(id: string | ObjectId): Promise<User | null> {
    const db = await getDatabase();
    const queryId = typeof id === 'string' ? new ObjectId(id) : id;
    const user = await db.collection<User>('users').findOne({ _id: queryId });
    return user;
  }

  static async findByIds(ids: (string | ObjectId)[]): Promise<User[]> {
    const db = await getDatabase();
    const queryIds = ids.map(id => typeof id === 'string' ? new ObjectId(id) : id);
    const users = await db.collection<User>('users').find({ _id: { $in: queryIds } }).toArray();
    return users;
  }

  static async searchUsers(query: string, excludeUserId?: string | ObjectId): Promise<User[]> {
    const db = await getDatabase();
    
    const searchFilter: any = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { userId: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    };
    
    if (excludeUserId) {
      const excludeId = typeof excludeUserId === 'string' ? new ObjectId(excludeUserId) : excludeUserId;
      searchFilter._id = { $ne: excludeId };
    }
    
    const users = await db.collection<User>('users')
      .find(searchFilter)
      .limit(20)
      .toArray();
    return users;
  }

  // 更新最後上線時間（心跳）
  static async updateLastSeen(userId: string | ObjectId): Promise<void> {
    const db = await getDatabase();
    const queryId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    await db.collection<User>('users').updateOne(
      { _id: queryId },
      { $set: { lastSeen: new Date() } }
    );
  }

  // 更新郵箱驗證狀態
  static async updateEmailVerificationStatus(
    userId: string | ObjectId,
    verified: boolean
  ): Promise<User | null> {
    const db = await getDatabase();
    const queryId = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    const updateData: any = {
      emailVerified: verified,
      updatedAt: new Date(),
    };
    
    if (verified) {
      updateData.emailVerifiedAt = new Date();
    }
    
    const result = await db.collection<User>('users').findOneAndUpdate(
      { _id: queryId },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    return (result as User) || null;
  }
}

