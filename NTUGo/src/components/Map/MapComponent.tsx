'use client';

import * as React from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { NTU_CENTER, LOCATIONS } from '@/data/mockData';
import InfoWindowHeader from './InfoWindowHeader';
import InfoWindowContent from './InfoWindowContent';
import CurrentLocationButton from './CurrentLocationButton';
import BikeMarkerButton from './BikeMarkerButton';
import BikeMarkerPhotoDialog from './BikeMarkerPhotoDialog';
import SVGOverlay from './SVGOverlay';
import { MAIN_BUILDINGS, OTHER_BUILDINGS, isMainBuilding, type MainBuilding, type OtherBuilding } from '@/data/buildings';
import { 
  groupFriendsByBuilding, 
  type FriendLocationInfo, 
  type BuildingWithFriends 
} from '@/lib/utils/locationParser';
import {
  fetchYouBikeStations,
  findStationByName,
  findStationByLocation,
  type YouBikeStation,
} from '@/services/youbikeApi';
import {
  fetchBusStopsNearNTU,
  fetchBusRealTimeInfo,
  type BusStop,
  type BusRealTimeInfo,
} from '@/services/busApi';
import {
  getMetroStations,
  fetchMetroTimetable,
  fetchMetroStationTimeTable,
  fetchMetroStationExits,
  type MetroFirstLastTimetable,
  type MetroStationTimeTable,
  type MetroStationExit,
} from '@/services/metroApi';
import { useMapContext } from '@/contexts/MapContext';

const containerStyle = {
  width: '100%',
  height: '100%',
};

// 自訂校園地標圖示（使用 SVG path）
// 總圖書館 icon（對應 NTUMainLibrary.svg）
const NTU_MAIN_LIBRARY_PATH =
  'M 250 50 L 450 50 L 450 200 L 500 200 L 500 550 L 50 550 L 50 200 L 250 200 Z';
const NTU_MAIN_LIBRARY_VIEWBOX = '0 0 500 600';

// 社科院大樓 T 字型 icon（對應 socialsciences.svg）
const SOCIAL_SCIENCE_PATH =
  'M 20 20 L 580 20 L 580 150 L 420 150 L 420 380 L 240 380 L 240 150 L 20 150 Z';
const SOCIAL_SCIENCE_VIEWBOX = '0 0 600 400';

// 總圖書館經緯度邊界（你指定的範圍）
const LIBRARY_BOUNDS = {
  north: 25.017916,
  south: 25.017039,
  east: 121.541376,
  west: 121.540522,
};

// 社科院大樓經緯度邊界
const SOCIAL_SCIENCE_BOUNDS = {
  north: 25.020919905149086,
  south: 25.02022667108943,
  east: 121.54316105756216,
  west: 121.54151168678216,
};

// Google Maps Styling: 
// 1. 全地圖灰階
// 2. 隱藏所有 POI (包括建築物) 在全地圖
// 3. 隱藏 Google 原生的 clickable POI pins
const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  clickableIcons: false, // Disable Google native POI pins
  styles: [
    // 1. 全地圖灰階基礎
    {
      featureType: 'all',
      elementType: 'all',
      stylers: [{ saturation: -100 }],
    },
    // 2. 隱藏所有 POI 標籤
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    // 3. 隱藏所有 POI 建築物 (全域隱藏，之後用 Polygon 在台大範圍內顯示)
    {
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [{ visibility: 'off' }],
    },
    // 4. 隱藏 landscape.man_made (人造建築)
    {
      featureType: 'landscape.man_made',
      elementType: 'geometry',
      stylers: [{ visibility: 'off' }],
    },
    // 4.1 隱藏建築物標籤（小字）
    {
      featureType: 'landscape.man_made',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    // 4.2 隱藏所有建築物相關標籤
    {
      featureType: 'poi.business',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'poi.school',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'poi.government',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    // 5. 道路保持可見
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ visibility: 'on' }, { lightness: 50 }],
    },
    // 6. 水域淡灰色
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#c9c9c9' }],
    },
    // 7. 保留公車站 (transit.station.bus)
    {
      featureType: 'transit.station.bus',
      elementType: 'all',
      stylers: [{ visibility: 'on' }],
    },
    // 8. 隱藏其他 transit 標籤 (捷運等)
    {
      featureType: 'transit',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
  tilt: 45,
};

