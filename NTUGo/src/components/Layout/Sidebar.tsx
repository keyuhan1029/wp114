'use client';

import * as React from 'react';
import { styled, Theme, CSSObject } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import PedalBikeIcon from '@mui/icons-material/PedalBike';
import DirectionsSubwayIcon from '@mui/icons-material/DirectionsSubway';
import ForumIcon from '@mui/icons-material/Forum';

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

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const menuItems = [
    { text: '目錄', icon: <MenuIcon />, action: handleDrawerToggle },
    { text: '公車', icon: <DirectionsBusIcon /> },
    { text: 'YouBike', icon: <PedalBikeIcon /> },
    { text: '捷運', icon: <DirectionsSubwayIcon /> },
    { text: '論壇', icon: <ForumIcon /> },
  ];

  return (
    <Drawer variant="permanent" open={open}>
      <List sx={{ pt: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
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
