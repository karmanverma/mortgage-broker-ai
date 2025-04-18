import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';

interface LenderDocument {
    id: string;
    created_at: string;
    lender_id: string;
    name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    user_id: string;
    url?: string; // This will no longer be populated by fetchDocuments
}

// ... other interfaces remain the same ...
interface UploadDocumentOptions {
    lenderId: string;
    file: File;
    onProgress?: (progress: number) => void;
}

interface GenerateSignedUrlResponse {
    signedUrl: string | null;
    error: string | null;
}

const WEBHOOK_ENDPOINT = 'https://n8n.srv783065.hstgr.cloud/webhook/093605b7-2040-4ab6-b151-4af4ed970bc4';


// Modified: lenderId is now optional
export function useLenderDocuments(lenderId?: string) {
    const [documents, setDocuments] = useState<LenderDocument[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const { user } = useAuth();

    const fetchDocuments = useCallback(async () => {
        if (!user) {
            console.log("fetchDocuments: No user found, skipping fetch.");
            setDocuments([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('documents')
                .select('id, created_at, lender_id, name, file_path, file_type, file_size, user_id')
                .eq('user_id', user.id);

            if (lenderId) {
                query = query.eq('lender_id', lenderId);
                console.log(`Fetching documents for Lender ID: ${lenderId} and User ID: ${user.id}`);
            } else {
                console.log(`Fetching all documents for User ID: ${user.id}`);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) {
                console.error("Error fetching documents:", fetchError);
                throw fetchError;
            }

            console.log("Fetched documents data:", data);

            // *** Removed signed URL generation from fetch ***
            // Documents are set without the 'url' property populated here.
            setDocuments((data || []) as LenderDocument[]);

        } catch (err: any) {
            console.error("Caught error during fetchDocuments:", err);
            const errorMessage = err.message || "An unknown error occurred while fetching documents.";
            setError(errorMessage);
            toast({
                title: "Error Fetching Documents",
                description: errorMessage,
                variant: "destructive",
            });
            setDocuments([]);
        } finally {
            setIsLoading(false);
        }
    }, [lenderId, user, toast]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const uploadDocument = useCallback(async ({ file, onProgress }: Omit<UploadDocumentOptions, 'lenderId'>) => {
         if (!lenderId) {
              setError("Lender ID is missing for upload.");
              toast({ title: "Upload Error", description: "Lender ID is required to upload a document.", variant: "destructive" });
              return null;
         }
         if (!file || !user) {
             setError("File or user information is missing for upload.");
             toast({ title: "Upload Error", description: "File or user information is missing.", variant: "destructive" });
             return null;
         }

         setIsLoading(true);
         setError(null);
         const timestamp = Date.now();
         const uniqueFileName = `${timestamp}-${file.name.replace(/\s+/g, '_')}`;
         const filePath = `${user.id}/${lenderId}/${uniqueFileName}`;
         const bucketName = 'lender_documents';

         console.log(`Starting upload for: ${file.name} to ${bucketName}/${filePath}`);
         console.log(`User ID performing upload: ${user.id}`);

         try {
             // 1. Upload File
             const { error: uploadError } = await supabase.storage
                 .from(bucketName)
                 .upload(filePath, file, { cacheControl: '3600', upsert: false, contentType: file.type });
             if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);
             console.log(`File uploaded successfully to ${filePath}`);

             // 2. Insert Record
             const documentRecord = { lender_id: lenderId, user_id: user.id, name: file.name, file_path: filePath, file_type: file.type, file_size: file.size };
             const { data: insertedData, error: insertError } = await supabase.from('documents').insert([documentRecord]).select().single();
             if (insertError) {
                 console.warn(`Attempting to delete orphaned file: ${filePath}`);
                 await supabase.storage.from(bucketName).remove([filePath]);
                 throw new Error(`Database insert failed: ${insertError.message}`);
             }
             if (!insertedData) {
                  console.warn(`Attempting to delete orphaned file: ${filePath}`);
                  await supabase.storage.from(bucketName).remove([filePath]);
                 throw new Error("Failed to insert document record: No data returned.");
             }
             const newDocument = insertedData as LenderDocument;
             console.log("Document record inserted successfully:", newDocument);

             // 3. Generate Signed URL for Webhook (Optional - Unchanged)
             let signedWebhookUrl: string | null = null;
             const webhookUrlExpiresIn = 3600;
             try {
                 const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from(bucketName).createSignedUrl(filePath, webhookUrlExpiresIn, { download: false });
                 if (signedUrlError) console.warn(`Could not generate signed URL for webhook: ${signedUrlError.message}`);
                 else if (signedUrlData?.signedUrl) signedWebhookUrl = signedUrlData.signedUrl;
                 else console.warn("Signed URL generation for webhook returned no URL.");
             } catch (urlGenError: any) { console.error("Error during webhook signed URL generation:", urlGenError.message); }

             // 4. Call Webhook (Unchanged)
             console.log("Calling webhook endpoint:", WEBHOOK_ENDPOINT);
             fetch(WEBHOOK_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: "New lender document uploaded", documentId: newDocument.id, lenderId: newDocument.lender_id, userId: newDocument.user_id, filePath: newDocument.file_path, fileName: newDocument.name, fileType: newDocument.file_type, fileSize: newDocument.file_size, signedUrl: signedWebhookUrl, uploadedAt: newDocument.created_at }) })
             .then(async response => { const body = await response.text(); if (!response.ok) console.error(`Webhook error ${response.status}: ${body}`); else console.log(`Webhook success: ${body}`); })
             .catch(webhookError => console.error("Webhook fetch error:", webhookError));

             // 5. Update Local State & Refetch (Important: Refetch triggers list update)
             await fetchDocuments(); // Refetch documents after upload

             toast({ title: "Upload Successful", description: `${file.name} uploaded.` });
             return newDocument;

         } catch (err: any) {
             console.error("Caught error during uploadDocument:", err);
             const errorMessage = err.message || "Upload error.";
             setError(errorMessage);
             toast({ title: "Upload Failed", description: errorMessage, variant: "destructive" });
             return null;
         } finally { setIsLoading(false); }
     }, [lenderId, user, toast, fetchDocuments]);

    const deleteDocument = useCallback(async (documentId: string, filePath: string) => {
        if (!user) {
             setError("User not authenticated.");
             toast({ title: "Error", description: "User not authenticated.", variant: "destructive" });
             return;
        }
        console.log(`Attempting to delete document ID: ${documentId}, Path: ${filePath}`);
        setIsLoading(true); setError(null); // Use hook's loading state
        const bucketName = 'lender_documents';
        try {
             const { error: dbError } = await supabase.from('documents').delete().eq('id', documentId).eq('user_id', user.id);
            if (dbError) throw new Error(`Database delete failed: ${dbError.message}`);
            console.log(`Document record ${documentId} deleted from database.`);
            const { error: storageError } = await supabase.storage.from(bucketName).remove([filePath]);
            if (storageError && storageError.message !== 'The resource was not found') {
                 console.error(`Storage delete error for path ${filePath}:`, storageError);
                 throw new Error(`Storage delete failed: ${storageError.message}.`);
            }
            console.log(`File ${filePath} potentially deleted from storage.`);

            // Update state locally for immediate UI feedback
            setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));

            toast({ title: "Document Deleted", description: "Document deleted successfully." });

            // No explicit refetch needed here unless there's a specific reason

        } catch (err: any) {
             console.error("Caught error during deleteDocument:", err);
            const errorMessage = err.message || "Deletion error.";
            setError(errorMessage);
            toast({ title: "Deletion Failed", description: errorMessage, variant: "destructive" });
        } finally { setIsLoading(false); }
    }, [user, toast]); // Removed lenderId and fetchDocuments dependencies as local state update is used

    // generateSignedUrl remains the same - this will be called on demand
    const generateSignedUrl = useCallback(async (filePath: string, expiresIn: number = 60): Promise<GenerateSignedUrlResponse> => { // Default short expiry for download
        console.log(`Generating on-demand signed URL for path: ${filePath}, Expires in: ${expiresIn}s`);
         try {
             const { data, error } = await supabase.storage.from('lender_documents').createSignedUrl(filePath, expiresIn, {
               download: true // Ensure the URL prompts download
             });
             if (error) {
                console.error("Error generating signed URL:", error.message);
                return { signedUrl: null, error: error.message };
             }
             if (!data?.signedUrl) {
                console.error("Failed to generate signed URL: No URL returned.");
                return { signedUrl: null, error: "Failed to generate signed URL." };
             }
             console.log("Successfully generated signed URL:", data.signedUrl);
             return { signedUrl: data.signedUrl, error: null };
         } catch (err: any) {
            console.error("Exception during signed URL generation:", err);
            const errorMessage = err.message || "An unknown error occurred during URL generation.";
             return { signedUrl: null, error: errorMessage };
         }
     }, []);


    return {
        documents,
        isLoading,
        error,
        fetchDocuments,
        uploadDocument,
        deleteDocument,
        generateSignedUrl, // Ensure this is returned
    };
}