export default function MapComponent() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const { showYouBikeStations, showBusStops, showMetroStations } = useMapContext();
  const [selectedMarker, setSelectedMarker] = React.useState<any>(null);
  const [map, setMap] = React.useState<google.maps.Map | null>(null);
  
  // 防抖：避免快速點擊時重複請求
  const busStopRequestRef = React.useRef<string | null>(null);
  const busStopRequestTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [youbikeStations, setYoubikeStations] = React.useState<YouBikeStation[]>([]);
  const [youbikeLoading, setYoubikeLoading] = React.useState<boolean>(false);
  const [youbikeError, setYoubikeError] = React.useState<string | null>(null);
  const [selectedYouBikeStation, setSelectedYouBikeStation] = React.useState<YouBikeStation | null>(null);
  const [visibleYouBikeStations, setVisibleYouBikeStations] = React.useState<YouBikeStation[]>([]);
  
  // 公車相關 state
  const [busStops, setBusStops] = React.useState<BusStop[]>([]);
  const [busLoading, setBusLoading] = React.useState<boolean>(false);
  const [busError, setBusError] = React.useState<string | null>(null);
  const [visibleBusStops, setVisibleBusStops] = React.useState<BusStop[]>([]);
  const [selectedBusStop, setSelectedBusStop] = React.useState<BusStop | null>(null);
  const [busRealTimeInfo, setBusRealTimeInfo] = React.useState<BusRealTimeInfo[]>([]);
  const [busRealTimeLoading, setBusRealTimeLoading] = React.useState<boolean>(false);
  
  // 當前位置相關 state
  const [currentLocation, setCurrentLocation] = React.useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = React.useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = React.useState<boolean>(false);
  
  // 體育館人數相關 state
  const [gymOccupancy, setGymOccupancy] = React.useState<{
    fitnessCenter: { current: number; optimal: number; max: number };
    swimmingPool: { current: number; optimal: number; max: number };
    status: string;
    totalCurrent: number;
    totalMax: number;
    lastUpdated: string;
  } | null>(null);
  const [gymLoading, setGymLoading] = React.useState<boolean>(false);
  const [gymError, setGymError] = React.useState<string | null>(null);

  // 圖書館資訊相關 state
  const [libraryInfo, setLibraryInfo] = React.useState<{
    openingHours: { today: string; status: string; hours: string };
    studyRoom: { occupied: number; available: number; total: number };
    lastUpdated: string;
  } | null>(null);
  const [libraryLoading, setLibraryLoading] = React.useState<boolean>(false);
  const [libraryError, setLibraryError] = React.useState<string | null>(null);

  // 捷運相關 state
  const [metroStations] = React.useState(getMetroStations());
  const [visibleMetroStations, setVisibleMetroStations] = React.useState<typeof metroStations>([]);
  const [selectedMetroStation, setSelectedMetroStation] = React.useState<typeof metroStations[0] | null>(null);
  const [metroTimetable, setMetroTimetable] = React.useState<MetroFirstLastTimetable[]>([]);
  const [metroLoading, setMetroLoading] = React.useState<boolean>(false);
  const [metroError, setMetroError] = React.useState<string | null>(null);
  const [metroStationTimeTable, setMetroStationTimeTable] = React.useState<MetroStationTimeTable[]>([]);
  const [metroStationTimeTableLoading, setMetroStationTimeTableLoading] = React.useState<boolean>(false);
  const [metroStationTimeTableError, setMetroStationTimeTableError] = React.useState<string | null>(null);
  // 捷運站出口相關 state
  const [metroExits, setMetroExits] = React.useState<MetroStationExit[]>([]);
  const [metroExitsLoading, setMetroExitsLoading] = React.useState<boolean>(false);
  const [metroExitsError, setMetroExitsError] = React.useState<string | null>(null);

  // 用戶標記的腳踏車位置相關 state
  interface UserBikeMarker {
    _id: string;
    lat: number;
    lng: number;
    note?: string;
    imageUrl?: string;
    imagePublicId?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  const [isMarkingMode, setIsMarkingMode] = React.useState<boolean>(false);
  const [userBikeMarkers, setUserBikeMarkers] = React.useState<UserBikeMarker[]>([]);
  const [markerLoading, setMarkerLoading] = React.useState<boolean>(false);
  const [selectedUserMarker, setSelectedUserMarker] = React.useState<UserBikeMarker | null>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = React.useState<boolean>(false);
  const [pendingMarkerLocation, setPendingMarkerLocation] = React.useState<{ lat: number; lng: number } | null>(null);

  // 朋友位置追蹤相關 state
  const [friendsInBuildings, setFriendsInBuildings] = React.useState<Map<string, BuildingWithFriends>>(new Map());
  const [friendsLoading, setFriendsLoading] = React.useState<boolean>(false);
  const friendsPollingRef = React.useRef<NodeJS.Timeout | null>(null);

  const onLoad = React.useCallback(function callback(map: google.maps.Map) {
    setMap(map);
    // 地圖載入完成後自動獲取當前位置
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      setLocationError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(location);
          setIsGettingLocation(false);

          // 將地圖中心移動到當前位置
          map.setCenter(location);
          map.setZoom(17);
        },
        (error) => {
          setIsGettingLocation(false);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationError('已拒絕地理定位權限，請在瀏覽器設定中允許位置存取');
              break;
            case error.POSITION_UNAVAILABLE:
              setLocationError('無法取得位置資訊');
              break;
            case error.TIMEOUT:
              setLocationError('取得位置資訊逾時');
              break;
            default:
              setLocationError('取得位置資訊時發生錯誤');
              break;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }
  }, []);

  const onUnmount = React.useCallback(function callback() {
    setMap(null);
  }, []);

  // 載入用戶標記的腳踏車位置
  const loadUserBikeMarkers = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/map/bike-markers', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 每個用戶只能有一個標記
          setUserBikeMarkers(data.marker ? [data.marker] : []);
        }
      }
    } catch (error) {
      console.error('載入用戶標記失敗:', error);
    }
  }, []);

  // 獲取朋友上課位置
  const fetchFriendsLocations = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      setFriendsLoading(true);

      // 先獲取好友列表
      const friendsResponse = await fetch('/api/community/friends', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!friendsResponse.ok) {
        console.error('獲取好友列表失敗');
        return;
      }

      const friendsData = await friendsResponse.json();
      const friendsList = friendsData.friends || [];

      if (friendsList.length === 0) {
        setFriendsInBuildings(new Map());
        return;
      }

      // 獲取所有好友的狀態
      const friendIds = friendsList.map((f: any) => f.friend.id);
      const statusResponse = await fetch('/api/community/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds: friendIds }),
      });

      if (!statusResponse.ok) {
        console.error('獲取好友狀態失敗');
        return;
      }

      const statusData = await statusResponse.json();
      const statuses = statusData.statuses || {};

      // 收集有位置資訊的朋友
      const friendLocations: FriendLocationInfo[] = [];
      for (const friendItem of friendsList) {
        const friendId = friendItem.friend.id;
        const status = statuses[friendId];
        
        if (status && status.status === 'in class' && status.location) {
          friendLocations.push({
            friendId,
            friendName: friendItem.friend.name || friendItem.friend.userId || '朋友',
            location: status.location,
            courseName: status.courseName || undefined,
          });
        }
      }

      // 按建築物分組
      const grouped = groupFriendsByBuilding(friendLocations);
      setFriendsInBuildings(grouped);
    } catch (error) {
      console.error('獲取朋友位置失敗:', error);
    } finally {
      setFriendsLoading(false);
    }
  }, []);

  // 定期獲取朋友位置（每 30 秒）
  React.useEffect(() => {
    // 初始獲取
    fetchFriendsLocations();

    // 設定定期輪詢
    friendsPollingRef.current = setInterval(() => {
      fetchFriendsLocations();
    }, 30000);

    return () => {
      if (friendsPollingRef.current) {
        clearInterval(friendsPollingRef.current);
      }
    };
  }, [fetchFriendsLocations]);

  // 在地圖上添加標記
  const handleMapClick = React.useCallback((e: google.maps.MapMouseEvent) => {
    if (!isMarkingMode || !e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    // 打開照片上傳對話框
    setPendingMarkerLocation({ lat, lng });
    setPhotoDialogOpen(true);
  }, [isMarkingMode]);

  // 確認創建標記（包含照片信息）
  const handleConfirmMarker = React.useCallback(async (imageUrl: string | null, imagePublicId: string | null) => {
    if (!pendingMarkerLocation) return;

    try {
      setMarkerLoading(true);
      setPhotoDialogOpen(false);
      const token = localStorage.getItem('token');
      if (!token) {
        alert('請先登入');
        setIsMarkingMode(false);
        setPendingMarkerLocation(null);
        return;
      }

      const response = await fetch('/api/map/bike-markers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lat: pendingMarkerLocation.lat,
          lng: pendingMarkerLocation.lng,
          imageUrl: imageUrl || undefined,
          imagePublicId: imagePublicId || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 替換舊標記（每個用戶只能有一個標記）
          setUserBikeMarkers(data.marker ? [data.marker] : []);
          // 標記後自動關閉標記模式
          setIsMarkingMode(false);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || '標記失敗');
      }
    } catch (error) {
      console.error('添加標記失敗:', error);
      alert('添加標記失敗');
    } finally {
      setMarkerLoading(false);
      setPendingMarkerLocation(null);
    }
  }, [pendingMarkerLocation]);

  // 取消標記
  const handleCancelMarker = React.useCallback(() => {
    setPhotoDialogOpen(false);
    setPendingMarkerLocation(null);
  }, []);

  // 刪除用戶標記
  const handleDeleteUserMarker = React.useCallback(async (markerId: string) => {
    if (!window.confirm('確定要刪除此標記嗎？')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('請先登入');
        return;
      }

      const response = await fetch(`/api/map/bike-markers/${markerId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setUserBikeMarkers((prev) => prev.filter((m) => m._id !== markerId));
        setSelectedUserMarker(null);
        setSelectedMarker(null);
      } else {
        const errorData = await response.json();
        alert(errorData.message || '刪除失敗');
      }
    } catch (error) {
      console.error('刪除標記失敗:', error);
      alert('刪除標記失敗');
    }
  }, []);

  // 載入用戶標記（組件載入時）
  React.useEffect(() => {
    if (isLoaded) {
      loadUserBikeMarkers();
    }
  }, [isLoaded, loadUserBikeMarkers]);

  // 獲取當前位置
  const getCurrentLocation = React.useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('您的瀏覽器不支援地理定位功能');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentLocation(location);
        setIsGettingLocation(false);

        // 將地圖中心移動到當前位置
        if (map) {
          map.setCenter(location);
          map.setZoom(17);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('已拒絕地理定位權限，請在瀏覽器設定中允許位置存取');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('無法取得位置資訊');
            break;
          case error.TIMEOUT:
            setLocationError('取得位置資訊逾時');
            break;
          default:
            setLocationError('取得位置資訊時發生錯誤');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [map]);

  // 返回當前位置
  const returnToCurrentLocation = React.useCallback(() => {
    if (currentLocation && map) {
      map.setCenter(currentLocation);
      map.setZoom(17);
    } else {
      getCurrentLocation();
    }
  }, [currentLocation, map, getCurrentLocation]);

  // 獲取體育館人數資訊
  const fetchGymOccupancy = React.useCallback(async () => {
    try {
      setGymLoading(true);
      setGymError(null);
      setGymOccupancy(null); // 清除舊數據
      
      const response = await fetch('/api/gym/occupancy');
      
      // 檢查 HTTP 狀態碼
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setGymError(errorData.message || `服務器錯誤 (${response.status})`);
        setGymOccupancy(null);
        return;
      }
      
      const data = await response.json();
      console.log('體育館人數 API 響應:', data);
      
      if (data.success && data.data) {
        setGymOccupancy({
          ...data.data,
          status: data.status,
          totalCurrent: data.totalCurrent,
          totalMax: data.totalMax,
        });
        setGymError(null); // 清除錯誤
      } else {
        setGymError(data.message || '無法獲取體育館人數資訊');
        setGymOccupancy(null);
      }
    } catch (error: any) {
      console.error('獲取體育館人數資訊失敗:', error);
      setGymError(error.message || '獲取體育館人數資訊時發生錯誤，請稍後再試');
      setGymOccupancy(null);
    } finally {
      setGymLoading(false);
    }
  }, []);

  // 處理建築物點擊
  const handleBuildingClick = React.useCallback((building: MainBuilding | OtherBuilding) => {
    const friendsInThisBuilding = friendsInBuildings.get(building.id);
    const friendsList = friendsInThisBuilding?.friends || [];
    
    // 如果是綜合體育館，也獲取健身房人流資訊
    if (building.id === 'sports_center') {
      fetchGymOccupancy();
    }

    // 如果是社科院大樓，獲取社科圖座位資訊（帶載入動畫）
    if (building.id === 'social') {
      setLibraryLoading(true);
      setLibraryError(null);
      setLibraryInfo(null);
      
      fetch('/api/library/info')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setLibraryInfo(data.data);
            setLibraryError(null);
          } else {
            setLibraryError(data.message || '無法獲取社科圖資訊');
          }
        })
        .catch(err => {
          console.error('獲取社科圖資訊失敗:', err);
          setLibraryError('獲取社科圖資訊時發生錯誤');
        })
        .finally(() => {
          setLibraryLoading(false);
        });
    }
    
    if (isMainBuilding(building)) {
      // 主要建築物使用 SVG 覆蓋層，計算中心點
      const centerLat = (building.bounds.north + building.bounds.south) / 2;
      const centerLng = (building.bounds.east + building.bounds.west) / 2;
      
      setSelectedMarker({
        id: building.id,
        name: building.name,
        lat: centerLat,
        lng: centerLng,
        type: building.id === 'sports_center' ? 'gym' : 'building',
        friendsList,
        hasFriends: friendsList.length > 0,
      });
    } else {
      setSelectedMarker({
        id: building.id,
        name: building.name,
        lat: building.lat,
        lng: building.lng,
        type: building.id === 'social' ? 'social-building' : 'building',
        friendsList,
        hasFriends: friendsList.length > 0,
      });
    }
  }, [friendsInBuildings, fetchGymOccupancy]);

  // 獲取圖書館資訊
  const fetchLibraryInfo = React.useCallback(async () => {
    try {
      setLibraryLoading(true);
      setLibraryError(null);
      setLibraryInfo(null); // 清除舊數據
      
      const response = await fetch('/api/library/info');
      
      // 檢查 HTTP 狀態碼
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setLibraryError(errorData.message || `服務器錯誤 (${response.status})`);
        setLibraryInfo(null);
        return;
      }
      
      const data = await response.json();
      console.log('圖書館資訊 API 響應:', data);
      
      if (data.success && data.data) {
        setLibraryInfo(data.data);
        setLibraryError(null); // 清除錯誤
      } else {
        setLibraryError(data.message || '無法獲取圖書館資訊');
        setLibraryInfo(null);
      }
    } catch (error: any) {
      console.error('獲取圖書館資訊失敗:', error);
      setLibraryError(error.message || '獲取圖書館資訊時發生錯誤，請稍後再試');
      setLibraryInfo(null);
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  // 處理圖書館點擊
  const handleLibraryClick = React.useCallback(() => {
    const libraryItem = LOCATIONS.campus.find((c) => c.type === 'library');
    if (libraryItem) {
      setSelectedMarker(libraryItem);
      fetchLibraryInfo();
    }
  }, [fetchLibraryInfo]);

  // 處理社科院大樓點擊
  const handleSocialScienceClick = React.useCallback(() => {
    // 獲取社科院的朋友上課資訊
    const friendsInSocialScience = friendsInBuildings.get('social');
    const friendsList = friendsInSocialScience?.friends || [];
    
    // 計算中心點
    const centerLat = (SOCIAL_SCIENCE_BOUNDS.north + SOCIAL_SCIENCE_BOUNDS.south) / 2;
    const centerLng = (SOCIAL_SCIENCE_BOUNDS.east + SOCIAL_SCIENCE_BOUNDS.west) / 2;
    
    // 設置 selectedMarker
    setSelectedMarker({
      id: 'social',
      name: '社科院大樓',
      lat: centerLat,
      lng: centerLng,
      type: 'social-building',
      friendsList,
      hasFriends: friendsList.length > 0,
    });
    
    // 獲取社科圖座位資訊（帶載入動畫）
    setLibraryLoading(true);
    setLibraryError(null);
    setLibraryInfo(null);
    
    fetch('/api/library/info')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setLibraryInfo(data.data);
          setLibraryError(null);
        } else {
          setLibraryError(data.message || '無法獲取社科圖資訊');
        }
      })
      .catch(err => {
        console.error('獲取社科圖資訊失敗:', err);
        setLibraryError('獲取社科圖資訊時發生錯誤');
      })
      .finally(() => {
        setLibraryLoading(false);
      });
  }, [friendsInBuildings]);

  // 計算兩點間距離（公里）- 使用 Haversine 公式
  const calculateDistance = React.useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // 地球半徑（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // 台大圖書館座標
  const libraryLocation = React.useMemo(() => ({
    lat: 25.0175,
    lng: 121.539,
  }), []);

  // 載入 YouBike 站點資料（只載入台大圖書館2公里內的站點）
  React.useEffect(() => {
    const loadYouBikeStations = async () => {
      try {
        setYoubikeLoading(true);
        setYoubikeError(null);
        const stations = await fetchYouBikeStations();
        
        // 過濾出距離台大圖書館2公里內的站點
        const nearbyStations = stations.filter((station) => {
          const distance = calculateDistance(
            libraryLocation.lat,
            libraryLocation.lng,
            station.lat,
            station.lng
          );
          return distance <= 1; // 2公里
        }); 
        
        setYoubikeStations(nearbyStations);
      } catch (error) {
        console.error('載入 YouBike 資料失敗:', error);
        setYoubikeError('無法載入 YouBike 站點資料');
      } finally {
        setYoubikeLoading(false);
      }
    };

    if (isLoaded) {
      loadYouBikeStations();
    }
  }, [isLoaded, calculateDistance, libraryLocation]);

  // 載入公車站牌資料
  React.useEffect(() => {
    const loadBusStops = async () => {
      if (!showBusStops) {
        setBusStops([]);
        setVisibleBusStops([]);
        return;
      }

      try {
        setBusLoading(true);
        setBusError(null);
        const stops = await fetchBusStopsNearNTU();
        setBusStops(stops);
      } catch (error) {
        console.error('載入公車站牌資料失敗:', error);
        setBusError('無法載入公車站牌資料');
      } finally {
        setBusLoading(false);
      }
    };

    if (isLoaded && showBusStops) {
      loadBusStops();
    }
  }, [isLoaded, showBusStops]);

  // 使用 ref 存储最新的值，避免依赖项变化导致无限循环
  const showYouBikeStationsRef = React.useRef(showYouBikeStations);
  const showBusStopsRef = React.useRef(showBusStops);
  const showMetroStationsRef = React.useRef(showMetroStations);
  const youbikeStationsRef = React.useRef(youbikeStations);
  const busStopsRef = React.useRef(busStops);
  const metroStationsRef = React.useRef(metroStations);
  const updateStationsTriggerRef = React.useRef<(() => void) | null>(null);

  // 更新 refs（不触发更新，避免循环）
  React.useEffect(() => {
    showYouBikeStationsRef.current = showYouBikeStations;
    showBusStopsRef.current = showBusStops;
    showMetroStationsRef.current = showMetroStations;
    youbikeStationsRef.current = youbikeStations;
    busStopsRef.current = busStops;
    metroStationsRef.current = metroStations;
  }, [showYouBikeStations, showBusStops, showMetroStations, youbikeStations, busStops, metroStations]);

  // 当状态改变时，触发一次更新（使用单独的 useEffect 避免循环）
  React.useEffect(() => {
    if (updateStationsTriggerRef.current && map) {
      updateStationsTriggerRef.current();
    }
  }, [showYouBikeStations, showBusStops, showMetroStations, map]);

  // 當 showYouBikeStations、showBusStops、showMetroStations 或地圖範圍變化時，更新可見站點
  // 注意：youbikeStations 已經過濾為台大圖書館2公里內的站點
  React.useEffect(() => {
    if (!map) return;

    let timeoutId: NodeJS.Timeout | null = null;

    const updateVisibleStations = () => {
      // 清除之前的 timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // 防抖：延迟 100ms 执行
      timeoutId = setTimeout(() => {
        if (showYouBikeStationsRef.current && youbikeStationsRef.current.length > 0) {
          const bounds = map.getBounds();
          if (bounds) {
            // 只顯示在地圖視窗內且已在2公里範圍內的站點
            const visible = youbikeStationsRef.current.filter((station) => {
              const latLng = new google.maps.LatLng(station.lat, station.lng);
              return bounds.contains(latLng);
            });
            setVisibleYouBikeStations(visible);
          }
        } else {
          setVisibleYouBikeStations([]);
        }

        // 更新可見的公車站牌
        if (showBusStopsRef.current && busStopsRef.current.length > 0) {
          const bounds = map.getBounds();
          if (bounds) {
            const visible = busStopsRef.current.filter((stop) => {
              const latLng = new google.maps.LatLng(
                stop.StopPosition.PositionLat,
                stop.StopPosition.PositionLon
              );
              return bounds.contains(latLng);
            });
            setVisibleBusStops(visible);
          }
        } else {
          setVisibleBusStops([]);
        }

        // 更新可見的捷運站
        if (showMetroStationsRef.current && metroStationsRef.current.length > 0) {
          const bounds = map.getBounds();
          if (bounds) {
            const visible = metroStationsRef.current.filter((station) => {
              const latLng = new google.maps.LatLng(station.lat, station.lng);
              return bounds.contains(latLng);
            });
            setVisibleMetroStations(visible);
          }
        } else {
          setVisibleMetroStations([]);
        }
      }, 100);
    };

    // 存储更新函数到 ref，以便外部触发
    updateStationsTriggerRef.current = updateVisibleStations;

    // 初始更新
    updateVisibleStations();

    // 監聽地圖範圍變化
    const boundsListener = map.addListener('bounds_changed', updateVisibleStations);
    const zoomListener = map.addListener('zoom_changed', updateVisibleStations);
    const centerListener = map.addListener('center_changed', updateVisibleStations);

    // 清理監聽器
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      updateStationsTriggerRef.current = null;
      google.maps.event.removeListener(boundsListener);
      google.maps.event.removeListener(zoomListener);
      google.maps.event.removeListener(centerListener);
    };
  }, [map]);

  // 當顯示捷運站時，獲取所有車站的出口數據
  React.useEffect(() => {
    if (!showMetroStations || metroStations.length === 0) {
      setMetroExits([]);
      return;
    }

    const fetchAllStationExits = async () => {
      setMetroExitsLoading(true);
      setMetroExitsError(null);
      
      try {
        // 並行獲取所有車站的出口數據
        const exitPromises = metroStations.map(async (station) => {
          const cleanStationName = station.name.replace('站', '').trim();
          const isTransferStation = (station as any).isTransfer === true;
          const queryStationId = isTransferStation ? '' : station.stationId;
          const queryStationName = isTransferStation ? cleanStationName : '';
          
          return fetchMetroStationExits(queryStationId, queryStationName);
        });
        
        const allExits = await Promise.all(exitPromises);
        // 合併所有出口數據
        const mergedExits = allExits.flat();
        setMetroExits(mergedExits);
      } catch (error) {
        console.error('獲取捷運站出口數據失敗:', error);
        setMetroExitsError('無法獲取出口資訊');
      } finally {
        setMetroExitsLoading(false);
      }
    };

    fetchAllStationExits();
  }, [showMetroStations, metroStations]);

  // 處理公車站牌點擊事件（優化：添加防抖和請求去重）
  const handleBusStopClick = React.useCallback(async (stop: BusStop) => {
    const stopName = stop.StopName.Zh_tw;
    
    // 立即更新 UI（不等待 API 請求）
    setSelectedMarker({
      id: stop.StopUID,
      name: stopName,
      lat: stop.StopPosition.PositionLat,
      lng: stop.StopPosition.PositionLon,
      type: 'bus',
    });
    setSelectedBusStop(stop);
    
    // 如果正在請求相同的站點，取消之前的請求
    if (busStopRequestRef.current === stopName) {
      if (busStopRequestTimeoutRef.current) {
        clearTimeout(busStopRequestTimeoutRef.current);
      }
    }
    
    busStopRequestRef.current = stopName;
    
    // 清除之前的數據
    setBusRealTimeInfo([]);
    
    // 防抖：延遲 100ms 後再請求（避免快速點擊）
    if (busStopRequestTimeoutRef.current) {
      clearTimeout(busStopRequestTimeoutRef.current);
    }
    
    busStopRequestTimeoutRef.current = setTimeout(async () => {
      try {
        setBusRealTimeLoading(true);
        // 使用站名查詢，但使用嚴格匹配（完全相同的站名）
        // 這樣可以獲取所有同名站點的路線，但不會誤匹配部分相同的站名
        const realTimeInfo = await fetchBusRealTimeInfo(stopName, true);
        
        // 確保請求的站點仍然是當前選中的站點（避免異步競態條件）
        if (busStopRequestRef.current === stopName) {
          setBusRealTimeInfo(realTimeInfo);
        }
      } catch (error) {
        console.error('獲取公車即時資訊失敗:', error);
      } finally {
        if (busStopRequestRef.current === stopName) {
          setBusRealTimeLoading(false);
        }
      }
    }, 100);
  }, []);
  
  // 清理 timeout（組件卸載時）
  React.useEffect(() => {
    return () => {
      if (busStopRequestTimeoutRef.current) {
        clearTimeout(busStopRequestTimeoutRef.current);
      }
    };
  }, []);

  // 處理 bike pin 點擊事件
  const handleBikePinClick = React.useCallback(async (item: any) => {
    setSelectedMarker(item);
    setSelectedYouBikeStation(null);

    // 如果已經有載入的站點資料，直接查找
    if (youbikeStations.length > 0) {
      // 先嘗試根據名稱匹配
      let station = findStationByName(youbikeStations, item.name);
      
      // 如果名稱匹配失敗，嘗試根據座標匹配
      if (!station) {
        station = findStationByLocation(youbikeStations, item.lat, item.lng, 0.01);
      }

      if (station) {
        setSelectedYouBikeStation(station);
      }
    } else {
      // 如果還沒有載入資料，嘗試獲取
      try {
        setYoubikeLoading(true);
        const stations = await fetchYouBikeStations();
        setYoubikeStations(stations);
        
        let station = findStationByName(stations, item.name);
        if (!station) {
          station = findStationByLocation(stations, item.lat, item.lng, 0.01);
        }

        if (station) {
          setSelectedYouBikeStation(station);
        }
      } catch (error) {
        console.error('獲取 YouBike 資料失敗:', error);
        setYoubikeError('無法獲取站點資訊');
      } finally {
        setYoubikeLoading(false);
      }
    }
  }, [youbikeStations]);

  // 處理捷運站點擊事件 - 獲取出口數據
  const handleMetroStationClick = React.useCallback(async (station: typeof metroStations[0]) => {
    setSelectedMetroStation(station);
    setMetroTimetable([]);
    setMetroError(null);
    setMetroStationTimeTable([]);
    setMetroStationTimeTableError(null);
    setMetroExits([]);
    setMetroExitsError(null);

    const cleanStationName = station.name.replace('站', '').trim();
    const isTransferStation = (station as any).isTransfer === true;
    const queryStationId = isTransferStation ? '' : station.stationId;
    const queryStationName = isTransferStation ? cleanStationName : '';

    // 並行獲取首末班車時刻表、列車時刻表和出口資訊
    try {
      setMetroLoading(true);
      setMetroStationTimeTableLoading(true);
      setMetroExitsLoading(true);
      
      const timetablePromise = fetchMetroTimetable(queryStationId, queryStationName);
      const stationTimeTablePromise = fetchMetroStationTimeTable(queryStationId, queryStationName);
      const exitsPromise = fetchMetroStationExits(queryStationId, queryStationName);
      
      const [timetable, stationTimeTable, exits] = await Promise.all([
        timetablePromise,
        stationTimeTablePromise,
        exitsPromise,
      ]);
      
      setMetroTimetable(timetable);
      setMetroStationTimeTable(stationTimeTable);
      setMetroExits(exits);
    } catch (error) {
      console.error('獲取捷運資訊失敗:', error);
      setMetroError('無法獲取時刻表資訊');
      setMetroStationTimeTableError('無法獲取列車時刻表資訊');
      setMetroExitsError('無法獲取出口資訊');
    } finally {
      setMetroLoading(false);
      setMetroStationTimeTableLoading(false);
      setMetroExitsLoading(false);
    }
  }, []);

  // 處理捷運站出口點擊事件
  const handleMetroExitClick = React.useCallback(async (exit: MetroStationExit, station: typeof metroStations[0]) => {
    setSelectedMarker({
      id: `metro-exit-${exit.StationID}-${exit.ExitID}`,
      name: `${station.name} - ${exit.ExitName.Zh_tw}`,
      lat: exit.ExitPosition.PositionLat,
      lng: exit.ExitPosition.PositionLon,
      type: 'metro',
    });
    setSelectedMetroStation(station);
    
    // 如果該車站的時刻表數據還沒有加載，則加載
    const cleanStationName = station.name.replace('站', '').trim();
    const isTransferStation = (station as any).isTransfer === true;
    const queryStationId = isTransferStation ? '' : station.stationId;
    const queryStationName = isTransferStation ? cleanStationName : '';
    
    // 檢查是否已經有該車站的數據
    const hasStationData = metroTimetable.length > 0 && 
      (metroTimetable[0]?.StationID === station.stationId || 
       metroTimetable[0]?.StationName?.Zh_tw === cleanStationName);
    
    if (!hasStationData) {
      setMetroTimetable([]);
      setMetroError(null);
      setMetroStationTimeTable([]);
      setMetroStationTimeTableError(null);
      
      try {
        setMetroLoading(true);
        setMetroStationTimeTableLoading(true);
        
        const timetablePromise = fetchMetroTimetable(queryStationId, queryStationName);
        const stationTimeTablePromise = fetchMetroStationTimeTable(queryStationId, queryStationName);
        
        const [timetable, stationTimeTable] = await Promise.all([
          timetablePromise,
          stationTimeTablePromise,
        ]);
        
        setMetroTimetable(timetable);
        setMetroStationTimeTable(stationTimeTable);
      } catch (error) {
        console.error('獲取捷運時刻表失敗:', error);
        setMetroError('無法獲取時刻表資訊');
        setMetroStationTimeTableError('無法獲取列車時刻表資訊');
      } finally {
        setMetroLoading(false);
        setMetroStationTimeTableLoading(false);
      }
    }
  }, [metroTimetable, metroStations]);

  const handleCloseInfoWindow = React.useCallback(() => {
    setSelectedMarker(null);
    setSelectedYouBikeStation(null);
    setSelectedBusStop(null);
    setBusRealTimeInfo([]);
    setGymOccupancy(null);
    setGymError(null);
    setLibraryInfo(null);
    setLibraryError(null);
    setSelectedMetroStation(null);
    setMetroTimetable([]);
    setMetroError(null);
    setMetroStationTimeTable([]);
    setMetroStationTimeTableError(null);
    setSelectedUserMarker(null);
  }, []);

  if (!isLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 返回當前位置按鈕 */}
      <CurrentLocationButton
        currentLocation={currentLocation}
        isGettingLocation={isGettingLocation}
        onGetLocation={getCurrentLocation}
        onReturnToLocation={returnToCurrentLocation}
      />

      {/* 標記腳踏車位置按鈕 */}
      <BikeMarkerButton
        isMarkingMode={isMarkingMode}
        onToggleMarkingMode={() => {
          setIsMarkingMode((prev) => !prev);
          if (isMarkingMode) {
            setSelectedMarker(null);
            setSelectedUserMarker(null);
            setPhotoDialogOpen(false);
            setPendingMarkerLocation(null);
          }
        }}
      />

      {/* 照片上傳對話框 */}
      <BikeMarkerPhotoDialog
        open={photoDialogOpen}
        onClose={handleCancelMarker}
        onConfirm={handleConfirmMarker}
      />

      {/* 位置錯誤提示 */}
      {locationError && (
        <Box
          sx={{
            position: 'absolute',
            top: 80,
            left: 16,
            right: 16,
            zIndex: 1100,
            maxWidth: 400,
          }}
        >
          <Alert
            severity="warning"
            onClose={() => setLocationError(null)}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(4px)',
            }}
          >
            {locationError}
          </Alert>
        </Box>
      )}

      {/* 標記模式提示 */}
      {isMarkingMode && (
        <Box
          sx={{
            position: 'absolute',
            top: 80,
            left: 16,
            right: 16,
            zIndex: 1100,
            maxWidth: 400,
          }}
        >
          <Alert
            severity="info"
            onClose={() => setIsMarkingMode(false)}
            sx={{
              backgroundColor: 'rgba(33, 150, 243, 0.95)',
              backdropFilter: 'blur(4px)',
              color: '#ffffff',
              '& .MuiAlert-icon': {
                color: '#ffffff',
              },
            }}
          >
            標記模式已開啟，點擊地圖上的位置即可標記腳踏車位置
          </Alert>
        </Box>
      )}

    <GoogleMap
      mapContainerStyle={containerStyle}
      center={NTU_CENTER}
      zoom={16}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={handleMapClick}
      options={{
        ...mapOptions,
        draggableCursor: isMarkingMode ? 'crosshair' : undefined,
      }}
    >
      {/* Food Pins */}
      {(LOCATIONS.food as any[]).length > 0 && LOCATIONS.food.map((item) => (
        <MarkerF
          key={item.id}
          position={{ lat: item.lat, lng: item.lng }}
          onClick={() => setSelectedMarker(item)}
          icon={{
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: '#ff9800',
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: '#ffffff',
            scale: 1.5,
          }}
        />
      ))}

      {/* 公車站牌標記 (從 API 獲取，顯示在地圖範圍內) - 只有點擊左側公車圖示時才顯示 */}
      {showBusStops &&
        visibleBusStops.map((stop) => (
          <MarkerF
            key={`bus-${stop.StopUID}`}
            position={{
              lat: stop.StopPosition.PositionLat,
              lng: stop.StopPosition.PositionLon,
            }}
            onClick={() => handleBusStopClick(stop)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#2196f3',
              fillOpacity: 0.8,
              scale: 7,
              strokeWeight: 2,
              strokeColor: '#ffffff',
            }}
          />
        ))}

      {/* Bike Pins (模擬資料) */}
      {LOCATIONS.bike.map((item) => (
        <MarkerF
          key={item.id}
          position={{ lat: item.lat, lng: item.lng }}
          onClick={() => handleBikePinClick(item)}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#fdd835',
            fillOpacity: 1,
            scale: 8,
            strokeWeight: 1,
            strokeColor: '#000000',
          }}
        />
      ))}

      {/* YouBike 站點標記 (從 API 獲取，顯示在地圖範圍內) */}
      {showYouBikeStations &&
        visibleYouBikeStations.map((station) => (
          <MarkerF
            key={`youbike-${station.sno}`}
            position={{ lat: station.lat, lng: station.lng }}
            onClick={() => {
              setSelectedMarker({
                id: `youbike-${station.sno}`,
                name: station.sna,
                lat: station.lat,
                lng: station.lng,
                type: 'bike',
              });
              setSelectedYouBikeStation(station);
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: station.act === '1' ? '#fdd835' : '#999999', // 正常服務為黃色，暫停服務為灰色
              fillOpacity: 0.8,
              scale: 7,
              strokeWeight: 2,
              strokeColor: '#000000',
            }}
          />
        ))}

      {/* 捷運站出口標記 - 只有點擊左側捷運圖示時才顯示 */}
      {showMetroStations &&
        metroExits
          .filter((exit) => {
            if (!map) return false;
            const bounds = map.getBounds();
            if (!bounds) return false;
            const latLng = new google.maps.LatLng(
              exit.ExitPosition.PositionLat,
              exit.ExitPosition.PositionLon
            );
            return bounds.contains(latLng);
          })
          .map((exit) => {
            // 找到對應的車站
            // 優先使用 StationID 匹配，因為更準確
            let station = metroStations.find((s) => s.stationId === exit.StationID);
            
            // 如果 StationID 不匹配，再嘗試用站名匹配
            if (!station) {
              station = metroStations.find(
                (s) => s.name === exit.StationName.Zh_tw || 
                s.name === `${exit.StationName.Zh_tw}站` ||
                exit.StationName.Zh_tw === s.name.replace('站', '')
              );
            }
            
            if (!station) return null;
            
            return (
              <MarkerF
                key={`metro-exit-${exit.StationID}-${exit.ExitID}`}
                position={{
                  lat: exit.ExitPosition.PositionLat,
                  lng: exit.ExitPosition.PositionLon,
                }}
                onClick={() => handleMetroExitClick(exit, station)}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: '#4caf50',
                  fillOpacity: 0.8,
                  scale: 6,
                  strokeWeight: 2,
                  strokeColor: '#ffffff',
                }}
              />
            );
          })
          .filter(Boolean)}

      {/* Campus Pins - 總圖和社科院使用 SVGOverlay（會隨地圖縮放） */}
      {/* 總圖書館 SVG Overlay */}
      <SVGOverlay
        map={map}
        bounds={LIBRARY_BOUNDS}
        svgPath={NTU_MAIN_LIBRARY_PATH}
        viewBox={NTU_MAIN_LIBRARY_VIEWBOX}
        defaultColor="#9e9e9e"
        hoverColor="#000000"
        onClick={handleLibraryClick}
      />

      {/* 社科院大樓 T字型 SVG Overlay - 有朋友時變紫色 */}
      {(() => {
        const hasFriends = friendsInBuildings.has('social');
        return (
          <SVGOverlay
            map={map}
            bounds={SOCIAL_SCIENCE_BOUNDS}
            svgPath={SOCIAL_SCIENCE_PATH}
            viewBox={SOCIAL_SCIENCE_VIEWBOX}
            defaultColor={hasFriends ? '#9c27b0' : '#9e9e9e'}
            hoverColor={hasFriends ? '#7b1fa2' : '#000000'}
            onClick={handleSocialScienceClick}
          />
        );
      })()}

      {/* 主要教學大樓 SVG 覆蓋層 - 共同、普通、新生、綜合、博雅 */}
      {MAIN_BUILDINGS.map((building) => {
        const hasFriends = friendsInBuildings.has(building.id);
        return (
          <SVGOverlay
            key={building.id}
            map={map}
            bounds={building.bounds}
            svgPath={building.svgPath}
            viewBox={building.viewBox}
            defaultColor={hasFriends ? '#9c27b0' : '#9e9e9e'}
            hoverColor={hasFriends ? '#7b1fa2' : '#000000'}
            onClick={() => handleBuildingClick(building)}
          />
        );
      })}

      {/* 其他建築物標記 - 所有建築物都顯示，有朋友的顯示紫色（隱藏已有 SVG 的建築物） */}
      {OTHER_BUILDINGS.filter(b => !b.hidden).map((building) => {
        const hasFriends = friendsInBuildings.has(building.id);
        return (
          <MarkerF
            key={`building-${building.id}`}
            position={{ lat: building.lat, lng: building.lng }}
            onClick={() => handleBuildingClick(building)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: hasFriends ? '#9c27b0' : '#9e9e9e',
              fillOpacity: hasFriends ? 0.9 : 0.6,
              scale: hasFriends ? 10 : 6,
              strokeWeight: 2,
              strokeColor: '#ffffff',
            }}
          />
        );
      })}

      {/* 其他 Campus Pins（非 gym/library）使用 MarkerF */}
      {LOCATIONS.campus
        .filter((item) => item.type !== 'gym' && item.type !== 'library')
        .map((item) => (
          <MarkerF
            key={item.id}
            position={{ lat: item.lat, lng: item.lng }}
            onClick={() => {
              setSelectedMarker(item);
            }}
            icon={{
              path: 'M12 3L1 9l11 6 9-4.91V17h2V9L12 3z',
              fillColor: '#9c27b0',
              fillOpacity: 1,
              strokeWeight: 1,
              strokeColor: '#ffffff',
              scale: 1.5,
            }}
          />
        ))}

      {selectedMarker && (
        <InfoWindowF
          position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
          options={{
            pixelOffset: new google.maps.Size(0, 0),
            disableAutoPan: false,
          }}
          onCloseClick={handleCloseInfoWindow}
        >
          <Box sx={{ 
            width: 380,
            maxHeight: 600,
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <InfoWindowHeader
              name={selectedMarker.name}
              type={selectedMarker.type}
              onClose={handleCloseInfoWindow}
            />
            <Box sx={{
              overflowY: 'auto',
              overflowX: 'hidden',
              flex: 1,
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#888',
                borderRadius: '4px',
                '&:hover': {
                  background: '#555',
                },
              },
            }}>
              <InfoWindowContent
              selectedMarker={selectedMarker}
              selectedYouBikeStation={selectedYouBikeStation}
              selectedBusStop={selectedBusStop}
              busRealTimeInfo={busRealTimeInfo}
              busRealTimeLoading={busRealTimeLoading}
              busError={busError}
              youbikeLoading={youbikeLoading}
              youbikeError={youbikeError}
              gymOccupancy={gymOccupancy}
              gymLoading={gymLoading}
              gymError={gymError}
              libraryInfo={libraryInfo}
              libraryLoading={libraryLoading}
              libraryError={libraryError}
              selectedMetroStation={selectedMetroStation}
              metroTimetable={metroTimetable}
              metroLoading={metroLoading}
              metroError={metroError}
              metroStationTimeTable={metroStationTimeTable}
              metroStationTimeTableLoading={metroStationTimeTableLoading}
              metroStationTimeTableError={metroStationTimeTableError}
              selectedUserMarker={selectedUserMarker}
              onDeleteUserMarker={handleDeleteUserMarker}
            />
            </Box>
          </Box>
        </InfoWindowF>
      )}

      {/* 用戶標記的腳踏車位置 */}
      {userBikeMarkers.map((marker) => (
        <MarkerF
          key={`user-bike-${marker._id}`}
          position={{ lat: marker.lat, lng: marker.lng }}
          onClick={() => {
            setSelectedUserMarker(marker);
            setSelectedMarker({
              id: `user-bike-${marker._id}`,
              name: marker.note || '我的腳踏車',
              lat: marker.lat,
              lng: marker.lng,
              type: 'user-bike',
            });
          }}
          icon={{
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: '#4caf50',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#ffffff',
            scale: 1.2,
          }}
        />
      ))}

      {/* 當前位置標記 */}
      {currentLocation && (
        <MarkerF
          position={currentLocation}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#4285F4',
            fillOpacity: 1,
            scale: 10,
            strokeWeight: 3,
            strokeColor: '#ffffff',
          }}
        />
      )}
    </GoogleMap>
    </Box>
  );
}
