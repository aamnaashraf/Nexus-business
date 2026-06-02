import React, { useState } from 'react';
import axios from 'axios';
import { X, Upload, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { documentAPI } from '../../services/documentAPI';
import toast from 'react-hot-toast';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'PUBLIC' | 'SHARED'>('PRIVATE');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Auto-fill title from filename if empty
      if (!title) {
        const filename = e.target.files[0].name;
        const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) { toast.error('Please select a file to upload'); return; }
    if (!title.trim()) { toast.error('Please enter a document title'); return; }

    if (file.size > 4 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 4MB');
      return;
    }

    try {
      setIsLoading(true);

      // Step 1 — get a signed upload credential from the backend
      const { signature, timestamp, cloudName, apiKey, folder } =
        await documentAPI.getUploadSignature();

      // Step 2 — upload directly to Cloudinary (bypasses Vercel body limits)
      const isImage = file.type.startsWith('image/');
      const resourceType = isImage ? 'image' : 'raw';
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

      const cloudForm = new FormData();
      cloudForm.append('file', file);
      cloudForm.append('api_key', apiKey);
      cloudForm.append('timestamp', String(timestamp));
      cloudForm.append('signature', signature);
      cloudForm.append('folder', folder);

      const cloudRes = await axios.post(cloudinaryUrl, cloudForm);
      const { secure_url, bytes } = cloudRes.data;

      // Step 3 — save metadata to backend (small JSON, no file)
      await documentAPI.saveDocument({
        title: title.trim(),
        description: description.trim() || undefined,
        fileUrl: secure_url,
        fileType: file.type,
        fileSize: bytes,
        visibility,
      });

      toast.success('Document uploaded successfully!');
      onClose();
      if (onSuccess) onSuccess();

      setTitle('');
      setDescription('');
      setVisibility('PRIVATE');
      setFile(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to upload document');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Upload Document
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* File upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File *
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-primary-500 transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none"
                      >
                        <span>Upload a file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, DOCX, XLS, XLSX, JPG, PNG up to 4MB
                    </p>
                    {file && (
                      <div className="mt-2 flex items-center justify-center text-sm text-gray-700">
                        <FileText size={16} className="mr-2" />
                        {file.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Input
                label="Document Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Business Plan 2024"
                required
                fullWidth
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Add document description..."
                  maxLength={1000}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="PRIVATE">Private (Only me)</option>
                  <option value="SHARED">Shared (Selected users)</option>
                  <option value="PUBLIC">Public (Everyone)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isLoading}>
                  Upload Document
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
