import { Response, NextFunction } from 'express';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { DocumentService } from '../services/document.service';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const documentService = new DocumentService();

export const uploadDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const { title, description, visibility } = req.body;

    const document = await documentService.createDocument({
      title,
      description,
      fileUrl: req.file.path, // Cloudinary URL
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user.id,
      visibility: visibility || 'PRIVATE',
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyDocuments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { status } = req.query;
    const documents = await documentService.getUserDocuments(
      req.user.id,
      status as string | undefined
    );

    res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllDocuments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const documents = await documentService.getAllDocuments(req.user.id);

    res.status(200).json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const document = await documentService.getDocumentById(id as string, req.user.id);

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDocumentStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const { status } = req.body;

    const document = await documentService.updateDocumentStatus(
      id as string,
      req.user.id,
      { status }
    );

    res.status(200).json({
      success: true,
      message: 'Document status updated successfully',
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export const addSignature = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    if (!req.file) {
      throw new AppError('No signature file uploaded', 400);
    }

    const { id } = req.params;

    const document = await documentService.addSignature(
      id as string,
      req.user.id,
      { signatureUrl: req.file.path } // Cloudinary URL
    );

    res.status(200).json({
      success: true,
      message: 'Signature added successfully',
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;
    const result = await documentService.deleteDocument(id as string, req.user.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
};

// Proxy the file from Cloudinary and stream it to the client with correct headers.
// Accepts an optional `disposition` param ('inline' for view, 'attachment' for download).
const proxyCloudinaryFile = (disposition: 'inline' | 'attachment') =>
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      const { id } = req.params;
      const document = await documentService.getDocumentById(id as string, req.user.id);

      if (!document.fileUrl) {
        throw new AppError('File URL not found for this document', 404);
      }

      const ext = MIME_TO_EXT[document.fileType] || '';
      const safeTitle = encodeURIComponent(document.title + ext);

      const parsedUrl = new URL(document.fileUrl);
      const transport = parsedUrl.protocol === 'https:' ? https : http;

      transport.get(document.fileUrl, (upstream) => {
        if (upstream.statusCode && upstream.statusCode >= 400) {
          console.error('Cloudinary fetch failed:', upstream.statusCode, document.fileUrl);
          next(new AppError(`Failed to fetch file from storage (${upstream.statusCode})`, 502));
          return;
        }

        res.setHeader('Content-Type', document.fileType);
        res.setHeader('Content-Disposition', `${disposition}; filename="${safeTitle}"`);
        res.setHeader('Cache-Control', 'no-store');

        if (upstream.headers['content-length']) {
          res.setHeader('Content-Length', upstream.headers['content-length']);
        }

        upstream.pipe(res);

        upstream.on('error', (err) => {
          console.error('Stream error proxying file:', err);
          if (!res.headersSent) {
            next(new AppError(`Stream error: ${err.message}`, 500));
          }
        });
      }).on('error', (err) => {
        console.error('HTTPS request error:', err);
        next(new AppError(`Failed to reach file storage: ${err.message}`, 502));
      });
    } catch (error) {
      next(error);
    }
  };

export const viewDocument = proxyCloudinaryFile('inline');
export const downloadDocument = proxyCloudinaryFile('attachment');
