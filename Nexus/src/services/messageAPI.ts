import { api } from './api';

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  read: boolean;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
}

export interface Conversation {
  partnerId: string;
  partner: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    role: string;
  };
  lastMessage: ChatMessage;
  unreadCount: number;
}

export interface ChatPartner {
  id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  role: string;
  bio?: string;
}

export const messageAPI = {
  getConversations: async (): Promise<{ data: Conversation[] }> => {
    const response = await api.get('/messages');
    return response.data;
  },

  getMessages: async (userId: string): Promise<{ data: ChatMessage[] }> => {
    const response = await api.get(`/messages/${userId}`);
    return response.data;
  },

  sendMessage: async (userId: string, content: string): Promise<{ data: ChatMessage }> => {
    const response = await api.post(`/messages/${userId}`, { content });
    return response.data;
  },

  getChatPartner: async (userId: string): Promise<{ data: ChatPartner }> => {
    const response = await api.get(`/messages/partner/${userId}`);
    return response.data;
  },
};
