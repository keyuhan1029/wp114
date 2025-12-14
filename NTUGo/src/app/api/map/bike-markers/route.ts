import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { BikeMarkerModel } from '@/lib/models/BikeMarker';
import { deleteFile } from '@/lib/cloudinary';
import { ObjectId } from 'mongodb';

// 獲取當前用戶的所有腳踏車標記
export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { message: '未提供認證 token' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { message: '無效的 token' },
        { status: 401 }
      );
    }

    const markers = await BikeMarkerModel.findByUserId(payload.userId);
    
    // 每個用戶只能有一個標記，所以返回第一個（如果有的話）
    const marker = markers.length > 0 ? markers[0] : null;
    
    return NextResponse.json({
      success: true,
      marker: marker ? {
        _id: marker._id instanceof ObjectId ? marker._id.toString() : marker._id,
        lat: marker.lat,
        lng: marker.lng,
        note: marker.note,
        imageUrl: marker.imageUrl,
        imagePublicId: marker.imagePublicId,
        createdAt: marker.createdAt,
        updatedAt: marker.updatedAt,
      } : null,
    });
  } catch (error: any) {
    console.error('獲取腳踏車標記錯誤:', error);
    return NextResponse.json(
      { message: '獲取腳踏車標記失敗', error: error.message },
      { status: 500 }
    );
  }
}

// 創建新的腳踏車標記
export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { message: '未提供認證 token' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { message: '無效的 token' },
        { status: 401 }
      );
    }

    const { lat, lng, note, imageUrl, imagePublicId } = await request.json();

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { message: '請提供有效的經緯度' },
        { status: 400 }
      );
    }

    // 先獲取舊標記，以便刪除 Cloudinary 上的照片
    const oldMarkers = await BikeMarkerModel.findByUserId(payload.userId);
    
    // 刪除舊標記的 Cloudinary 照片
    for (const oldMarker of oldMarkers) {
      if (oldMarker.imagePublicId) {
        try {
          await deleteFile(oldMarker.imagePublicId);
        } catch (error) {
          console.error('刪除 Cloudinary 照片失敗:', error);
          // 繼續刪除標記，即使照片刪除失敗
        }
      }
    }

    // 刪除該用戶的所有舊標記（每個用戶只能有一個標記）
    await BikeMarkerModel.deleteAllByUserId(payload.userId);

    // 創建新標記
    const marker = await BikeMarkerModel.create({
      userId: payload.userId,
      lat,
      lng,
      note: note || undefined,
      imageUrl: imageUrl || undefined,
      imagePublicId: imagePublicId || undefined,
    });

    return NextResponse.json({
      success: true,
      marker: {
        _id: marker._id instanceof ObjectId ? marker._id.toString() : marker._id,
        lat: marker.lat,
        lng: marker.lng,
        note: marker.note,
        imageUrl: marker.imageUrl,
        imagePublicId: marker.imagePublicId,
        createdAt: marker.createdAt,
        updatedAt: marker.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('創建腳踏車標記錯誤:', error);
    return NextResponse.json(
      { message: '創建腳踏車標記失敗', error: error.message },
      { status: 500 }
    );
  }
}

