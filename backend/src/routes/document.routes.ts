import { Router } from 'express';
import { authenticate, authenticateFlexible } from '../middleware/auth';
import { validate } from '../middleware/validator';
import {
  uploadDocumentFile,
  uploadSignatureFile,
  uploadToCloudinary,
  uploadSignatureToCloudinary,
  handleMulterError,
} from '../middleware/upload';
import {
  createDocumentValidator,
  updateDocumentStatusValidator,
  documentIdValidator,
} from '../middleware/documentValidator';
import {
  uploadDocument,
  getMyDocuments,
  getAllDocuments,
  getDocumentById,
  updateDocumentStatus,
  addSignature,
  deleteDocument,
  viewDocument,
  downloadDocument,
} from '../controllers/document.controller';

const router = Router();

// View and download both use flexible auth so the browser can load them directly
// via iframe src or window.open() where sending Authorization headers is impossible.
router.get('/:id/view', authenticateFlexible, validate(documentIdValidator), viewDocument);
router.get('/:id/download', authenticateFlexible, validate(documentIdValidator), downloadDocument);

// All other routes require standard Bearer token authentication
router.use(authenticate);

// Upload document
router.post(
  '/upload',
  uploadDocumentFile,
  handleMulterError,
  uploadToCloudinary,
  validate(createDocumentValidator),
  uploadDocument
);

// Get my documents
router.get('/my-documents', getMyDocuments);

// Get all accessible documents
router.get('/', getAllDocuments);

// Get single document
router.get('/:id', validate(documentIdValidator), getDocumentById);

// Update document status
router.patch(
  '/:id/status',
  validate(updateDocumentStatusValidator),
  updateDocumentStatus
);

// Add signature to document
router.patch(
  '/:id/signature',
  uploadSignatureFile,
  handleMulterError,
  uploadSignatureToCloudinary,
  validate(documentIdValidator),
  addSignature
);

// Delete document
router.delete('/:id', validate(documentIdValidator), deleteDocument);

export default router;
