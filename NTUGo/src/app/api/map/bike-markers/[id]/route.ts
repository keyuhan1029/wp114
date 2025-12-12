import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { BikeMarkerModel } from '@/lib/models/BikeMarker';
import { ObjectId } from 'mongodb';

// 刪除指定的腳踏車標記
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: '無效的標記 ID' },
        { status: 400 }
      );
    }

    const deleted = await BikeMarkerModel.deleteById(id, payload.userId);

    if (!deleted) {
      return NextResponse.json(
        { message: '標記不存在或無權限刪除' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '標記已刪除',
    });
  } catch (error: any) {
    console.error('刪除腳踏車標記錯誤:', error);
    return NextResponse.json(
      { message: '刪除腳踏車標記失敗', error: error.message },
      { status: 500 }
    );
  }
}

