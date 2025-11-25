'use client';

import * as React from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { NTU_CENTER, LOCATIONS } from '@/data/mockData';

const containerStyle = {
  width: '100%',
  height: '100%',
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

  const [selectedMarker, setSelectedMarker] = React.useState<any>(null);
  const [map, setMap] = React.useState<google.maps.Map | null>(null);

  const onLoad = React.useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(function callback() {
    setMap(null);
  }, []);

  if (!isLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={NTU_CENTER}
      zoom={16}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={mapOptions}
    >
      {/* Food Pins */}
      {LOCATIONS.food.map((item) => (
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

      {/* Bus Pins */}
      {LOCATIONS.bus.map((item) => (
        <MarkerF
          key={item.id}
          position={{ lat: item.lat, lng: item.lng }}
          onClick={() => setSelectedMarker(item)}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#2196f3',
            fillOpacity: 1,
            scale: 8,
            strokeWeight: 1,
            strokeColor: '#ffffff',
          }}
        />
      ))}

      {/* Bike Pins */}
      {LOCATIONS.bike.map((item) => (
        <MarkerF
          key={item.id}
          position={{ lat: item.lat, lng: item.lng }}
          onClick={() => setSelectedMarker(item)}
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

      {/* Metro Pins */}
      {LOCATIONS.metro.map((item) => (
        <MarkerF
          key={item.id}
          position={{ lat: item.lat, lng: item.lng }}
          onClick={() => setSelectedMarker(item)}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#4caf50',
            fillOpacity: 1,
            scale: 10,
            strokeWeight: 1,
            strokeColor: '#ffffff',
          }}
        />
      ))}

      {/* Campus Pins */}
      {LOCATIONS.campus.map((item) => (
        <MarkerF
          key={item.id}
          position={{ lat: item.lat, lng: item.lng }}
          onClick={() => setSelectedMarker(item)}
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
          onCloseClick={() => setSelectedMarker(null)}
        >
          <Box sx={{ p: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {selectedMarker.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedMarker.type === 'food' && '美食評分: 4.5 ★'}
              {selectedMarker.type === 'bus' && '即將進站: 208, 606'}
              {selectedMarker.type === 'bike' && '可借: 15, 可還: 5'}
              {selectedMarker.type === 'metro' && '往象山: 3分, 往淡水: 5分'}
              {selectedMarker.type === 'library' && '閉館: 22:00, 人數: 適中'}
              {selectedMarker.type === 'gym' && '人數: 擁擠 (80/100)'}
            </Typography>
          </Box>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}
