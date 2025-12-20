'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { YouBikeStation } from '@/services/youbikeApi';
import type { BusStop, BusRealTimeInfo } from '@/services/busApi';
import type { MetroFirstLastTimetable, MetroStationTimeTable } from '@/services/metroApi';
import BusInfoContent from './BusInfoContent';
import BikeInfoContent from './BikeInfoContent';
import GymInfoContent from './GymInfoContent';
import LibraryInfoContent from './LibraryInfoContent';
import MetroInfoContent from './MetroInfoContent';
import UserBikeMarkerContent from './UserBikeMarkerContent';

interface GymOccupancy {
  fitnessCenter: { current: number; optimal: number; max: number };
  swimmingPool: { current: number; optimal: number; max: number };
  status: string;
  totalCurrent: number;
  totalMax: number;
  lastUpdated: string;
}

interface LibraryInfo {
  openingHours: { today: string; status: string; hours: string };
  studyRoom: { occupied: number; available: number; total: number };
  lastUpdated: string;
}

interface InfoWindowContentProps {
  selectedMarker: any;
  selectedYouBikeStation: YouBikeStation | null;
  selectedBusStop: BusStop | null;
  busRealTimeInfo: BusRealTimeInfo[];
  busRealTimeLoading: boolean;
  busError: string | null;
  youbikeLoading: boolean;
  youbikeError: string | null;
  gymOccupancy: GymOccupancy | null;
  gymLoading: boolean;
  gymError: string | null;
  libraryInfo: LibraryInfo | null;
  libraryLoading: boolean;
  libraryError: string | null;
  selectedMetroStation: { name: string; lat: number; lng: number; stationId: string } | null;
  metroTimetable: MetroFirstLastTimetable[];
  metroLoading: boolean;
  metroError: string | null;
  metroStationTimeTable?: MetroStationTimeTable[];
  metroStationTimeTableLoading?: boolean;
  metroStationTimeTableError?: string | null;
  selectedUserMarker?: { _id: string; lat: number; lng: number; note?: string; imageUrl?: string; createdAt?: Date | string } | null;
  onDeleteUserMarker?: (markerId: string) => void;
}

export default function InfoWindowContent({
  selectedMarker,
  selectedYouBikeStation,
  selectedBusStop,
  busRealTimeInfo,
  busRealTimeLoading,
  busError,
  youbikeLoading,
  youbikeError,
  gymOccupancy,
  gymLoading,
  gymError,
  libraryInfo,
  libraryLoading,
  libraryError,
  selectedMetroStation,
  metroTimetable,
  metroLoading,
  metroError,
  metroStationTimeTable = [],
  metroStationTimeTableLoading = false,
  metroStationTimeTableError = null,
  selectedUserMarker = null,
  onDeleteUserMarker,
}: InfoWindowContentProps) {
  return (
    <Box sx={{ p: 2 }}>
      {selectedMarker.type === 'user-bike' && selectedUserMarker && onDeleteUserMarker && (
        <UserBikeMarkerContent
          markerId={selectedUserMarker._id}
          note={selectedUserMarker.note}
          lat={selectedUserMarker.lat}
          lng={selectedUserMarker.lng}
          imageUrl={selectedUserMarker.imageUrl || undefined}
          createdAt={selectedUserMarker.createdAt}
          onDelete={onDeleteUserMarker}
        />
      )}
      
      {selectedMarker.type === 'bus' && (
        <BusInfoContent
          selectedBusStop={selectedBusStop}
          busRealTimeInfo={busRealTimeInfo}
          busRealTimeLoading={busRealTimeLoading}
          busError={busError}
        />
      )}
      
      {selectedMarker.type === 'bike' && (
        <BikeInfoContent
          selectedYouBikeStation={selectedYouBikeStation}
          youbikeLoading={youbikeLoading}
          youbikeError={youbikeError}
        />
      )}
      
      {selectedMarker.type === 'food' && (
        <Box
          sx={{
            p: 1.5,
            backgroundColor: '#fff3e0',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#e65100' }}>
            ⭐ 美食評分: 4.5 / 5.0
          </Typography>
        </Box>
      )}
      
      {selectedMarker.type === 'metro' && (
        <MetroInfoContent
          stationName={selectedMetroStation?.name || selectedMarker.name}
          metroTimetable={metroTimetable}
          metroLoading={metroLoading}
          metroError={metroError}
          metroStationTimeTable={metroStationTimeTable}
          metroStationTimeTableLoading={metroStationTimeTableLoading}
          metroStationTimeTableError={metroStationTimeTableError}
        />
      )}
      
      {selectedMarker.type === 'library' && (
        <LibraryInfoContent
          libraryInfo={libraryInfo}
          libraryLoading={libraryLoading}
          libraryError={libraryError}
        />
      )}
      
      {selectedMarker.type === 'gym' && (
        <GymInfoContent
          gymOccupancy={gymOccupancy}
          gymLoading={gymLoading}
          gymError={gymError}
        />
      )}

      {selectedMarker.type === 'building' && (
        <Box
          sx={{
            p: 1.5,
            backgroundColor: selectedMarker.hasFriends ? '#f3e5f5' : '#f5f5f5',
            borderRadius: 2,
          }}
        >
          {selectedMarker.hasFriends && selectedMarker.friendsList ? (
            <>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#7b1fa2',
                  mb: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                👥 正在上課的朋友 ({selectedMarker.friendsList.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {selectedMarker.friendsList.map((friend: any, index: number) => (
                  <Box 
                    key={friend.friendId || index}
                    sx={{
                      p: 1.5,
                      backgroundColor: '#ffffff',
                      borderRadius: 1.5,
                      border: '1px solid #e1bee7',
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#4a148c',
                        mb: 0.5,
                      }}
                    >
                      {friend.friendName}
                    </Typography>
                    {friend.courseName && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#7b1fa2',
                          fontSize: '0.85rem',
                          mb: 0.3,
                        }}
                      >
                        📚 {friend.courseName}
                      </Typography>
                    )}
                    {friend.location && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#9575cd',
                          fontSize: '0.8rem',
                        }}
                      >
                        📍 {friend.location}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </>
          ) : (
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#757575',
                textAlign: 'center',
              }}
            >
              目前沒有朋友在此上課
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

