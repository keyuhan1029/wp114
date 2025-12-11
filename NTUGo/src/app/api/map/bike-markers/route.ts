import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { BikeMarkerModel } from '@/lib/models/BikeMarker';
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
    
    return NextResponse.json({
      success: true,
      markers: markers.map((marker) => ({
        _id: marker._id instanceof ObjectId ? marker._id.toString() : marker._id,
        lat: marker.lat,
        lng: marker.lng,
        note: marker.note,
        createdAt: marker.createdAt,
        updatedAt: marker.updatedAt,
      })),
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

    const { lat, lng, note } = await request.json();

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { message: '請提供有效的經緯度' },
        { status: 400 }
      );
    }

    const marker = await BikeMarkerModel.create({
      userId: payload.userId,
      lat,
      lng,
      note: note || undefined,
    });

    return NextResponse.json({
      success: true,
      marker: {
        _id: marker._id instanceof ObjectId ? marker._id.toString() : marker._id,
        lat: marker.lat,
        lng: marker.lng,
        note: marker.note,
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

