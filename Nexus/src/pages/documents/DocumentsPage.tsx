import React, { useState, useEffect } from 'react';
import { FileText, Upload, Eye, Download, Trash2, Clock, PenTool } from 'lucide-react';
import { documentAPI, Document } from '../../services/documentAPI';
import { useAuth } from '../../context/AuthContext';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { UploadDocumentModal } from '../../components/documents/UploadDocumentModal';
import { DocumentPreviewModal } from '../../components/documents/DocumentPreviewModal';
import { SignatureModal } from '../../components/documents/SignatureModal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api/v1';

const downloadFile = (doc: Document) => {
  const token = localStorage.getItem('nexus_token');
  const url = `${API_BASE_URL}/documents/${doc.id}/download?token=${token}`;
  const ext = doc.fileType === 'application/pdf' ? '.pdf'
    : doc.fileType.includes('wordprocessingml') ? '.docx'
    : doc.fileType.includes('msword') ? '.doc'
    : doc.fileType.includes('spreadsheetml') ? '.xlsx'
    : doc.fileType.includes('ms-excel') ? '.xls'
    : '';

  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      return res.blob();
    })
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = doc.title + ext;
      window.document.body.appendChild(anchor);
      anchor.click();
      window.document.body.removeChild(anchor);
      URL.revokeObjectURL(blobUrl);
    })
    .catch((err) => {
      console.error('Download error:', err);
      toast.error('Download failed: ' + err.message);
    });
};

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [signatureDocument, setSignatureDocument] = useState<Document | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [filter]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await documentAPI.getAllDocuments();
      setDocuments(response.data);
    } catch (error: any) {
      toast.error('Failed to load documents');
      console.error('Fetch documents error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await documentAPI.deleteDocument(documentId);
      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete document');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="error">Rejected</Badge>;
      case 'SIGNED':
        return <Badge variant="info">Signed</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredDocuments = filter === 'all'
    ? documents
    : documents.filter(doc => doc.status === filter);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Manage and share your documents</p>
        </div>
        <Button leftIcon={<Upload size={18} />} onClick={() => setIsUploadModalOpen(true)}>
          Upload Document
        </Button>
      </div>

      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={fetchDocuments}
      />

      {previewDocument && (
        <DocumentPreviewModal
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
        />
      )}

      {signatureDocument && (
        <SignatureModal
          document={signatureDocument}
          onClose={() => setSignatureDocument(null)}
          onSuccess={fetchDocuments}
        />
      )}

      {/* Filter tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        {['all', 'PENDING', 'APPROVED', 'SIGNED', 'REJECTED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === status
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Documents list */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600">
              {filter === 'all'
                ? 'Upload your first document to get started.'
                : `You have no ${filter.toLowerCase()} documents.`}
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((document) => {
            const isOwner = user?.id === document.uploadedBy;

            return (
              <Card key={document.id}>
                <CardBody className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <FileText size={20} className="text-primary-600" />
                      {getStatusBadge(document.status)}
                    </div>
                    {document.signatureUrl && (
                      <PenTool size={16} className="text-green-600" />
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                    {document.title}
                  </h3>

                  {document.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {document.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock size={14} className="mr-1" />
                      {format(new Date(document.createdAt), 'PPp')}
                    </div>
                    <div className="text-xs text-gray-500">
                      Size: {formatFileSize(document.fileSize)} • v{document.version}
                    </div>
                    <div className="text-xs text-gray-500">
                      By: {document.user.firstName} {document.user.lastName}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Eye size={14} />}
                      onClick={() => setPreviewDocument(document)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Download size={14} />}
                      onClick={() => downloadFile(document)}
                    >
                      Download
                    </Button>
                    {isOwner && document.status === 'PENDING' && !document.signatureUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<PenTool size={14} />}
                        onClick={() => setSignatureDocument(document)}
                      >
                        Sign
                      </Button>
                    )}
                    {isOwner && (
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Trash2 size={14} />}
                        onClick={() => handleDelete(document.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};