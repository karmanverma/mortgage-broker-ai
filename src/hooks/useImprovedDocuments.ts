import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useActivityAndNotification } from './useActivityAndNotification';
import { 
  Document, 
  DocumentInsert, 
  DocumentUpdate, 
  DocumentUpload,
  DocumentWithUrl,
  DocumentCategory,
  DocumentStatus,
  DocumentFilters,
  CategoryProgress,
  DOCUMENTS_BUCKET,
  DOCUMENT_CATEGORY_MAPPING
} from '@/features/documents/types';

interface UseImprovedDocumentsReturn {
  // Data
  documents: DocumentWithUrl[];
  filteredDocuments: DocumentWithUrl[];
  
  // CRUD operations
  addDocument: (upload: DocumentUpload) => Promise<Document | null>;
  updateDocument: (id: string, updates: DocumentUpdate) => Promise<Document | null>;
  deleteDocument: (id: string) => Promise<boolean>;
  
  // File operations
  uploadFile: (file: File, path: string) => Promise<string | null>;
  downloadFile: (doc: Document) => Promise<void>;
  getFileUrl: (doc: Document) => Promise<string | null>;
  
  // Status management
  updateDocumentStatus: (id: string, status: DocumentStatus, notes?: string) => Promise<Document | null>;
  markAsCompliant: (id: string, compliant: boolean) => Promise<Document | null>;
  
  // Filtering and organization
  getDocumentsByCategory: (category: DocumentCategory) => DocumentWithUrl[];
  getDocumentsByLoan: (loanId: string) => DocumentWithUrl[];
  setFilters: (filters: DocumentFilters) => void;
  
  // Progress tracking
  getCategoryProgress: (category: DocumentCategory) => CategoryProgress;
  getOverallProgress: () => number;
  
  // Loading states
  isLoading: boolean;
  isUploading: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  
  // Error handling
  error: string | null;
  
  // Utility
  refreshDocuments: () => Promise<void>;
}

