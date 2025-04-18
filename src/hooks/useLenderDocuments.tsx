import { useState, useCallback } from 'react';
import { supabase, deleteFile } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Tables } from '@/integrations/supabase/types';

export type Document = Tables<'documents'>;

export type NewDocumentPayload = {
  name: string;
  description?: string;
  file: File;
  lenderId: string;
};

export interface UseLenderDocumentsReturn {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
  fetchDocuments: (lenderId?: string) => Promise<Document[]>;
  uploadDocument: (payload: NewDocumentPayload) => Promise<Document | null>;
  deleteDocument: (documentId: string, filePath: string, lenderId?: string) => Promise<boolean>;
}

export function useLenderDocuments(): UseLenderDocumentsReturn {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchDocuments = useCallback(async (lenderId?: string): Promise<Document[]> => {
    // ... (fetchDocuments implementation remains the same) ...
    console.log(`fetchDocuments called for lenderId: ${lenderId}`);
    if (!user) {
      console.log('fetchDocuments: No user found, returning empty array.');
      setDocuments([]);
      setIsLoading(false);
      setError('User not authenticated');
      return [];
    }

    setIsLoading(true);
    setError(null); // Clear previous errors
    let fetchedData: Document[] = [];

    try {
      console.log(`fetchDocuments: Fetching documents for user ${user.id} and lender ${lenderId}`);
      let query = supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id);

      if (lenderId) {
        query = query.eq('lender_id', lenderId);
      }

      const { data, error: fetchError, status } = await query.order('created_at', { ascending: false });

      console.log('fetchDocuments: Supabase query result:', { status, fetchError, data });

      if (fetchError) {
        console.error('fetchDocuments: Supabase error:', fetchError);
        throw fetchError;
      }

      fetchedData = data || [];
      setDocuments(fetchedData);
      console.log(`fetchDocuments: Successfully fetched and set ${fetchedData.length} documents.`);

    } catch (err: any) {
      console.error('Error fetching documents:', err);
      const errorMessage = err.message || 'Unknown error fetching documents';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Failed to load documents",
        description: errorMessage,
      });
      setDocuments([]);
      fetchedData = [];
    } finally {
      setIsLoading(false);
    }
    return fetchedData;
  }, [user]);

  const deleteDocument = useCallback(async (documentId: string, filePath: string, lenderId?: string): Promise<boolean> => {
    // ... (deleteDocument implementation remains the same) ...
    if (!user || !documentId || !filePath) {
        console.error('deleteDocument: Missing user, documentId, or filePath.');
        toast({ title: "Error", description: "Missing required information.", variant: "destructive" });
        return false;
    }
    console.log(`deleteDocument: Starting delete for document ID ${documentId}, path: ${filePath}`);

    try {
      console.log(`deleteDocument: Deleting from storage bucket 'lender_documents'...`);
      await deleteFile('lender_documents', filePath);
      console.log(`deleteDocument: File deleted from storage successfully.`);

      console.log(`deleteDocument: Deleting record from 'documents' table.`);
      const { error: deleteDbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', user.id);

      if (deleteDbError) {
        console.error('deleteDocument: Supabase DB delete error:', deleteDbError);
        toast({ title: "Database Delete Failed", description: deleteDbError.message, variant: "destructive" });
        return false;
      }
      console.log(`deleteDocument: Database record deleted successfully.`);

      await fetchDocuments(lenderId);

      toast({ title: "Document Deleted", description: "Document removed successfully." });
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
  }, [user, fetchDocuments]);

  const uploadDocument = useCallback(async (payload: NewDocumentPayload): Promise<Document | null> => {
    if (!user) {
      console.error("uploadDocument: No user found.");
      toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
      return null;
    }
    console.log(`uploadDocument: Starting upload for file: ${payload.file.name}, lender: ${payload.lenderId}`);

    const fileExt = payload.file.name.split('.').pop();
    const timestamp = Date.now();
    const safeFileName = payload.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${user.id}/${payload.lenderId}/${timestamp}_${safeFileName}`;
    console.log(`uploadDocument: Generated storage path: ${filePath}`);

    let uploadedFilePath: string | null = null;

    try {
      // 1. Upload to Storage
      console.log(`uploadDocument: Uploading to bucket 'lender_documents'...`);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lender_documents')
        .upload(filePath, payload.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('uploadDocument: Storage upload error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }
      uploadedFilePath = uploadData?.path ?? null;
      console.log(`uploadDocument: Storage upload successful. Path: ${uploadedFilePath}`);

      if (!uploadedFilePath) {
        throw new Error('Storage upload succeeded but did not return a path.');
      }

      // 2. Insert into Database
      console.log(`uploadDocument: Inserting record into 'documents' table.`);
      const { data: newDbRecord, error: insertError } = await supabase
        .from('documents')
        .insert({
          name: payload.name,
          file_path: uploadedFilePath,
          file_type: payload.file.type,
          file_size: payload.file.size,
          lender_id: payload.lenderId,
          user_id: user.id,
          description: payload.description || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('uploadDocument: Supabase insert error (check RLS policy!):', insertError);
        // Attempt cleanup on DB insert failure
        if (uploadedFilePath) {
          await deleteFile('lender_documents', uploadedFilePath).catch(cleanupErr => {
            console.error('Upload cleanup failed:', cleanupErr)
          });
        }
        throw new Error(`Database insert failed: ${insertError.message}`);
      }
      console.log('uploadDocument: Database record inserted:', newDbRecord);

      // *** 3. Generate Signed URL for Webhook ***
      let signedWebhookUrl: string | null = null;
      const webhookUrlExpiresIn = 3600; // 1 hour in seconds
      try {
          console.log(`uploadDocument: Generating signed URL for webhook (expires in ${webhookUrlExpiresIn}s)...`);
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('lender_documents')
              .createSignedUrl(uploadedFilePath, webhookUrlExpiresIn, { download: true }); // Use download: true

          if (signedUrlError) {
              console.error('uploadDocument: Error generating signed URL for webhook:', signedUrlError);
              // Continue without signed URL, maybe log a warning?
              toast({ title: "Webhook Warning", description: "Could not generate temporary URL for notification.", variant: "warning" });
          } else {
              signedWebhookUrl = signedUrlData.signedUrl;
              console.log(`uploadDocument: Signed URL for webhook generated: ${signedWebhookUrl}`);
          }
      } catch (urlError: any) {
          console.error('uploadDocument: Exception generating signed URL for webhook:', urlError);
          toast({ title: "Webhook Error", description: `Failed to generate temporary URL: ${urlError.message}`, variant: "warning" });
      }

      // *** 4. Send Webhook Notification ***
      const webhookUrl = 'https://n8n.srv783065.hstgr.cloud/webhook/093605b7-2040-4ab6-b151-4af4ed970bc4';
      // Use the signed URL if available, otherwise maybe send null or a placeholder?
      const webhookPayload = {
        document_id: newDbRecord.id,
        document_file_path: uploadedFilePath, // Keep the path for reference
        // Use the generated signed URL here
        uploaded_document_url: signedWebhookUrl, // This will be the signed URL or null
        document_file_type: payload.file.type,
      };
      console.log("uploadDocument: Sending webhook notification with payload:", webhookPayload);
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
      } catch (webhookError: any) {
        console.error("Error sending webhook:", webhookError);
        toast({ title: "Webhook Error", description: `Failed to send notification: ${webhookError.message}`, variant: "warning" });
      }

      toast({ title: "Document Uploaded", description: `${payload.name} uploaded successfully.` });

      // *** 5. Refetch for the specific lender ***
      await fetchDocuments(payload.lenderId);
      return newDbRecord;

    } catch (error: any) {
      console.error('Error in uploadDocument process:', error);
      toast({
        variant: "destructive",
        title: "Failed to upload document",
        description: error.message || 'An unknown error occurred.',
      });
      // Attempt cleanup if upload succeeded but something failed later
      if (uploadedFilePath && !error.message?.startsWith('Storage upload failed') && !error.message?.startsWith('Database insert failed')) {
        console.warn('Upload process failed after storage success, attempting cleanup...');
        await deleteFile('lender_documents', uploadedFilePath).catch(cleanupErr => {
          console.error('Upload error cleanup failed:', cleanupErr)
        });
      }
      return null;
    }
  }, [user, fetchDocuments]);

  return {
    documents,
    isLoading,
    error,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
  };
}
