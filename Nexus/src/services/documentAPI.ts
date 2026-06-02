import { api } from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api/v1';

export interface Document {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  version: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SIGNED';
  signatureUrl?: string;
  uploadedBy: string;
  visibility: 'PRIVATE' | 'PUBLIC' | 'SHARED';
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DocumentResponse {
  success: boolean;
  message?: string;
  data: Document;
}

export interface DocumentsResponse {
  success: boolean;
  data: Document[];
}

export const documentAPI = {
  getUploadSignature: async (): Promise<{
    signature: string; timestamp: number;
    cloudName: string; apiKey: string; folder: string;
  }> => {
    const response = await api.get('/documents/sign-upload');
    return response.data.data;
  },

  saveDocument: async (data: {
    title: string; description?: string; fileUrl: string;
    fileType: string; fileSize: number; visibility: string;
  }): Promise<DocumentResponse> => {
    const response = await api.post('/documents/save', data);
    return response.data;
  },

  uploadDocument: async (formData: FormData): Promise<DocumentResponse> => {
    const token = localStorage.getItem('nexus_token');
    const response = await api.post(`${API_BASE_URL}/documents/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  },

  getMyDocuments: async (status?: string): Promise<DocumentsResponse> => {
    const params = status ? { status } : {};
    const response = await api.get('/documents/my-documents', { params });
    return response.data;
  },

  getAllDocuments: async (): Promise<DocumentsResponse> => {
    const response = await api.get('/documents');
    return response.data;
  },

  getDocumentById: async (id: string): Promise<DocumentResponse> => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  updateDocumentStatus: async (
    id: string,
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SIGNED'
  ): Promise<DocumentResponse> => {
    const response = await api.patch(`/documents/${id}/status`, { status });
    return response.data;
  },

  addSignature: async (id: string, formData: FormData): Promise<DocumentResponse> => {
    const token = localStorage.getItem('nexus_token');
    const response = await api.patch(`/documents/${id}/signature`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  },

  deleteDocument: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },
};
