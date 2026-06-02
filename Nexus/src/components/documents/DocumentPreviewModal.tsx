import React, { useState, useCallback } from 'react';
import { X, Download, ExternalLink, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from '../ui/Button';
import { Document as DocType } from '../../services/documentAPI';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api/v1';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface DocumentPreviewModalProps {
  document: DocType;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  document,
  onClose,
}) => {
  const isPDF = document.fileType === 'application/pdf';
  const isImage = document.fileType.startsWith('image/');

  const token = localStorage.getItem('nexus_token');
  const downloadUrl = `${API_BASE_URL}/documents/${document.id}/download?token=${token}`;

  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPdfError(null);
  }, []);

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error('PDF.js error:', err);
    setPdfError(err.message);
  }, []);

  // For PDFs: fetch directly from Cloudinary (public, Access-Control-Allow-Origin: *)
  // For other types: use backend download endpoint (already proven to work)
  const handleDownload = () => {
    if (isPDF) {
      // Cloudinary raw URL is public — no auth needed, CORS: *
      fetch(document.fileUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.blob();
        })
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const anchor = window.document.createElement('a');
          anchor.href = url;
          anchor.download = document.title + '.pdf';
          window.document.body.appendChild(anchor);
          anchor.click();
          window.document.body.removeChild(anchor);
          URL.revokeObjectURL(url);
        })
        .catch((err) => alert('Download failed: ' + err.message));
    } else {
      // Non-PDF: backend endpoint works fine for DOCX etc.
      fetch(downloadUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.blob();
        })
        .then((blob) => {
          const ext = document.fileType.includes('wordprocessingml') ? '.docx'
            : document.fileType.includes('msword') ? '.doc'
            : document.fileType.includes('spreadsheetml') ? '.xlsx'
            : document.fileType.includes('ms-excel') ? '.xls'
            : '';
          const url = URL.createObjectURL(blob);
          const anchor = window.document.createElement('a');
          anchor.href = url;
          anchor.download = document.title + ext;
          window.document.body.appendChild(anchor);
          anchor.click();
          window.document.body.removeChild(anchor);
          URL.revokeObjectURL(url);
        })
        .catch((err) => alert('Download failed: ' + err.message));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{document.title}</h3>
                {document.description && (
                  <p className="text-sm text-gray-600 mt-1">{document.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download size={16} />}
                  onClick={handleDownload}
                >
                  Download
                </Button>
                {isPDF && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<ExternalLink size={16} />}
                    onClick={() => window.open(document.fileUrl, '_blank')}
                  >
                    Open in New Tab
                  </Button>
                )}
                <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-4 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
              {isPDF ? (
                <div className="flex flex-col items-center">
                  {pdfError ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                      <p className="text-red-600 mb-4">Could not render PDF: {pdfError}</p>
                      <Button
                        leftIcon={<ExternalLink size={16} />}
                        onClick={() => window.open(document.fileUrl, '_blank')}
                      >
                        Open in New Tab
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-auto max-h-[600px] w-full flex justify-center bg-gray-100 p-4">
                        {/* Pass the public Cloudinary URL directly — CORS: * so no issues */}
                        <Document
                          file={document.fileUrl}
                          onLoadSuccess={onDocumentLoadSuccess}
                          onLoadError={onDocumentLoadError}
                          loading={
                            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                              <Loader size={36} className="animate-spin mb-3" />
                              <p>Loading PDF…</p>
                            </div>
                          }
                        >
                          <Page
                            pageNumber={pageNumber}
                            width={700}
                            renderTextLayer
                            renderAnnotationLayer
                          />
                        </Document>
                      </div>

                      {numPages > 1 && (
                        <div className="flex items-center justify-center gap-4 py-3 border-t border-gray-200 bg-white w-full">
                          <button
                            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                            disabled={pageNumber <= 1}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <span className="text-sm text-gray-700">
                            Page {pageNumber} of {numPages}
                          </span>
                          <button
                            onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                            disabled={pageNumber >= numPages}
                            className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
                          >
                            <ChevronRight size={20} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : isImage ? (
                <div className="flex items-center justify-center p-4">
                  <img
                    src={document.fileUrl}
                    alt={document.title}
                    className="max-w-full max-h-[600px] object-contain"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <ExternalLink size={48} className="text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Preview not available</h4>
                  <p className="text-gray-600 mb-4">
                    This file type cannot be previewed in the browser.
                  </p>
                  <Button leftIcon={<Download size={16} />} onClick={handleDownload}>
                    Download to View
                  </Button>
                </div>
              )}
            </div>

            {document.signatureUrl && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="text-sm font-medium text-green-900 mb-2">Document Signed</h4>
                <img
                  src={document.signatureUrl}
                  alt="Signature"
                  className="h-16 border border-green-300 bg-white p-2 rounded"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