export const useImprovedDocuments = (clientId?: string): UseImprovedDocumentsReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivityAndNotify } = useActivityAndNotification();
  
  // State
  const [documents, setDocuments] = useState<DocumentWithUrl[]>([]);
  const [filters, setFilters] = useState<DocumentFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      // Filter by client if provided
      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      // Get file URLs for documents
      const documentsWithUrls = await Promise.all(
        (data || []).map(async (doc) => {
          const fileUrl = await getFileUrl(doc);
          return { ...doc, fileUrl };
        })
      );
      
      setDocuments(documentsWithUrls);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error loading documents',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, clientId, toast]);

  // Upload file to Supabase Storage
  const uploadFile = useCallback(async (file: File, path: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      return data.path;
    } catch (err: any) {
      toast({
        title: 'File upload failed',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  // Get file URL from storage
  const getFileUrl = useCallback(async (doc: Document): Promise<string | null> => {
    if (!doc.storage_path) return null;
    
    try {
      const { data } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .createSignedUrl(doc.storage_path, 3600); // 1 hour expiry
      
      return data?.signedUrl || null;
    } catch (err) {
      return null;
    }
  }, []);

  // Add document
  const addDocument = useCallback(async (upload: DocumentUpload): Promise<Document | null> => {
    if (!user) return null;
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Generate storage path
      const timestamp = Date.now();
      const fileExtension = upload.file.name.split('.').pop();
      const storagePath = `${user.id}/${upload.clientId}/${upload.documentCategory}/${timestamp}_${upload.file.name}`;
      
      // Upload file
      const uploadedPath = await uploadFile(upload.file, storagePath);
      if (!uploadedPath) throw new Error('File upload failed');
      
      // Create document record
      const documentData: DocumentInsert = {
        user_id: user.id,
        client_id: upload.clientId,
        loan_id: upload.loanId || null,
        name: upload.file.name,
        description: upload.description || null,
        document_category: upload.documentCategory,
        document_type: upload.documentType,
        file_path: uploadedPath, // Keep for backward compatibility
        storage_path: uploadedPath,
        file_type: upload.file.type,
        file_size: upload.file.size,
        document_status: 'pending',
        compliance_required: upload.complianceRequired || false,
        expiration_date: upload.expirationDate || null,
        uploaded_by: user.id,
        lender_id: null // Not a lender document
      };
      
      const { data, error } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Log activity
      await logActivityAndNotify(
        {
          action_type: 'document_uploaded',
          client_id: upload.clientId,
          document_id: data.id,
          description: `Document "${upload.file.name}" uploaded (${upload.documentCategory})`,
          user_id: user.id,
          created_at: new Date().toISOString(),
          lender_id: null,
          id: undefined,
        },
        {
          user_id: user.id,
          type: 'document_uploaded',
          entity_id: upload.clientId,
          entity_type: 'client',
          message: `Document "${upload.file.name}" was uploaded to ${upload.documentCategory} category.`,
          read: false,
          created_at: new Date().toISOString(),
          id: undefined,
        }
      );
      
      // Add to local state with optimistic update
      const newDocumentWithUrl = { ...data, fileUrl: await getFileUrl(data) };
      setDocuments(prev => [newDocumentWithUrl, ...prev]);
      
      toast({
        title: 'Document uploaded',
        description: `${upload.file.name} has been uploaded successfully.`,
      });
      
      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Upload failed',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [user, uploadFile, getFileUrl, toast, logActivityAndNotify]);

  // Update document
  const updateDocument = useCallback(async (id: string, updates: DocumentUpdate): Promise<Document | null> => {
    if (!user) return null;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Log activity for status updates
      if (updates.document_status) {
        await logActivityAndNotify(
          {
            action_type: 'document_status_updated',
            client_id: data.client_id,
            document_id: id,
            description: `Document "${data.name}" status changed to ${updates.document_status}`,
            user_id: user.id,
            created_at: new Date().toISOString(),
            lender_id: null,
            id: undefined,
          },
          {
            user_id: user.id,
            type: 'document_status_updated',
            entity_id: data.client_id,
            entity_type: 'client',
            message: `Document "${data.name}" status was updated to ${updates.document_status}.`,
            read: false,
            created_at: new Date().toISOString(),
            id: undefined,
          }
        );
      }
      
      // Update local state
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === id ? { ...doc, ...data } : doc
        )
      );
      
      toast({
        title: 'Document updated',
        description: 'Document has been updated successfully.',
      });
      
      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Update failed',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [user, toast, logActivityAndNotify]);

  // Delete document
  const deleteDocument = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      // Find document to get storage path
      const document = documents.find(doc => doc.id === id);
      
      // Delete from database first
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (dbError) throw dbError;
      
      // Log activity
      if (document) {
        await logActivityAndNotify(
          {
            action_type: 'document_deleted',
            client_id: document.client_id,
            document_id: id,
            description: `Document "${document.name}" deleted from ${document.document_category}`,
            user_id: user.id,
            created_at: new Date().toISOString(),
            lender_id: null,
            id: undefined,
          },
          {
            user_id: user.id,
            type: 'document_deleted',
            entity_id: document.client_id,
            entity_type: 'client',
            message: `Document "${document.name}" was deleted from ${document.document_category} category.`,
            read: false,
            created_at: new Date().toISOString(),
            id: undefined,
          }
        );
      }
      
      // Delete from storage if path exists
      if (document?.storage_path) {
        const { error: storageError } = await supabase.storage
          .from(DOCUMENTS_BUCKET)
          .remove([document.storage_path]);
        
        // Don't throw on storage error, just log it
        if (storageError) {
          console.warn('Storage deletion failed:', storageError);
        }
      }
      
      // Remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      
      toast({
        title: 'Document deleted',
        description: 'Document has been deleted successfully.',
      });
      
      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Delete failed',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [user, documents, toast, logActivityAndNotify]);

  // Update document status
  const updateDocumentStatus = useCallback(async (
    id: string, 
    status: DocumentStatus, 
    notes?: string
  ): Promise<Document | null> => {
    return updateDocument(id, { 
      document_status: status, 
      notes: notes || undefined,
      updated_at: new Date().toISOString()
    });
  }, [updateDocument]);

  // Mark as compliant
  const markAsCompliant = useCallback(async (id: string, compliant: boolean): Promise<Document | null> => {
    return updateDocument(id, { 
      compliance_required: compliant,
      updated_at: new Date().toISOString()
    });
  }, [updateDocument]);

  // Download file
  const downloadFile = useCallback(async (doc: Document): Promise<void> => {
    try {
      if (!doc.storage_path) throw new Error('No file path available');
      
      // Download file as blob from Supabase Storage
      const { data, error } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .download(doc.storage_path);
      
      if (error) throw error;
      if (!data) throw new Error('No file data received');
      
      // Create blob URL and trigger download
      const blob = new Blob([data], { type: doc.file_type });
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      URL.revokeObjectURL(blobUrl);
      
      toast({
        title: 'Download started',
        description: `Downloading ${doc.name}`,
      });
    } catch (err: any) {
      toast({
        title: 'Download failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    if (filters.category && doc.document_category !== filters.category) return false;
    if (filters.status && doc.document_status !== filters.status) return false;
    if (filters.loanId && doc.loan_id !== filters.loanId) return false;
    if (filters.documentType && doc.document_type !== filters.documentType) return false;
    return true;
  });

  // Get documents by category
  const getDocumentsByCategory = useCallback((category: DocumentCategory): DocumentWithUrl[] => {
    return documents.filter(doc => doc.document_category === category);
  }, [documents]);

  // Get documents by loan
  const getDocumentsByLoan = useCallback((loanId: string): DocumentWithUrl[] => {
    return documents.filter(doc => doc.loan_id === loanId);
  }, [documents]);

  // Get category progress
  const getCategoryProgress = useCallback((category: DocumentCategory): CategoryProgress => {
    const categoryDocs = getDocumentsByCategory(category);
    const totalDocuments = categoryDocs.length;
    const approvedDocuments = categoryDocs.filter(doc => doc.document_status === 'approved').length;
    const pendingDocuments = categoryDocs.filter(doc => doc.document_status === 'pending').length;
    const rejectedDocuments = categoryDocs.filter(doc => doc.document_status === 'rejected').length;
    const percentage = totalDocuments > 0 ? Math.round((approvedDocuments / totalDocuments) * 100) : 0;
    
    return {
      category,
      totalDocuments,
      approvedDocuments,
      pendingDocuments,
      rejectedDocuments,
      percentage
    };
  }, [getDocumentsByCategory]);

  // Get overall progress
  const getOverallProgress = useCallback((): number => {
    const totalDocuments = documents.length;
    const approvedDocuments = documents.filter(doc => doc.document_status === 'approved').length;
    return totalDocuments > 0 ? Math.round((approvedDocuments / totalDocuments) * 100) : 0;
  }, [documents]);

  // Refresh documents
  const refreshDocuments = useCallback(async () => {
    await fetchDocuments();
  }, [fetchDocuments]);

  // Initial load
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    // Data
    documents,
    filteredDocuments,
    
    // CRUD operations
    addDocument,
    updateDocument,
    deleteDocument,
    
    // File operations
    uploadFile,
    downloadFile,
    getFileUrl,
    
    // Status management
    updateDocumentStatus,
    markAsCompliant,
    
    // Filtering and organization
    getDocumentsByCategory,
    getDocumentsByLoan,
    setFilters,
    
    // Progress tracking
    getCategoryProgress,
    getOverallProgress,
    
    // Loading states
    isLoading,
    isUploading,
    isDeleting,
    isUpdating,
    
    // Error handling
    error,
    
    // Utility
    refreshDocuments
  };
};