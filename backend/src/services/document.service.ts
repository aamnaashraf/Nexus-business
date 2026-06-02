import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

interface CreateDocumentData {
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  visibility?: 'PRIVATE' | 'PUBLIC' | 'SHARED';
}

interface UpdateDocumentStatusData {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SIGNED';
}

interface AddSignatureData {
  signatureUrl: string;
}

export class DocumentService {
  async createDocument(data: CreateDocumentData) {
    const document = await prisma.document.create({
      data: {
        title: data.title,
        description: data.description,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        fileSize: data.fileSize,
        uploadedBy: data.uploadedBy,
        visibility: data.visibility || 'PRIVATE',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return document;
  }

  async getUserDocuments(userId: string, status?: string) {
    const where: any = {
      uploadedBy: userId,
    };

    if (status) {
      where.status = status;
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return documents;
  }

  async getDocumentById(documentId: string, userId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Check authorization
    if (document.uploadedBy !== userId && document.visibility === 'PRIVATE') {
      throw new AppError('You do not have permission to view this document', 403);
    }

    return document;
  }

  async updateDocumentStatus(documentId: string, userId: string, data: UpdateDocumentStatusData) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Only owner can update status
    if (document.uploadedBy !== userId) {
      throw new AppError('You do not have permission to update this document', 403);
    }

    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        status: data.status,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return updatedDocument;
  }

  async addSignature(documentId: string, userId: string, data: AddSignatureData) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Only owner can add signature
    if (document.uploadedBy !== userId) {
      throw new AppError('You do not have permission to sign this document', 403);
    }

    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        signatureUrl: data.signatureUrl,
        status: 'SIGNED',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return updatedDocument;
  }

  async deleteDocument(documentId: string, userId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Only owner can delete
    if (document.uploadedBy !== userId) {
      throw new AppError('You do not have permission to delete this document', 403);
    }

    await prisma.document.delete({
      where: { id: documentId },
    });

    return { message: 'Document deleted successfully' };
  }

  async getAllDocuments(userId: string) {
    // Get all documents that are either uploaded by user or are public/shared
    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { uploadedBy: userId },
          { visibility: 'PUBLIC' },
          { visibility: 'SHARED' },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return documents;
  }
}
