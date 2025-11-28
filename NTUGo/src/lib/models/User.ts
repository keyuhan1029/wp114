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
  provider: 'email' | 'google'; // 登入方式
  createdAt: Date;
  updatedAt: Date;
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
}

