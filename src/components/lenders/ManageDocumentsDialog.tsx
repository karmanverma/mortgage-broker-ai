import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input"; // Import Input for file upload
import { Label } from "@/components/ui/label"; // Import Label
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components
import { useLenderDocuments, UseLenderDocumentsReturn, Document } from '@/hooks/useLenderDocuments'; // Import Document type
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
// Removed DocumentUploadDialog import as we integrate the form directly
import { Trash2, Eye, Download, UploadCloud } from 'lucide-react'; // Changed PlusCircle to UploadCloud
import { toast } from '@/components/ui/use-toast';

type Lender = Tables<'lenders'>;
// Document type is now imported from the hook

interface ManageDocumentsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    lender: Lender | null;
}

export const ManageDocumentsDialog: React.FC<ManageDocumentsDialogProps> = ({
    isOpen,
    onClose,
    lender,
}) => {
    const lenderId = lender?.id;
    const { documents, loading, error: fetchError, fetchDocuments, deleteDocument, uploadDocument }: UseLenderDocumentsReturn = useLenderDocuments();
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [activeTab, setActiveTab] = useState("manage");
    const fileInputRef = useRef<HTMLInputElement>(null); // Ref for file input

    useEffect(() => {
        if (isOpen && lenderId) {
            setIsProcessing(false);
            setSelectedFile(null); // Reset file input on open
            if (fileInputRef.current) {
                fileInputRef.current.value = ""; // Clear the file input visually
            }
            setActiveTab("manage"); // Default to manage tab
            fetchDocuments(lenderId);
        }
    }, [isOpen, lenderId, fetchDocuments]);

    const handleDeleteClick = async (documentId: string, filePath: string | null) => {
        if (!lenderId || !filePath || isProcessing) return;
        if (window.confirm("Are you sure you want to delete this document?")) {
            setIsProcessing(true);
            try {
                const success = await deleteDocument(documentId, filePath, lenderId);
                 if (!success) {
                     // Hook handles toasts on failure/success now
                     // toast({ title: "Error", description: "Failed to delete document.", variant: "destructive" });
                 }
            } catch (err: any) {
                console.error("Error initiating document deletion:", err);
                toast({ title: "Error", description: err.message || "Failed to delete document.", variant: "destructive" });
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const generateSignedUrl = async (filePath: string, download: boolean = false): Promise<string | null> => {
        setIsProcessing(true);
        try {
            const options = download ? { download: true } : {};
            const { data, error } = await supabase.storage
                .from('lender_documents')
                .createSignedUrl(filePath, 300, options);
            if (error) throw error;
            return data.signedUrl;
        } catch (error: any) {
            console.error('Error generating signed URL:', error);
            toast({ title: "Error", description: `Could not generate link: ${error.message}`, variant: "destructive" });
            return null;
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePreviewClick = async (docData: Document) => {
        if (!docData.file_path || isProcessing) return;
        const signedUrl = await generateSignedUrl(docData.file_path, false);
        if (signedUrl) {
            window.open(signedUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const handleDownloadClick = async (docData: Document) => {
        if (!docData.file_path || isProcessing) return;
        const signedUrl = await generateSignedUrl(docData.file_path, true);
        if (signedUrl) {
            try {
                const link = window.document.createElement('a');
                link.href = signedUrl;
                link.download = docData.name || docData.file_path.split('/').pop() || 'download';
                window.document.body.appendChild(link);
                link.click();
                window.document.body.removeChild(link);
            } catch (error) {
                console.error("Download link creation failed:", error);
                toast({ title: "Download Error", description: "Could not initiate download.", variant: "destructive" });
            }
        }
    };

    // Upload Logic integrated into the component
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelectedFile(event.target.files[0]);
        } else {
            setSelectedFile(null);
        }
    };

    const handleUploadClick = async () => {
        if (!selectedFile || !lenderId || isProcessing) return;

        setIsProcessing(true);
        try {
            const payload = {
                name: selectedFile.name,
                file: selectedFile,
                lenderId: lenderId,
                description: "", // Add description input if needed
            };
            const newDocument = await uploadDocument(payload);

            if (newDocument) {
                // Hook's uploadDocument should handle success toast & refetching
                setSelectedFile(null); // Clear file input state
                 if (fileInputRef.current) {
                    fileInputRef.current.value = ""; // Clear the file input visually
                 }
                setActiveTab("manage"); // Switch back to manage tab after successful upload
            } else {
                 // Hook handles error toast
            }
        } catch (error: any) {
            console.error("Upload initiation error:", error);
             // Hook should catch and toast internal errors, this is a fallback
            toast({ title: "Upload Error", description: error.message || "Could not upload file.", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };


    if (!lender) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Manage Documents for {lender.name}</DialogTitle>
                    <DialogDescription>
                        View, upload, download, or delete documents associated with this lender.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="manage" disabled={isProcessing}>Manage Documents</TabsTrigger>
                        <TabsTrigger value="upload" disabled={isProcessing}>Upload New</TabsTrigger>
                    </TabsList>

                    {/* Manage Tab */} 
                    <TabsContent value="manage">
                        <div className="mt-4 max-h-[350px] min-h-[200px] overflow-y-auto pr-2">
                            {loading && <p>Loading documents...</p>}
                            {fetchError && <p className="text-red-500">Error loading documents: {fetchError}</p>}
                            {!loading && !fetchError && documents.length === 0 && (
                                <p className="text-center text-gray-500 pt-10">No documents found for this lender.</p>
                            )}
                            {!loading && !fetchError && documents.length > 0 && (
                                <ul className="space-y-2">
                                    {documents.map((doc) => (
                                        <li
                                            key={doc.id}
                                            className="flex items-center justify-between rounded-md border p-3"
                                        >
                                            <span className="truncate flex-1 mr-2" title={doc.name ?? 'Unnamed Document'}>
                                                {doc.name || `Document ID: ${doc.id}`}
                                            </span>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handlePreviewClick(doc)}
                                                    title="Preview Document"
                                                    disabled={isProcessing || !doc.file_path}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDownloadClick(doc)}
                                                    title="Download Document"
                                                    disabled={isProcessing || !doc.file_path}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(String(doc.id), doc.file_path)}
                                                    title="Delete Document"
                                                    disabled={isProcessing || !doc.file_path}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </TabsContent>

                    {/* Upload Tab */} 
                    <TabsContent value="upload">
                        <div className="mt-6 space-y-4 min-h-[200px]">
                             <div className="grid w-full max-w-sm items-center gap-1.5">
                                <Label htmlFor="document-upload">Select Document</Label>
                                <Input
                                    id="document-upload"
                                    type="file"
                                    onChange={handleFileChange}
                                    disabled={isProcessing}
                                    ref={fileInputRef} // Assign ref
                                />
                                {selectedFile && <p className="text-sm text-muted-foreground mt-1">Selected: {selectedFile.name}</p>}
                            </div>
                            <Button 
                                onClick={handleUploadClick}
                                disabled={!selectedFile || isProcessing}
                            >
                                <UploadCloud className="mr-2 h-4 w-4" />
                                {isProcessing ? 'Uploading...' : 'Upload Selected File'}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Footer only needs Close button now */} 
                <DialogFooter className="mt-6">
                    <Button onClick={onClose} disabled={isProcessing} variant="outline">Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
