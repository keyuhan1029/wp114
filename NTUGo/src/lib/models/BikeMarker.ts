import { getDatabase } from '../mongodb';
import { ObjectId } from 'mongodb';

export interface BikeMarker {
  _id?: string | ObjectId;
  userId: string | ObjectId;
  lat: number;
  lng: number;
  note?: string; // 可選的備註
  imageUrl?: string; // 照片的 Cloudinary URL
  imagePublicId?: string; // 照片的 Cloudinary publicId（用於刪除）
  createdAt: Date;
  updatedAt: Date;
}

export class BikeMarkerModel {
  static async create(markerData: {
    userId: string | ObjectId;
    lat: number;
    lng: number;
    note?: string;
    imageUrl?: string;
    imagePublicId?: string;
  }): Promise<BikeMarker> {
    const db = await getDatabase();
    const now = new Date();
    
    const marker: Omit<BikeMarker, '_id'> = {
      userId: typeof markerData.userId === 'string' 
        ? new ObjectId(markerData.userId) 
        : markerData.userId,
      lat: markerData.lat,
      lng: markerData.lng,
      note: markerData.note,
      imageUrl: markerData.imageUrl,
      imagePublicId: markerData.imagePublicId,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection<BikeMarker>('bikeMarkers').insertOne(marker as BikeMarker);
    return { ...marker, _id: result.insertedId } as BikeMarker;
  }

  static async findByUserId(userId: string | ObjectId): Promise<BikeMarker[]> {
    const db = await getDatabase();
    const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    const markers = await db
      .collection<BikeMarker>('bikeMarkers')
      .find({ userId: userIdObj })
      .sort({ createdAt: -1 })
      .toArray();
    
    return markers;
  }

  static async deleteById(markerId: string | ObjectId, userId: string | ObjectId): Promise<boolean> {
    const db = await getDatabase();
    const markerIdObj = typeof markerId === 'string' ? new ObjectId(markerId) : markerId;
    const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    const result = await db.collection<BikeMarker>('bikeMarkers').deleteOne({
      _id: markerIdObj,
      userId: userIdObj,
    });
    
    return result.deletedCount > 0;
  }

  static async deleteAllByUserId(userId: string | ObjectId): Promise<number> {
    const db = await getDatabase();
    const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    const result = await db.collection<BikeMarker>('bikeMarkers').deleteMany({
      userId: userIdObj,
    });
    
    return result.deletedCount;
  }

  static async findById(markerId: string | ObjectId, userId: string | ObjectId): Promise<BikeMarker | null> {
    const db = await getDatabase();
    const markerIdObj = typeof markerId === 'string' ? new ObjectId(markerId) : markerId;
    const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
    
    const marker = await db.collection<BikeMarker>('bikeMarkers').findOne({
      _id: markerIdObj,
      userId: userIdObj,
    });
    
    return marker || null;
  }
}

