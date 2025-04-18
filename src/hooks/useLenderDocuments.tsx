import { useState, useCallback } from 'react';
import { supabase, getStoragePaths, uploadFile, getFileUrl, deleteFile } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Tables } from '@/integrations/supabase/types';

export type Document = Tables<'documents'>;

export type NewDocumentPayload = {
  name: string; // Use the file name for the 'name' field
  description?: string;
  file: File;
  lenderId: string;
};

export function useLenderDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchDocuments = useCallback(async (lenderId?: string): Promise<Document[]> => {
    console.log(`fetchDocuments called for lenderId: ${lenderId}`);
    if (!user) {
      console.log('fetchDocuments: No user found, returning empty array.');
      setIsLoading(false);
      setDocuments([]);
      return [];
    }

    // Reset loading state correctly at the start
    setIsLoading(true);
    let fetchedData: Document[] = [];
    try {
      console.log(`fetchDocuments: Fetching documents for user ${user.id} and lender ${lenderId}`);
      let query = supabase
        .from('documents') // Ensure this is your table name
        .select('*')
        .eq('user_id', user.id);

      if (lenderId) {
        query = query.eq('lender_id', lenderId);
      }

      const { data, error, status } = await query.order('created_at', { ascending: false });

      console.log('fetchDocuments: Supabase query result:', { status, error, data });

      if (error) {
        console.error('fetchDocuments: Supabase error:', error);
        throw error;
      }

      fetchedData = data || [];
      // If fetching for a specific lender, don't overwrite the potentially global `documents` state.
      // If fetching globally (no lenderId), update the global state.
      if (!lenderId) {
         setDocuments(fetchedData);
      }
      console.log(`fetchDocuments: Successfully fetched ${fetchedData.length} documents.`);

    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast({
        variant: "destructive",
        title: "Failed to load documents",
        description: `Error: ${error.message || 'Unknown error'}`,
      });
       // Reset global state on error regardless
      setDocuments([]);
      fetchedData = [];
    } finally {
      // Always set loading false at the end
      setIsLoading(false);
    }
    return fetchedData;
  }, [user, toast]);

  // Delete function - accepts lenderId for potential refetch
  const deleteDocument = useCallback(async (documentId: string, filePath: string, lenderId?: string): Promise<boolean> => {
    if (!user || !documentId || !filePath) {
        console.error('deleteDocument: Missing user, documentId, or filePath.');
        return false;
    }
    console.log(`deleteDocument: Starting delete for document ID ${documentId}, path: ${filePath}`);

    try {
      console.log(`deleteDocument: Deleting from storage bucket 'lender_documents'...`);
      await deleteFile('lender_documents', filePath); // Use the helper
      console.log(`deleteDocument: File deleted from storage successfully.`);

      console.log(`deleteDocument: Deleting record from 'documents' table.`);
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', user.id);

      if (error) {
        // RLS might fail here if the policy isn't met
        console.error('deleteDocument: Supabase delete error:', error);
        toast({ title: "DB Delete Failed", description: error.message, variant: "destructive" });
        // Decide if you want to re-upload the file or notify the user
        return false; // Indicate failure
      }
      console.log(`deleteDocument: Database record deleted successfully.`);

      toast({ title: "Document Deleted", description: "Document removed successfully." });

      // Refetch for the specific lender if ID provided, otherwise maybe global?
      // Since the dialog manages its own list based on the fetch, this might not be strictly needed
      // unless other parts of the app rely on the global `documents` state.
      if(lenderId) {
          await fetchDocuments(lenderId); // Re-fetch for the specific lender
      } else {
          await fetchDocuments(); // Re-fetch global list
      }
      return true;

    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        variant: "destructive",
        title: "Failed to delete document",
        description: `Error: ${error.message || 'Unknown error'}`,
      });
      return false;
    }
  }, [user, fetchDocuments, toast]);

  // Upload function - includes webhook
  const uploadDocument = useCallback(async (payload: NewDocumentPayload): Promise<Document | null> => {
    if (!user) {
        console.error("uploadDocument: No user found.");
        return null;
    }
    console.log(`uploadDocument: Starting upload for file: ${payload.file.name}, lender: ${payload.lenderId}`);

    // Use a consistent path structure (e.g., public/[lender_id]/[timestamp]_[filename])
    // Ensure the bucket ('lender_documents') allows public access if needed for getFileUrl
    const fileExt = payload.file.name.split('.').pop();
    const timestamp = Date.now();
    const safeFileName = payload.file.name.replace(/[^a-zA-Z0-9._-]/g, '_'); // Sanitize filename
    const filePath = `public/${payload.lenderId}/${timestamp}_${safeFileName}`;
    console.log(`uploadDocument: Generated storage path: ${filePath}`);

    try {
      // 1. Upload to Storage
      console.log(`uploadDocument: Uploading to bucket 'lender_documents'...`);
      await uploadFile('lender_documents', filePath, payload.file); // Use the helper
      console.log(`uploadDocument: Storage upload successful.`);

      // 2. Insert into Database (Ensure columns match your table schema)
      console.log(`uploadDocument: Inserting record into 'documents' table.`);
      const { data: newDbRecord, error: insertError } = await supabase
        .from('documents')
        .insert({
          // Map payload fields to your actual DB column names
          name: payload.name, // Use the provided name (usually file name)
          file_path: filePath,
          file_type: payload.file.type,
          file_size: payload.file.size,
          lender_id: payload.lenderId,
          user_id: user.id, // *** CRITICAL FOR RLS ***
          description: payload.description || null,
        })
        .select()
        .single();

      if (insertError) {
        // *** THIS IS LIKELY THE RLS ERROR POINT ***
        console.error('uploadDocument: Supabase insert error (check RLS policy!):', insertError);
        // Attempt cleanup on DB insert failure
        console.log('uploadDocument: DB insert failed, attempting storage cleanup...');
        await deleteFile('lender_documents', filePath);
        throw insertError; // Re-throw to be caught below
      }
      console.log('uploadDocument: Database record inserted:', newDbRecord);

       // 3. Get Public URL (Best effort, after successful insert)
       const documentUrl = getFileUrl('lender_documents', filePath);
       console.log("uploadDocument: Public URL:", documentUrl || "Could not generate");

      // 4. Send Webhook Notification (AFTER successful insert)
      const webhookUrl = 'https://n8n.srv783065.hstgr.cloud/webhook/093605b7-2040-4ab6-b151-4af4ed970bc4';
      const webhookPayload = {
        document_id: newDbRecord.id,
        document_file_path: filePath,
        uploaded_document_url: documentUrl,
        document_file_type: payload.file.type,
      };
      console.log("uploadDocument: Sending webhook notification:", webhookPayload);
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

      toast({ title: "Document Uploaded", description: `${payload.name} uploaded successfully.` });

      // Refetch for the specific lender
      await fetchDocuments(payload.lenderId);
      return newDbRecord;

    } catch (error: any) {
      console.error('Error in uploadDocument process:', error);
      toast({
        variant: "destructive",
        title: "Failed to upload document",
        description: error.message || 'An unknown error occurred.',
      });
      return null;
    }
  }, [user, fetchDocuments, toast]);


  return {
    documents, // The global list (might be stale if specific fetches happened)
    isLoading,
    fetchDocuments, // Fetches specific or global, returns result
    uploadDocument, // Handles upload, DB insert, webhook
    deleteDocument, // Handles delete
  };
}
