// src/components/lenders/ManageDocumentsDialog.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLenderDocuments } from '@/hooks/useLenderDocuments';
import { Lender, LenderDocument } from '@/integrations/supabase/types';
import { useToast } from "@/components/ui/use-toast";
import ManageDocumentsTab from './ManageDocumentsTab';
import UploadDocumentTab from './UploadDocumentTab';
import { Loader2 } from 'lucide-react';
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ManageDocumentsDialogProps {
  lender: Lender | null;
  isOpen: boolean;
  onClose: () => void;
}

const ManageDocumentsDialog: React.FC<ManageDocumentsDialogProps> = ({
  lender,
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const lenderId = lender?.id ?? '';
  // Destructure the uploadDocument function directly from the hook
  const {
    documents,
    isLoading,
    fetchDocuments,
    uploadDocument, // Use this directly
    deleteDocument,
    generateSignedUrl,
  } = useLenderDocuments(lenderId);

  const [activeTab, setActiveTab] = useState('manage');
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [docPendingDeletion, setDocPendingDeletion] = useState<LenderDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && lenderId) {
      fetchDocuments();
    }
    if (isOpen) {
       setActiveTab('manage');
    }
    if (!isOpen) {
        setIsDeleteDialogOpen(false);
        setDocPendingDeletion(null);
        setIsDeleting(false);
    }
  }, [isOpen, lenderId, fetchDocuments]);

  const handleDownload = async (docToDownload: LenderDocument) => {
    if (!docToDownload || !docToDownload.file_path) {
        toast({ title: "Error", description: "Invalid document data for download.", variant: "destructive" });
        return;
    }
    setProcessingDocId(docToDownload.id);
    try {
      const { signedUrl, error } = await generateSignedUrl(docToDownload.file_path);
      if (error || !signedUrl) throw new Error(error || "Could not get download URL");

      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = docToDownload.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: "Success", description: `Started downloading ${docToDownload.name}` });
    } catch (error: any) {
      console.error("Error downloading document:", error);
      toast({ title: "Download Error", description: `Failed to download ${docToDownload.name}. ${error.message}`, variant: "destructive" });
    } finally {
      setProcessingDocId(null);
    }
  };

  const triggerDeleteConfirmation = (docToDelete: LenderDocument) => {
    if (!docToDelete || !docToDelete.file_path) {
         toast({ title: "Error", description: "Invalid document data for deletion.", variant: "destructive" });
         return;
     }
     setDocPendingDeletion(docToDelete);
     setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!docPendingDeletion) return;
    setIsDeleting(true);
    setProcessingDocId(docPendingDeletion.id);
    try {
      await deleteDocument(docPendingDeletion.id, docPendingDeletion.file_path);
      toast({ title: "Success", description: `${docPendingDeletion.name} deleted successfully.` });
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast({ title: "Deletion Error", description: `Failed to delete ${docPendingDeletion.name}. ${error.message}`, variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setProcessingDocId(null);
      setIsDeleteDialogOpen(false);
      setDocPendingDeletion(null);
    }
  };

  const handleUploadSuccess = useCallback(() => {
    setActiveTab('manage');
  }, []);

  const isProcessing = (docId: string | null) => processingDocId === docId;

  return (
    <> 
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="sm:max-w-[600px] pb-6">
          <DialogHeader>
            <DialogTitle>Manage Documents</DialogTitle>
            <DialogDescription>
              Manage documents for {lender?.name || 'this lender'}.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manage">Manage Existing</TabsTrigger>
              <TabsTrigger value="upload">Upload New</TabsTrigger>
            </TabsList>
            <TabsContent value="manage" className="mt-4">
              <ManageDocumentsTab
                documents={documents}
                isLoading={isLoading}
                isProcessing={isProcessing}
                handleDownload={handleDownload}
                handleDelete={triggerDeleteConfirmation}
              />
            </TabsContent>
            <TabsContent value="upload" className="mt-4">
               {lenderId ? (
                 <UploadDocumentTab
                     lenderId={lenderId}
                     onUploadSuccess={handleUploadSuccess}
                     // Pass the uploadDocument function from the hook directly
                     uploadDocument={uploadDocument}
                 />
              ) : (
                  <div className="text-center text-muted-foreground p-4">Invalid lender selected.</div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the document <span className="font-medium">{docPendingDeletion?.name}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDocPendingDeletion(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManageDocumentsDialog;
