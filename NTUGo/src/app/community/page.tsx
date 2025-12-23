'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';
import FriendsList from '@/components/Community/FriendsList';
import MessageList from '@/components/Community/MessageList';
import FriendRequests from '@/components/Community/FriendRequests';
import FriendSuggestions from '@/components/Community/FriendSuggestions';
import ChatRoom from '@/components/Community/ChatRoom';
import UserProfileModal from '@/components/Community/UserProfileModal';
import CreateGroupModal from '@/components/Community/CreateGroupModal';
import { PusherProvider } from '@/contexts/PusherContext';
import { useHeartbeat } from '@/hooks/useHeartbeat';

interface SelectedChat {
  roomId: string;
  type: 'private' | 'group';
  name: string;
  avatar?: string;
  friendId?: string;
  memberIds?: string[];
}

export default function CommunityPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [selectedChat, setSelectedChat] = React.useState<SelectedChat | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);
  const [userProfileOpen, setUserProfileOpen] = React.useState(false);
  const [createGroupOpen, setCreateGroupOpen] = React.useState(false);

  // 心跳功能 - 保持線上狀態
  useHeartbeat();

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setIsAuthenticated(true);
    setLoading(false);
  }, [router]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSelectChat = (chat: SelectedChat) => {
    setSelectedChat(chat);
  };

  const handleCloseChat = () => {
    setSelectedChat(null);
  };

  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId);
    setUserProfileOpen(true);
  };

  const handleStartChatFromProfile = (userId: string, name: string, avatar?: string) => {
    handleSelectChat({
      roomId: '',
      type: 'private',
      name,
      avatar,
      friendId: userId,
    });
  };

  const handleGroupCreated = (roomId: string, name: string) => {
    handleSelectChat({
      roomId,
      type: 'group',
      name,
    });
    handleRefresh();
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: '#f8f9fa',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <MainLayout>
      <PusherProvider>
        <Box
          sx={{
            display: 'flex',
            height: '100%',
            pt: 10, // 避免被 TopBar 擋住
            px: 3,
            pb: 3,
            gap: 2,
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
        {/* 左側欄 - 好友列表和訊息 */}
        <Box
          sx={{
            width: { xs: selectedChat ? 0 : '100%', md: 380 },
            minWidth: { md: 380 },
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#ffffff',
            transition: 'width 0.3s ease',
            overflow: 'hidden',
          }}
        >
          {/* 好友列表 */}
          <Box
            sx={{
              flex: '0 0 auto',
              maxHeight: '45%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <FriendsList
              key={`friends-${refreshKey}`}
              onSelectFriend={(friend) => {
                handleSelectChat({
                  roomId: '', // 會在 ChatRoom 中建立
                  type: 'private',
                  name: friend.name || friend.userId || '用戶',
                  avatar: friend.avatar || undefined,
                  friendId: friend.id,
                });
              }}
              onViewProfile={handleViewProfile}
            />
          </Box>

          {/* 訊息列表 */}
          <Box
            sx={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <MessageList
              key={`messages-${refreshKey}`}
              onSelectChat={handleSelectChat}
              selectedRoomId={selectedChat?.roomId}
              onCreateGroup={() => setCreateGroupOpen(true)}
            />
          </Box>
        </Box>

        {/* 右側欄 - 好友請求或聊天室 */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#ffffff',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}
        >
          {selectedChat ? (
            <ChatRoom
              roomId={selectedChat.roomId}
              friendId={selectedChat.friendId}
              name={selectedChat.name}
              avatar={selectedChat.avatar}
              type={selectedChat.type}
              onClose={handleCloseChat}
              onRoomCreated={(newRoomId) => {
                setSelectedChat(prev => prev ? { ...prev, roomId: newRoomId } : null);
              }}
              onViewProfile={handleViewProfile}
            />
          ) : (
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                p: 3,
              }}
            >
              {/* 好友請求 */}
              <FriendRequests
                key={`requests-${refreshKey}`}
                onRequestHandled={handleRefresh}
                onViewProfile={handleViewProfile}
              />

              {/* 推薦好友 */}
              <Box sx={{ mt: 4 }}>
                <FriendSuggestions
                  key={`suggestions-${refreshKey}`}
                  onRequestSent={handleRefresh}
                  onViewProfile={handleViewProfile}
                />
              </Box>
            </Box>
          )}
        </Box>
      </Box>
      
      {/* 用戶資料 Modal */}
      <UserProfileModal
        open={userProfileOpen}
        onClose={() => setUserProfileOpen(false)}
        userId={selectedUserId}
        onStartChat={handleStartChatFromProfile}
        onFriendRemoved={handleRefresh}
      />
      
      {/* 建立群組 Modal */}
      <CreateGroupModal
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onGroupCreated={handleGroupCreated}
      />
      </PusherProvider>
    </MainLayout>
  );
}

