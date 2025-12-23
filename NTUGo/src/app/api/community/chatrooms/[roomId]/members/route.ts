import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { ChatRoomModel } from '@/lib/models/ChatRoom';
import { UserModel } from '@/lib/models/User';
import { ObjectId } from 'mongodb';

interface RouteParams {
  params: Promise<{ roomId: string }>;
}

// 添加成員到群組
export async function POST(request: Request, { params }: RouteParams) {
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

    const { roomId } = await params;

    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json(
        { message: '無效的聊天室 ID' },
        { status: 400 }
      );
    }

    // 檢查聊天室是否存在且為群組
    const chatRoom = await ChatRoomModel.findById(roomId);
    if (!chatRoom) {
      return NextResponse.json(
        { message: '聊天室不存在' },
        { status: 404 }
      );
    }

    if (chatRoom.type !== 'group') {
      return NextResponse.json(
        { message: '只能在群組聊天室添加成員' },
        { status: 400 }
      );
    }

    // 檢查用戶是否為聊天室成員
    const isMember = await ChatRoomModel.isMember(roomId, payload.userId);
    if (!isMember) {
      return NextResponse.json(
        { message: '您不是此聊天室的成員' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { memberIds } = body;

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return NextResponse.json(
        { message: '請提供要添加的成員 ID' },
        { status: 400 }
      );
    }

    // 驗證所有成員 ID
    for (const memberId of memberIds) {
      if (!ObjectId.isValid(memberId)) {
        return NextResponse.json(
          { message: `無效的成員 ID: ${memberId}` },
          { status: 400 }
        );
      }
    }

    // 添加成員
    const addedMembers: string[] = [];
    for (const memberId of memberIds) {
      const success = await ChatRoomModel.addMember(roomId, memberId);
      if (success) {
        addedMembers.push(memberId);
      }
    }

    // 取得新成員資訊
    const newMembers = await UserModel.findByIds(addedMembers);
    const memberDetails = newMembers.map(m => ({
      id: m._id instanceof ObjectId ? m._id.toString() : String(m._id),
      userId: m.userId || null,
      name: m.name || null,
      avatar: m.avatar || null,
    }));

    // 取得更新後的聊天室成員數量
    const updatedRoom = await ChatRoomModel.findById(roomId);
    const newMemberCount = updatedRoom?.members.length || 0;

    return NextResponse.json({
      message: `已添加 ${addedMembers.length} 位成員`,
      addedMembers: memberDetails,
      memberCount: newMemberCount,
    });
  } catch (error: any) {
    console.error('添加成員錯誤:', error);
    return NextResponse.json(
      { message: '添加成員失敗' },
      { status: 500 }
    );
  }
}

// 取得群組成員列表
export async function GET(request: Request, { params }: RouteParams) {
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

    const { roomId } = await params;

    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json(
        { message: '無效的聊天室 ID' },
        { status: 400 }
      );
    }

    // 檢查用戶是否為聊天室成員
    const isMember = await ChatRoomModel.isMember(roomId, payload.userId);
    if (!isMember) {
      return NextResponse.json(
        { message: '您不是此聊天室的成員' },
        { status: 403 }
      );
    }

    const chatRoom = await ChatRoomModel.findById(roomId);
    if (!chatRoom) {
      return NextResponse.json(
        { message: '聊天室不存在' },
        { status: 404 }
      );
    }

    // 取得成員資訊
    const memberIds = chatRoom.members.map(m => m.toString());
    const members = await UserModel.findByIds(memberIds);
    const memberDetails = members.map(m => ({
      id: m._id instanceof ObjectId ? m._id.toString() : String(m._id),
      userId: m.userId || null,
      name: m.name || null,
      avatar: m.avatar || null,
      department: m.department || null,
    }));

    return NextResponse.json({
      members: memberDetails,
      memberCount: memberDetails.length,
    });
  } catch (error: any) {
    console.error('取得成員列表錯誤:', error);
    return NextResponse.json(
      { message: '取得成員列表失敗' },
      { status: 500 }
    );
  }
}

