import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api/v1';

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexus_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface VideoRoomInfo {
  roomUrl: string;
  token: string;
  roomName: string;
  userName: string;
  meetingTitle: string;
  mock: boolean;
}

export const videoAPI = {
  joinRoom: (meetingId: string) =>
    api.post<{ success: boolean; data: VideoRoomInfo }>(
      `/video/room/${meetingId}/join`
    ),
};
