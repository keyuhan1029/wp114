'use client';

import * as React from 'react';
import { styled, Theme, CSSObject } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import HomeIcon from '@mui/icons-material/Home';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import PedalBikeIcon from '@mui/icons-material/PedalBike';
import DirectionsSubwayIcon from '@mui/icons-material/DirectionsSubway';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import EmailIcon from '@mui/icons-material/Email';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useMapContext } from '@/contexts/MapContext';
import { useRouter } from 'next/navigation';

const drawerWidth = 240;

// 黑白風格 - 展開時
const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
  backgroundColor: '#1a1a1a', // 深黑灰背景
  color: '#ffffff',
  borderRight: '1px solid #333333',
});

// 黑白風格 - 收合時
const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
  backgroundColor: '#1a1a1a', // 深黑灰背景
  color: '#ffffff',
  borderRight: '1px solid #333333',
});

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

export default function Sidebar() {
  const [open, setOpen] = React.useState(false);
  const { showYouBikeStations, setShowYouBikeStations, showBusStops, setShowBusStops, showMetroStations, setShowMetroStations } = useMapContext();
  const router = useRouter();

  const handleHomeClick = React.useCallback(() => {
    router.push('/');
  }, [router]);

  const handleMouseEnter = React.useCallback(() => {
    setOpen(true);
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    setOpen(false);
  }, []);

  const handleYouBikeClick = React.useCallback(() => {
    setShowYouBikeStations(!showYouBikeStations);
  }, [showYouBikeStations, setShowYouBikeStations]);

  const handleBusClick = React.useCallback(() => {
    setShowBusStops(!showBusStops);
  }, [showBusStops, setShowBusStops]);

  const handleMetroClick = React.useCallback(() => {
    setShowMetroStations(!showMetroStations);
  }, [showMetroStations, setShowMetroStations]);

  const handleCommunityClick = React.useCallback(() => {
    router.push('/community');
  }, [router]);

  const handleNTUCOOLClick = React.useCallback(() => {
    window.open('https://cool.ntu.edu.tw/login/portal?message=%E5%9C%A8%E6%82%A8%E7%9A%84%20IdP%20%E7%99%BB%E5%87%BA%E6%99%82%E5%87%BA%E7%8F%BE%E5%95%8F%E9%A1%8C', '_blank');
  }, []);

  const handleNTUMailClick = React.useCallback(() => {
    window.open('https://wmail1.cc.ntu.edu.tw/rc/index.php', '_blank');
  }, []);

  const handleAnnouncementsClick = React.useCallback(() => {
    router.push('/announcements');
  }, [router]);

  const handleNTUCourseClick = React.useCallback(() => {
    window.open('https://course.ntu.edu.tw/', '_blank');
  }, []);

  const menuItems = React.useMemo(() => [
    { text: '主頁', icon: <HomeIcon />, action: handleHomeClick, active: false },
    { text: '公車', icon: <DirectionsBusIcon />, action: handleBusClick, active: showBusStops },
    { text: 'YouBike', icon: <PedalBikeIcon />, action: handleYouBikeClick, active: showYouBikeStations },
    { text: '捷運', icon: <DirectionsSubwayIcon />, action: handleMetroClick, active: showMetroStations },
    { text: '社群', icon: <PeopleIcon />, action: handleCommunityClick, active: false },
    { text: '活動', icon: <AnnouncementIcon />, action: handleAnnouncementsClick, active: false },
    { text: 'NTU COOL', icon: <SchoolIcon />, action: handleNTUCOOLClick, active: false },
    { text: 'NTU Mail', icon: <EmailIcon />, action: handleNTUMailClick, active: false },
    { text: '臺大課程網', icon: <MenuBookIcon />, action: handleNTUCourseClick, active: false },
  ], [handleHomeClick, handleBusClick, handleYouBikeClick, handleMetroClick, handleCommunityClick, handleAnnouncementsClick, handleNTUCOOLClick, handleNTUMailClick, handleNTUCourseClick, showBusStops, showYouBikeStations, showMetroStations]);

  return (
    <Drawer 
      variant="permanent" 
      open={open}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <List sx={{ pt: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                backgroundColor: item.active ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)', // 白色懸停效果
                },
              }}
              onClick={item.action ? item.action : undefined}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                  color: '#ffffff', // 白色圖標
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{ opacity: open ? 1 : 0, color: '#ffffff' }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
