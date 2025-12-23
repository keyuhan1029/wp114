import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { FriendshipModel } from '@/lib/models/Friendship';
import { UserModel } from '@/lib/models/User';
import { ObjectId } from 'mongodb';

// 取得推薦好友
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

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    const suggestionIds = await FriendshipModel.getSuggestions(payload.userId, limit);
    const suggestions = await UserModel.findByIds(suggestionIds);

    const formattedSuggestions = suggestions.map(user => ({
      id: user._id instanceof ObjectId ? user._id.toString() : String(user._id),
      userId: user.userId || null,
      name: user.name || null,
      avatar: user.avatar || null,
      department: user.department || null,
      email: user.email,
    }));

    return NextResponse.json({
      suggestions: formattedSuggestions,
    });
  } catch (error: any) {
    console.error('取得推薦好友錯誤:', error);
    return NextResponse.json(
      { message: '取得推薦好友失敗' },
      { status: 500 }
    );
  }
}

