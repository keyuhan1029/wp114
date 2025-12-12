import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/jwt';
import { ChatRoomModel } from '@/lib/models/ChatRoom';
import { MessageModel } from '@/lib/models/Message';
import { UserModel } from '@/lib/models/User';
import { ObjectId } from 'mongodb';

// 取得用戶的聊天室列表
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

    const allChatRooms = await ChatRoomModel.findByUser(payload.userId);

    // 去除重複的私聊聊天室（保留最新的）
    const seenPrivateChats = new Map<string, typeof allChatRooms[0]>();
    const chatRooms: typeof allChatRooms = [];

    for (const room of allChatRooms) {
      if (room.type === 'private') {
        // 對於私聊，使用排序後的成員 ID 作為唯一鍵
        const memberKey = room.members
          .map(m => m.toString())
          .sort()
          .join('-');
        
        const existing = seenPrivateChats.get(memberKey);
        if (!existing) {
          seenPrivateChats.set(memberKey, room);
          chatRooms.push(room);
        } else {
          // 如果已存在，保留最新的（有最新訊息的）
          const existingTime = existing.lastMessageAt || existing.createdAt;
          const currentTime = room.lastMessageAt || room.createdAt;
          if (currentTime > existingTime) {
            // 替換為更新的聊天室
            const idx = chatRooms.indexOf(existing);
            if (idx !== -1) {
              chatRooms[idx] = room;
            }
            seenPrivateChats.set(memberKey, room);
          }
        }
      } else {
        // 群組聊天直接添加
        chatRooms.push(room);
      }
    }

    // 取得未讀數量
    const roomIds = chatRooms.map(room => 
      room._id instanceof ObjectId ? room._id : new ObjectId(String(room._id))
    );
    const unreadCounts = await MessageModel.getUnreadCountsByRooms(roomIds, payload.userId);

    // 取得所有成員資訊
    const allMemberIds = new Set<string>();
    chatRooms.forEach(room => {
      room.members.forEach(memberId => {
        allMemberIds.add(memberId.toString());
      });
    });

    const members = await UserModel.findByIds(Array.from(allMemberIds));
    const memberMap = new Map(
      members.map(m => [
        m._id instanceof ObjectId ? m._id.toString() : String(m._id),
        m,
      ])
    );

    // 組合聊天室資訊
    const roomsWithDetails = chatRooms.map(room => {
      const roomId = room._id instanceof ObjectId ? room._id.toString() : String(room._id);
      
      // 取得成員詳細資訊
      const memberDetails = room.members
        .filter(memberId => memberId.toString() !== payload.userId)
        .map(memberId => {
          const member = memberMap.get(memberId.toString());
          return member ? {
            id: memberId.toString(),
            userId: member.userId || null,
            name: member.name || null,
            avatar: member.avatar || null,
            department: member.department || null,
          } : null;
        })
        .filter(Boolean);

      // 對於私聊，使用對方的名字作為聊天室名稱
      let displayName = room.name;
      if (room.type === 'private' && memberDetails.length > 0) {
        displayName = memberDetails[0]?.name || memberDetails[0]?.userId || '未知用戶';
      }

      return {
        id: roomId,
        type: room.type,
        name: displayName || '群組聊天',
        members: memberDetails,
        memberCount: room.members.length,
        lastMessage: room.lastMessage || null,
        lastMessageAt: room.lastMessageAt || room.createdAt,
        unreadCount: unreadCounts[roomId] || 0,
        createdAt: room.createdAt,
      };
    });

    return NextResponse.json({
      chatRooms: roomsWithDetails,
    });
  } catch (error: any) {
    console.error('取得聊天室列表錯誤:', error);
    return NextResponse.json(
      { message: '取得聊天室列表失敗' },
      { status: 500 }
    );
  }
}

// 建立聊天室
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

    const body = await request.json();
    const { type, targetUserId, name, memberIds } = body;

    if (type === 'private') {
      // 建立私聊
      if (!targetUserId) {
        return NextResponse.json(
          { message: '請提供目標用戶 ID' },
          { status: 400 }
        );
      }

      if (!ObjectId.isValid(targetUserId)) {
        return NextResponse.json(
          { message: '無效的用戶 ID' },
          { status: 400 }
        );
      }

      const chatRoom = await ChatRoomModel.getOrCreatePrivateChat(payload.userId, targetUserId);

      return NextResponse.json({
        chatRoom: {
          id: chatRoom._id instanceof ObjectId 
            ? chatRoom._id.toString() 
            : String(chatRoom._id),
          type: chatRoom.type,
          members: chatRoom.members.map(m => m.toString()),
          createdAt: chatRoom.createdAt,
        },
      });
    } else if (type === 'group') {
      // 建立群組
      if (!name || name.trim().length === 0) {
        return NextResponse.json(
          { message: '請提供群組名稱' },
          { status: 400 }
        );
      }

      if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
        return NextResponse.json(
          { message: '請提供群組成員' },
          { status: 400 }
        );
      }

      const chatRoom = await ChatRoomModel.createGroupChat(
        name.trim(),
        payload.userId,
        memberIds
      );

      return NextResponse.json({
        chatRoom: {
          id: chatRoom._id instanceof ObjectId 
            ? chatRoom._id.toString() 
            : String(chatRoom._id),
          type: chatRoom.type,
          name: chatRoom.name,
          members: chatRoom.members.map(m => m.toString()),
          createdAt: chatRoom.createdAt,
        },
      });
    } else {
      return NextResponse.json(
        { message: '無效的聊天室類型' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('建立聊天室錯誤:', error);
    return NextResponse.json(
      { message: '建立聊天室失敗' },
      { status: 500 }
    );
  }
}

