import multer from 'multer';
import cloudinary from '../config/cloudinary';
import { AppError } from './errorHandler';
import { Request, Response, NextFunction } from 'express';

// Allowed file types
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/jpg',
];

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Use memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG files are allowed',
        400
      ),
      false
    );
  }
};

// Signature file filter (only images)
const signatureFileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  if (['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid signature file type. Only JPG, JPEG, PNG are allowed', 400), false);
  }
};

// Document upload middleware
export const uploadDocumentFile = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
}).single('document');

// Signature upload middleware
export const uploadSignatureFile = multer({
  storage: storage,
  fileFilter: signatureFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB for signatures
  },
}).single('signature');

// Determine Cloudinary resource_type:
// PDFs and office documents must use 'raw' so Cloudinary stores the original
// file bytes. If 'auto' is used, Cloudinary assigns PDFs as 'image' type and
// serves a rendered JPEG thumbnail instead of the actual PDF.
const getCloudinaryResourceType = (mimetype: string): 'image' | 'raw' => {
  if (mimetype.startsWith('image/')) return 'image';
  return 'raw';
};

// Cloudinary upload middleware for documents
export const uploadToCloudinary = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return next();
    }

    const resourceType = getCloudinaryResourceType(req.file.mimetype);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'nexus/documents',
          resource_type: resourceType,
          type: 'upload',
          access_mode: 'public',
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(req.file!.buffer);
    });

    // Attach Cloudinary result to request
    req.file = {
      ...req.file,
      path: (result as any).secure_url,
      filename: (result as any).public_id,
    } as any;

    next();
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    next(new AppError(`Failed to upload file to cloud storage: ${error.message || error}`, 500));
  }
};

// Cloudinary upload middleware for signatures
export const uploadSignatureToCloudinary = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return next();
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'nexus/signatures',
          resource_type: 'image',
          type: 'upload',
          access_mode: 'public',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(req.file!.buffer);
    });

    // Attach Cloudinary result to request
    req.file = {
      ...req.file,
      path: (result as any).secure_url,
      filename: (result as any).public_id,
    } as any;

    next();
  } catch (error) {
    next(new AppError('Failed to upload signature to cloud storage', 500));
  }
};

// Error handling wrapper for multer
export const handleMulterError = (err: any, _req: any, _res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('File size too large. Maximum size is 10MB', 400));
    }
    return next(new AppError(err.message, 400));
  }
  next(err);
};
