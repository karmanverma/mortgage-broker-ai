import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { DocumentWithUrl, DOCUMENT_TYPE_LABELS } from '@/features/documents/types';
import { 
  Eye, 
  Download, 
  Trash2, 
  FileText, 
  Image, 
  File,
  Calendar,
  User,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface DocumentCardProps {
  document: DocumentWithUrl;
  onView: (document: DocumentWithUrl) => void;
  onDownload: (document: DocumentWithUrl) => void;
  onDelete: (document: DocumentWithUrl) => void;
  onStatusUpdate: (document: DocumentWithUrl) => void;
  isDeleting?: boolean;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return Image;
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
    return format(new Date(dateString), 'MMM dd, yyyy');
  } catch {
    return 'Invalid date';
  }
};

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onView,
  onDownload,
  onDelete,
  onStatusUpdate,
  isDeleting = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const FileIcon = getFileIcon(document.file_type);
  
  const isExpired = document.expiration_date && 
    new Date(document.expiration_date) < new Date();

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md ${
        isHovered ? 'ring-2 ring-primary/20' : ''
      } ${isExpired ? 'border-red-200 bg-red-50/30' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* File info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <FileIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate" title={document.name}>
                {document.name}
              </h4>
              
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {DOCUMENT_TYPE_LABELS[document.document_type as keyof typeof DOCUMENT_TYPE_LABELS] || document.document_type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(document.file_size)}
                </span>
              </div>
              
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(document.created_at)}
                </div>
                {document.uploaded_by && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Uploaded
                  </div>
                )}
              </div>
              
              {document.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {document.description}
                </p>
              )}
            </div>
          </div>
          
          {/* Status and actions */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="flex flex-col items-end gap-1">
              <DocumentStatusBadge status={document.document_status as any} />
              
              {isExpired && (
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  Expired
                </div>
              )}
              
              {document.compliance_required && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  Compliance Required
                </Badge>
              )}
            </div>
            
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onView(document)}
                title="View document"
              >
                <Eye className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onDownload(document)}
                title="Download document"
              >
                <Download className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                onClick={() => onDelete(document)}
                disabled={isDeleting}
                title="Delete document"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {document.notes && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Notes:</strong> {document.notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};