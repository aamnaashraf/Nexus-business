import { api } from './api';

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  meetingLink?: string;
  createdById: string;
  investorId: string;
  entrepreneurId: string;
  investor: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    profileImage?: string;
  };
  entrepreneur: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    profileImage?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingData {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  participantId: string;
}

export interface MeetingResponse {
  success: boolean;
  message?: string;
  data: Meeting;
}

export interface MeetingsResponse {
  success: boolean;
  data: Meeting[];
}

export const meetingAPI = {
  createMeeting: async (data: CreateMeetingData): Promise<MeetingResponse> => {
    const response = await api.post('/meetings', data);
    return response.data;
  },

  getMyMeetings: async (status?: string): Promise<MeetingsResponse> => {
    const params = status ? { status } : {};
    const response = await api.get('/meetings', { params });
    return response.data;
  },

  getMeetingById: async (id: string): Promise<MeetingResponse> => {
    const response = await api.get(`/meetings/${id}`);
    return response.data;
  },

  acceptMeeting: async (id: string): Promise<MeetingResponse> => {
    const response = await api.patch(`/meetings/${id}/accept`);
    return response.data;
  },

  rejectMeeting: async (id: string): Promise<MeetingResponse> => {
    const response = await api.patch(`/meetings/${id}/reject`);
    return response.data;
  },

  cancelMeeting: async (id: string): Promise<MeetingResponse> => {
    const response = await api.patch(`/meetings/${id}/cancel`);
    return response.data;
  },
};
