// src/components/lenders/ManageDocumentsDialog.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLenderDocuments } from '@/hooks/useLenderDocuments';
import { Lender } from '@/hooks/useLenders';
import { Trash2, UploadCloud, FileText, Download, Loader2 } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type Document = Tables<'documents'>;

interface ManageDocumentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lender: Lender | null;
}

// Helper function to get public URL
const getFileUrl = (bucket: string, path: string): string => {
    try {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data?.publicUrl || '';
    } catch (error) {
        console.error("Error getting public URL:", error);
        return '';
    }
};

const ManageDocumentsDialog: React.FC<ManageDocumentsDialogProps> = ({ isOpen, onClose, lender }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [lenderDocs, setLenderDocs] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const { toast } = useToast();
  // Get fetchDocuments and deleteDocument from the hook
  const { fetchDocuments, deleteDocument } = useLenderDocuments();

  // Use useCallback to memoize loadDocuments
  const loadDocuments = useCallback(async () => {
    if (!lender || !lender.id) {
        console.log("loadDocuments: Aborted - No lender or lender ID.");
        setLenderDocs([]); // Ensure list is cleared if no lender
        return;
    }
    setIsLoadingDocs(true);
    console.log(`loadDocuments: Fetching documents specifically for lender ID: ${lender.id}`);
    try {
      // Call fetchDocuments from the hook *with* the lenderId
      const docsForLender = await fetchDocuments(lender.id);
      // The hook now returns the filtered data directly
      setLenderDocs(docsForLender);
      console.log(`loadDocuments: Found ${docsForLender.length} documents for lender ${lender.id}.`);
    } catch (error) {
        console.error("loadDocuments: Error fetching documents:", error);
        toast({ title: "Error", description: "Could not load documents.", variant: "destructive" });
        setLenderDocs([]); // Clear docs on error
    } finally {
        setIsLoadingDocs(false);
    }
    // Dependencies: lender object (specifically lender.id), fetchDocuments (stable via hook)
  }, [lender, fetchDocuments, toast]);

  // useEffect to load documents when the dialog opens or the lender changes
  useEffect(() => {
    if (isOpen && lender) {
      loadDocuments();
    } else {
      // Reset state when closed or no lender
      setLenderDocs([]);
      setSelectedFile(null);
      setIsLoadingDocs(false); // Ensure loading state is reset
      setIsUploading(false);
      setIsDeleting(null);
    }
  }, [isOpen, lender, loadDocuments]); // loadDocuments is now stable

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    } else {
        setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !lender) return;

    setIsUploading(true);
    console.log(`Starting upload for ${selectedFile.name}, lender: ${lender.id}`);
    const fileExt = selectedFile.name.split('.').pop();
    // Ensure bucket name ('lender_documents') and path structure are correct
    const filePath = `public/${lender.id}/${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    console.log(`Generated file path: ${filePath}`);

    try {
      // 1. Upload to Storage
      console.log("Uploading to storage bucket 'lender_documents'...");
      const { error: uploadError } = await supabase.storage
        .from('lender_documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;
      console.log("Storage upload successful.");

      // 2. Get Public URL (Best effort)
      const documentUrl = getFileUrl('lender_documents', filePath);
      console.log("Public URL:", documentUrl || "Could not generate");

      // 3. Insert into Database
      console.log("Inserting into database table 'documents'...");
      const { data: newDocument, error: insertError } = await supabase
        .from('documents') // Ensure table name is correct
        .insert({
          lender_id: lender.id,
          file_path: filePath,
          file_name: selectedFile.name, // Ensure columns match your 'documents' table
          file_type: selectedFile.type,
          // name: selectedFile.name, // If you have a separate 'name' column
          file_size: selectedFile.size, // If you track size
          // user_id: Get user ID if needed from useAuth
        })
        .select()
        .single();

      if (insertError) {
        console.error("Database insert failed, attempting cleanup...");
        await supabase.storage.from('lender_documents').remove([filePath]);
        throw insertError;
      }
      console.log("Database insert successful:", newDocument);

      // 4. Send Webhook Notification
      const webhookUrl = 'https://n8n.srv783065.hstgr.cloud/webhook/093605b7-2040-4ab6-b151-4af4ed970bc4';
      const webhookPayload = {
        document_id: newDocument.id,
        document_file_path: filePath,
        uploaded_document_url: documentUrl,
        document_file_type: selectedFile.type,
      };
      console.log("Sending webhook notification:", webhookPayload);
      try {
          const response = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(webhookPayload),
          });
          if (!response.ok) {
              console.error('Webhook failed:', response.status, await response.text());
              toast({ title: "Webhook Warning", description: `Could not notify system. Status: ${response.status}`, variant: "warning" });
          } else {
              console.log("Webhook sent successfully.");
          }
      } catch (webhookError) {
          console.error("Error sending webhook:", webhookError);
          toast({ title: "Webhook Error", description: "Failed to send notification.", variant: "warning" });
      }

      toast({ title: "Success", description: `Uploaded "${selectedFile.name}".` });
      setSelectedFile(null); // Reset file input
      // Refresh the list after upload by calling loadDocuments again
      await loadDocuments();

    } catch (error: any) {
      console.error('Upload process error:', error);
      toast({ title: 'Upload Failed', description: error.message || 'Could not upload.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

 const handleDelete = async (docToDelete: Document) => {
     if (!lender || !docToDelete || !docToDelete.id || !docToDelete.file_path) return;
     if (!confirm(`Are you sure you want to delete "${docToDelete.file_name}"?`)) return;

     setIsDeleting(docToDelete.id);
     console.log(`Deleting document ID: ${docToDelete.id}, Path: ${docToDelete.file_path}`);
     try {
         // Call the hook function with the ID and path
         const success = await deleteDocument(docToDelete.id, docToDelete.file_path);

         if (success) {
             console.log("Deletion successful via hook.");
             toast({ title: "Deleted", description: `Removed "${docToDelete.file_name}".` });
             // Update UI immediately
             setLenderDocs(prevDocs => prevDocs.filter(doc => doc.id !== docToDelete.id));
         } else {
              // Hook should have shown a toast, but we log here too
              console.error("Deletion failed according to hook.");
              // Optional: Show a generic failure toast if the hook doesn't always
              // toast({ title: "Deletion Failed", description: "Could not delete document.", variant: "destructive" });
         }
     } catch (error: any) {
         // Catch errors not handled by the hook itself
         console.error("Deletion error (dialog catch block):", error);
         toast({ title: "Deletion Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
     } finally {
         setIsDeleting(null);
     }
  };


  return (
    // Add aria-describedby to DialogContent if you have descriptive text within it
    // e.g., <DialogDescription>Manage or upload documents...</DialogDescription>
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Documents {lender ? `for ${lender.name}` : ''}</DialogTitle>
          {/* Optional: Add <DialogDescription> here for accessibility */}
        </DialogHeader>
        <Tabs defaultValue="manage" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manage">Manage Docs</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>

          {/* Manage Documents Tab */}
          <TabsContent value="manage">
            <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {isLoadingDocs && (
                    <div className="flex justify-center items-center p-6">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Loading documents...</span>
                    </div>
                )}
                {!isLoadingDocs && lenderDocs.length === 0 && (
                    <p className="text-center text-muted-foreground py-6">No documents found for this lender.</p>
                )}
                {!isLoadingDocs && lenderDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/40">
                        <div className="flex items-center space-x-2 overflow-hidden min-w-0"> {/* Added min-w-0 */}
                            <FileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                            {/* Use file_name from document object */}
                            <span className="truncate text-sm" title={doc.file_name || 'Unknown Name'}>{doc.file_name || 'Unknown Name'}</span>
                             {/* Use file_type from document object */}
                            {doc.file_type && <span className="text-xs text-muted-foreground">({doc.file_type})</span>}
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                             <Button
                                variant="ghost" size="icon" className="h-7 w-7"
                                title={`Download ${doc.file_name || 'document'}`}
                                // Ensure file_path exists before enabling/calling
                                onClick={() => doc.file_path && window.open(getFileUrl('lender_documents', doc.file_path), '_blank')}
                                disabled={!doc.file_path}
                             >
                                <Download className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700"
                                title={`Delete ${doc.file_name || 'document'}`}
                                onClick={() => handleDelete(doc)}
                                disabled={isDeleting === doc.id || !doc.id || !doc.file_path} // Disable if no ID/path
                             >
                                {isDeleting === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
          </TabsContent>

          {/* Upload New Tab */}
          <TabsContent value="upload">
            <div className="grid gap-4 py-4 mt-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="document-upload" className="text-right">
                  Document
                </Label>
                <Input
                  id="document-upload"
                  type="file"
                  className="col-span-3"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  // Reset file input visually if needed when selectedFile becomes null
                  // value={selectedFile ? undefined : ''} // One way, might have side effects
                />
              </div>
              {selectedFile && (
                  <div className="col-span-4 text-sm text-muted-foreground pl-[calc(25%+1rem)]">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </div>
              )}
            </div>
            <DialogFooter className="mt-4">
              <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
                {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : <><UploadCloud className="mr-2 h-4 w-4" /> Upload File</>}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
        <DialogFooter className="mt-6 sm:justify-end border-t pt-4"> {/* Added border */}
             <DialogClose asChild>
                 <Button type="button" variant="outline">Close</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageDocumentsDialog;
