import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DocumentCard } from './DocumentCard';
import { DocumentUpload } from './DocumentUpload';
import { 
  DocumentCategory as DocumentCategoryType, 
  DocumentWithUrl,
  DocumentUpload as DocumentUploadType,
  DOCUMENT_CATEGORY_LABELS,
  CategoryProgress
} from '@/features/documents/types';
import { Upload, Plus, FileText } from 'lucide-react';

interface DocumentCategoryProps {
  category: DocumentCategoryType;
  documents: DocumentWithUrl[];
  progress: CategoryProgress;
  clientId: string;
  loanId?: string;
  onUpload: (upload: DocumentUploadType) => Promise<void>;
  onView: (document: DocumentWithUrl) => void;
  onDownload: (document: DocumentWithUrl) => void;
  onDelete: (document: DocumentWithUrl) => void;
  onStatusUpdate: (document: DocumentWithUrl) => void;
  isUploading?: boolean;
  isDeleting?: boolean;
}

export const DocumentCategory: React.FC<DocumentCategoryProps> = ({
  category,
  documents,
  progress,
  clientId,
  loanId,
  onUpload,
  onView,
  onDownload,
  onDelete,
  onStatusUpdate,
  isUploading = false,
  isDeleting = false
}) => {
  const [showUpload, setShowUpload] = useState(false);

  const handleUpload = async (upload: DocumentUploadType) => {
    await onUpload(upload);
    setShowUpload(false);
  };

  if (showUpload) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <DocumentUpload
            clientId={clientId}
            loanId={loanId}
            category={category}
            onUpload={handleUpload}
            onCancel={() => setShowUpload(false)}
            isUploading={isUploading}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {DOCUMENT_CATEGORY_LABELS[category]}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Progress value={progress.percentage} className="w-16 h-2" />
            <span className="text-xs text-muted-foreground">
              {progress.percentage}%
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {progress.totalDocuments} document{progress.totalDocuments !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-3">
            {progress.approvedDocuments > 0 && (
              <span className="text-green-600">
                {progress.approvedDocuments} approved
              </span>
            )}
            {progress.pendingDocuments > 0 && (
              <span className="text-yellow-600">
                {progress.pendingDocuments} pending
              </span>
            )}
            {progress.rejectedDocuments > 0 && (
              <span className="text-red-600">
                {progress.rejectedDocuments} rejected
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        {/* Upload Zone */}
        <div
          className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg min-h-[200px] p-4 bg-muted/40 hover:border-primary transition cursor-pointer mb-4"
          onClick={() => setShowUpload(true)}
        >
          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
          <span className="font-medium text-sm">Drop files here or</span>
          <Button variant="outline" size="sm" className="mt-2">
            <Plus className="w-4 h-4 mr-2" />
            Browse Files
          </Button>
          <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
            <FileText className="w-4 h-4" />
            <span>PDF, JPG, PNG • Max 25MB</span>
          </div>
        </div>
        
        {/* Documents List */}
        <div className="flex-1 space-y-3">
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No documents uploaded yet</p>
            </div>
          ) : (
            documents.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                onView={onView}
                onDownload={onDownload}
                onDelete={onDelete}
                onStatusUpdate={onStatusUpdate}
                isDeleting={isDeleting}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};