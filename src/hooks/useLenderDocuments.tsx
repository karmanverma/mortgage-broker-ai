
import { useState } from 'react';
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

  const fetchDocuments = async (lenderId?: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id);
      
      if (lenderId) {
        query = query.eq('lender_id', lenderId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setDocuments(data || []);
      
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast({
        variant: "destructive",
        title: "Failed to load documents",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadDocument = async (newDocument: NewDocument) => {
    if (!user) return null;
    
    try {
      // 1. Upload file to storage
      const paths = getStoragePaths(user.id);
      const fileExt = newDocument.file.name.split('.').pop();
      const timestamp = new Date().getTime();
      const filePath = `${paths.lenderDocuments}/${newDocument.lenderId}/${timestamp}_${newDocument.name.replace(/\s+/g, '_')}.${fileExt}`;
      
      await uploadFile('lender_documents', filePath, newDocument.file);
      
      const fileUrl = getFileUrl('lender_documents', filePath);
      
      // 2. Create document record in database
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
      
      if (error) throw error;
      
      toast({
        title: "Document Uploaded",
        description: `${newDocument.name} has been uploaded successfully.`,
      });
      
      await fetchDocuments(newDocument.lenderId);
      return data;
      
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        variant: "destructive",
        title: "Failed to upload document",
        description: error.message,
      });
      return null;
    }
  };

  const deleteDocument = async (document: Document) => {
    if (!user) return false;
    
    try {
      // 1. Delete file from storage
      await deleteFile('lender_documents', document.file_path);
      
      // 2. Delete document record from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Document Deleted",
        description: "The document has been deleted successfully.",
      });
      
      await fetchDocuments(document.lender_id);
      return true;
      
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        variant: "destructive",
        title: "Failed to delete document",
        description: error.message,
      });
      return false;
    }
  };

  return {
    documents,
    isLoading,
    fetchDocuments,
    uploadDocument,
    deleteDocument
  };
}
