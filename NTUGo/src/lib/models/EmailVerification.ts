import { ObjectId } from 'mongodb';
import { getDatabase } from '../mongodb';

export interface EmailVerification {
  _id?: string | ObjectId;
  email: string; // 待驗證的郵箱
  code: string; // 6位數字驗證碼
  expiresAt: Date; // 驗證碼過期時間（通常 10-15 分鐘）
  attempts: number; // 驗證嘗試次數（防止暴力破解）
  verified: boolean; // 是否已驗證
  verifiedAt?: Date; // 驗證時間
  createdAt: Date; // 創建時間
}

export class EmailVerificationModel {
  static collectionName = 'email_verifications';

  // 創建驗證碼記錄
  static async create(email: string, code: string, expiryMinutes: number = 10): Promise<EmailVerification> {
    const db = await getDatabase();
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);

    const verification: EmailVerification = {
      email,
      code,
      expiresAt,
      attempts: 0,
      verified: false,
      createdAt: now,
    };

    const result = await db.collection<EmailVerification>(this.collectionName).insertOne(verification);
    return { ...verification, _id: result.insertedId };
  }

  // 查找有效的驗證碼（未驗證、未過期）
  static async findValidCode(email: string, code: string): Promise<EmailVerification | null> {
    const db = await getDatabase();
    const now = new Date();

    const verification = await db.collection<EmailVerification>(this.collectionName).findOne({
      email,
      code,
      verified: false,
      expiresAt: { $gt: now },
    });

    return verification;
  }

  // 查找最近的驗證碼記錄（用於檢查發送頻率）
  static async findRecentCodes(email: string, withinMinutes: number = 60): Promise<EmailVerification[]> {
    const db = await getDatabase();
    const now = new Date();
    const since = new Date(now.getTime() - withinMinutes * 60 * 1000);

    const codes = await db.collection<EmailVerification>(this.collectionName)
      .find({
        email,
        createdAt: { $gte: since },
      })
      .sort({ createdAt: -1 })
      .toArray();

    return codes;
  }

  // 標記為已驗證
  static async markAsVerified(_id: string | ObjectId): Promise<boolean> {
    const db = await getDatabase();
    const id = typeof _id === 'string' ? new ObjectId(_id) : _id;

    const result = await db.collection<EmailVerification>(this.collectionName).updateOne(
      { _id: id },
      {
        $set: {
          verified: true,
          verifiedAt: new Date(),
        },
      }
    );

    return result.modifiedCount > 0;
  }

  // 增加嘗試次數
  static async incrementAttempts(_id: string | ObjectId): Promise<number> {
    const db = await getDatabase();
    const id = typeof _id === 'string' ? new ObjectId(_id) : _id;

    const result = await db.collection<EmailVerification>(this.collectionName).findOneAndUpdate(
      { _id: id },
      { $inc: { attempts: 1 } },
      { returnDocument: 'after' }
    );

    return result?.attempts || 0;
  }

  // 清理過期的驗證碼（定期執行）
  static async cleanupExpired(): Promise<number> {
    const db = await getDatabase();
    const now = new Date();

    const result = await db.collection<EmailVerification>(this.collectionName).deleteMany({
      $or: [
        { expiresAt: { $lt: now } },
        { verified: true, verifiedAt: { $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }, // 已驗證超過24小時
      ],
    });

    return result.deletedCount;
  }
}

