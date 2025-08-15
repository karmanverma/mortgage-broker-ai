import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DocumentCategory } from '../documents/DocumentCategory';
import { DocumentViewer } from '../documents/DocumentViewer';
import { useImprovedDocuments } from '@/hooks/useImprovedDocuments';
import { 
  DocumentWithUrl,
  DocumentUpload as DocumentUploadType,
  DocumentCategory as DocumentCategoryType,
  DocumentStatus,
  DOCUMENT_CATEGORY_LABELS
} from '@/features/documents/types';
import { FileText, Download, Filter } from 'lucide-react';

interface DocumentsTabProps {
  clientId: string;
  loanId?: string;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ clientId, loanId }) => {
  const {
    documents,
    addDocument,
    updateDocument,
    deleteDocument,
    downloadFile,
    updateDocumentStatus,
    getDocumentsByCategory,
    getCategoryProgress,
    getOverallProgress,
    isLoading,
    isUploading,
    isDeleting,
    isUpdating
  } = useImprovedDocuments(clientId);

  const [selectedDocument, setSelectedDocument] = useState<DocumentWithUrl | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [loanFilter, setLoanFilter] = useState<string>('all');

  // Filter documents by loan if needed
  const filteredDocuments = loanFilter === 'all' 
    ? documents 
    : documents.filter(doc => 
        loanFilter === 'general' 
          ? !doc.loan_id 
          : doc.loan_id === loanFilter
      );

  const categories: DocumentCategoryType[] = [
    'identification',
    'income', 
    'assets',
    'property',
    'additional'
  ];

  const handleUpload = async (upload: DocumentUploadType) => {
    await addDocument(upload);
  };

  const handleView = (document: DocumentWithUrl) => {
    setSelectedDocument(document);
    setViewerOpen(true);
  };

  const handleDownload = async (document: DocumentWithUrl) => {
    await downloadFile(document);
  };

  const handleDelete = async (document: DocumentWithUrl) => {
    if (window.confirm(`Are you sure you want to delete "${document.name}"?`)) {
      await deleteDocument(document.id);
    }
  };

  const handleStatusUpdate = (document: DocumentWithUrl) => {
    setSelectedDocument(document);
    setViewerOpen(true);
  };

  const handleViewerStatusUpdate = async (
    document: DocumentWithUrl, 
    status: DocumentStatus, 
    notes?: string
  ) => {
    await updateDocumentStatus(document.id, status, notes);
    setViewerOpen(false);
    setSelectedDocument(null);
  };

  const overallProgress = getOverallProgress();

  // Get unique loans for filter
  const availableLoans = Array.from(
    new Set(documents.filter(doc => doc.loan_id).map(doc => doc.loan_id))
  );

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Loading documents...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                Manage documents uploaded for this client. Track progress and upload required files by category.
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Loan Filter */}
              {availableLoans.length > 0 && (
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={loanFilter} onValueChange={setLoanFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Documents</SelectItem>
                      <SelectItem value="general">General Client Docs</SelectItem>
                      {availableLoans.map(loanId => (
                        <SelectItem key={loanId} value={loanId!}>
                          Loan {loanId?.slice(-8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Overall Progress */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Completion</span>
                <div className="w-32">
                  <Progress value={overallProgress} />
                </div>
                <span className="text-xs text-muted-foreground">{overallProgress}%</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Document Categories Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {categories.map((category) => {
              const categoryDocuments = getDocumentsByCategory(category).filter(doc =>
                loanFilter === 'all' ||
                (loanFilter === 'general' && !doc.loan_id) ||
                (loanFilter !== 'general' && loanFilter !== 'all' && doc.loan_id === loanFilter)
              );
              
              const progress = getCategoryProgress(category);
              
              return (
                <DocumentCategory
                  key={category}
                  category={category}
                  documents={categoryDocuments}
                  progress={progress}
                  clientId={clientId}
                  loanId={loanFilter !== 'all' && loanFilter !== 'general' ? loanFilter : undefined}
                  onUpload={handleUpload}
                  onView={handleView}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  onStatusUpdate={handleStatusUpdate}
                  isUploading={isUploading}
                  isDeleting={isDeleting}
                />
              );
            })}
          </div>
          
          {/* Summary Stats */}
          {documents.length > 0 && (
            <div className="mt-8 p-4 bg-muted/30 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{documents.length}</div>
                  <div className="text-sm text-muted-foreground">Total Documents</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {documents.filter(d => d.document_status === 'approved').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Approved</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {documents.filter(d => d.document_status === 'pending').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {documents.filter(d => d.document_status === 'rejected').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Rejected</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Global Actions */}
          <div className="flex flex-col md:flex-row gap-2 justify-end mt-6">
            <Button variant="secondary" disabled>
              <Download className="w-4 h-4 mr-2" />
              Export Summary
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Document Viewer */}
      <DocumentViewer
        document={selectedDocument}
        isOpen={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setSelectedDocument(null);
        }}
        onDownload={handleDownload}
        onStatusUpdate={handleViewerStatusUpdate}
        isUpdating={isUpdating}
      />
    </>
  );
};

export default DocumentsTab;
