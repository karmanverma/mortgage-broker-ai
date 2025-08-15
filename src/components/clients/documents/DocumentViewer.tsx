import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { DocumentWithUrl, DocumentStatus, DOCUMENT_TYPE_LABELS } from '@/features/documents/types';
import { 
  Download, 
  FileText, 
  Image as ImageIcon, 
  File,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';

interface DocumentViewerProps {
  document: DocumentWithUrl | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (document: DocumentWithUrl) => void;
  onStatusUpdate: (document: DocumentWithUrl, status: DocumentStatus, notes?: string) => void;
  isUpdating?: boolean;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return ImageIcon;
  if (fileType === 'application/pdf') return FileText;
  return File;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'PPP');
  } catch {
    return 'Invalid date';
  }
};

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  isOpen,
  onClose,
  onDownload,
  onStatusUpdate,
  isUpdating = false
}) => {
  const [notes, setNotes] = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    if (document) {
      setNotes(document.notes || '');
    }
  }, [document]);

  if (!document) return null;

  const FileIcon = getFileIcon(document.file_type);
  const isImage = document.file_type.startsWith('image/');
  const isPDF = document.file_type === 'application/pdf';
  const canPreview = isImage || isPDF;
  
  const isExpired = document.expiration_date && 
    new Date(document.expiration_date) < new Date();

  const handleStatusUpdate = (status: DocumentStatus) => {
    onStatusUpdate(document, status, notes.trim() || undefined);
  };

  const handleViewFullScreen = () => {
    if (document.fileUrl) {
      window.open(document.fileUrl, '_blank');
    }
  };

  const renderPreview = () => {
    if (!document.fileUrl) {
      return (
        <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
          <div className="text-center">
            <FileIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Preview not available</p>
          </div>
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="flex justify-center">
          <img
            src={document.fileUrl}
            alt={document.name}
            className="max-w-full max-h-96 object-contain rounded-lg border"
            onLoad={() => setIsLoadingPreview(false)}
            onError={() => setIsLoadingPreview(false)}
          />
        </div>
      );
    }

    if (isPDF) {
      return (
        <div className="w-full h-96 border rounded-lg overflow-hidden">
          <iframe
            src={`${document.fileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
            className="w-full h-full"
            title={document.name}
            onLoad={() => setIsLoadingPreview(false)}
          />
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
        <div className="text-center">
          <FileIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">Preview not available for this file type</p>
          <Button onClick={() => onDownload(document)} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download to view
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileIcon className="w-6 h-6" />
            <span className="truncate">{document.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Type:</span>
                <Badge variant="outline">
                  {DOCUMENT_TYPE_LABELS[document.document_type as keyof typeof DOCUMENT_TYPE_LABELS] || document.document_type}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <DocumentStatusBadge status={document.document_status as any} />
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Uploaded: {formatDate(document.created_at)}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <File className="w-4 h-4" />
                <span>Size: {formatFileSize(document.file_size)}</span>
              </div>
            </div>

            <div className="space-y-2">
              {document.uploaded_by && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4" />
                  <span>Uploaded by user</span>
                </div>
              )}
              
              {document.expiration_date && (
                <div className={`flex items-center gap-2 text-sm ${isExpired ? 'text-red-600' : ''}`}>
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    {isExpired ? 'Expired: ' : 'Expires: '}
                    {formatDate(document.expiration_date)}
                  </span>
                </div>
              )}
              
              {document.compliance_required && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Compliance Required
                </Badge>
              )}
            </div>
          </div>

          {/* Document Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Preview</h3>
              <div className="flex gap-2">
                {canPreview && document.fileUrl && (
                  <Button onClick={handleViewFullScreen} variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Full Screen
                  </Button>
                )}
                <Button onClick={() => onDownload(document)} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            
            {renderPreview()}
          </div>

          {/* Description */}
          {document.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Description</h3>
              <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded">
                {document.description}
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Review Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this document..."
              className="w-full p-3 border rounded-md resize-none"
              rows={3}
            />
          </div>

          {/* Status Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Update document status:
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => handleStatusUpdate('approved')}
                disabled={isUpdating || document.document_status === 'approved'}
                variant="outline"
                size="sm"
                className="text-green-700 border-green-200 hover:bg-green-50"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              
              <Button
                onClick={() => handleStatusUpdate('rejected')}
                disabled={isUpdating || document.document_status === 'rejected'}
                variant="outline"
                size="sm"
                className="text-red-700 border-red-200 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              
              <Button
                onClick={() => handleStatusUpdate('pending')}
                disabled={isUpdating || document.document_status === 'pending'}
                variant="outline"
                size="sm"
                className="text-yellow-700 border-yellow-200 hover:bg-yellow-50"
              >
                <Clock className="w-4 h-4 mr-2" />
                Pending
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};