import { useState, useCallback } from 'react'; // Import useCallback
import { supabase, getStoragePaths, uploadFile, getFileUrl, deleteFile } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Tables } from '@/integrations/supabase/types';

export type Document = Tables<'documents'>;

export type NewDocument = {
  name: string;
  description?: string;
  file: File;
  lenderId: string;
};

export function useLenderDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Memoize fetchDocuments
  const fetchDocuments = useCallback(async (lenderId?: string) => {
    console.log(`fetchDocuments called for lenderId: ${lenderId}`);
    if (!user) {
      console.log('fetchDocuments: No user found, returning.');
      setIsLoading(false);
      setDocuments([]); // Clear documents if no user
      return;
    }

    setIsLoading(true);
    try {
      console.log(`fetchDocuments: Fetching documents for user ${user.id} and lender ${lenderId}`);
      let query = supabase
        .from('documents')
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

      setDocuments(data || []);
      console.log(`fetchDocuments: Successfully fetched ${data?.length || 0} documents.`);

    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast({
        variant: "destructive",
        title: "Failed to load documents",
        description: `Error: ${error.message || 'Unknown error'}`,
      });
      setDocuments([]);
    } finally {
      console.log('fetchDocuments: Setting isLoading to false.');
      setIsLoading(false);
    }
    // Dependencies for fetchDocuments: user (from useAuth), supabase (stable), toast (assume stable)
    // State setters (setIsLoading, setDocuments) are stable.
  }, [user, toast]); // supabase is stable, state setters are stable

  // Memoize uploadDocument
  const uploadDocument = useCallback(async (newDocument: NewDocument) => {
    if (!user) return null;
    console.log(`uploadDocument: Starting upload for ${newDocument.name}`);

    try {
      const paths = getStoragePaths(user.id);
      const fileExt = newDocument.file.name.split('.').pop();
      const timestamp = new Date().getTime();
      const filePath = `${paths.lenderDocuments}/${newDocument.lenderId}/${timestamp}_${newDocument.name.replace(/\s+/g, '_')}.${fileExt}`;
      console.log(`uploadDocument: Uploading to storage path: ${filePath}`);

      await uploadFile('lender_documents', filePath, newDocument.file);
      console.log(`uploadDocument: File uploaded to storage successfully.`);

      console.log(`uploadDocument: Inserting record into 'documents' table.`);
      const { data, error } = await supabase
        .from('documents')
        .insert({
          name: newDocument.name,
          description: newDocument.description || null,
          file_path: filePath,
          file_type: newDocument.file.type,
          file_size: newDocument.file.size,
          lender_id: newDocument.lenderId,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
         console.error('uploadDocument: Supabase insert error:', error);
         throw error;
      }
      console.log('uploadDocument: Database record inserted:', data);

      toast({
        title: "Document Uploaded",
        description: `${newDocument.name} has been uploaded successfully.`,
      });

      // Call the memoized fetchDocuments
      await fetchDocuments(newDocument.lenderId);
      return data;

    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        variant: "destructive",
        title: "Failed to upload document",
        description: `Error: ${error.message || 'Unknown error'}`,
      });
      return null;
    }
    // Dependencies for uploadDocument: user, fetchDocuments (now stable), toast, supabase
  }, [user, fetchDocuments, toast]); // supabase is stable

  // Memoize deleteDocument
  const deleteDocument = useCallback(async (document: Document) => {
    if (!user) return false;
    console.log(`deleteDocument: Starting delete for document ID ${document.id}, path: ${document.file_path}`);

    try {
      console.log(`deleteDocument: Deleting from storage bucket 'lender_documents'`);
      await deleteFile('lender_documents', document.file_path);
      console.log(`deleteDocument: File deleted from storage successfully.`);

      console.log(`deleteDocument: Deleting record from 'documents' table.`);
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('deleteDocument: Supabase delete error:', error);
        throw error;
      }
      console.log(`deleteDocument: Database record deleted successfully.`);

      toast({
        title: "Document Deleted",
        description: "The document has been deleted successfully.",
      });

      // Call the memoized fetchDocuments
      await fetchDocuments(document.lender_id);
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
     // Dependencies for deleteDocument: user, fetchDocuments (now stable), toast, supabase
  }, [user, fetchDocuments, toast]); // supabase is stable

  // Return the memoized functions
  return {
    documents,
    isLoading,
    fetchDocuments,
    uploadDocument,
    deleteDocument
  };
}
