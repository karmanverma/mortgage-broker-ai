// src/components/clients/tabs/DocumentsTab.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Eye, Clock, Trash2, Download } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types'; // Use Supabase types
import { format } from 'date-fns'; // For formatting date

// Define type alias for clarity
type ClientDocument = Tables<"documents">; // Assuming documents passed are already filtered for the client

// Helper function to format date, handling null/undefined
const formatDate = (date: string | Date | null | undefined, formatString = 'PPpp') => {
  if (!date) return 'N/A';
  try {
    const validDate = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(validDate.getTime())) return 'Invalid Date';
    return format(validDate, formatString);
  } catch {
    return 'Invalid Date';
  }
};

// Helper function to format file size
const formatFileSize = (bytes: number | null | undefined): string => {
    if (bytes == null || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

interface DocumentsTabProps {
    data: ClientDocument[]; // Receive documents array from parent
    // We might need clientId and userId for upload/delete actions later
    // clientId: string;
    // userId: string;
}

const DocumentsTab: React.FC<DocumentsTabProps> = ({ data: documents }) => {

    const handleUploadClick = () => {
        // TODO: Implement document upload logic (e.g., open file dialog, connect to Supabase storage)
        console.log("Upload button clicked");
        alert("Upload functionality not yet implemented."); // Placeholder
        // Example: trigger an input type="file" element
    };

    const handlePreviewClick = (document: ClientDocument) => {
        // TODO: Implement document preview logic (e.g., generate signed URL from Supabase storage)
        console.log("Preview clicked for:", document.name, document.file_path);
        alert("Preview functionality not yet implemented."); // Placeholder
        // Example: window.open(signedUrl, '_blank');
    };

     const handleDownloadClick = (document: ClientDocument) => {
        // TODO: Implement document download logic (e.g., generate signed URL with download attribute)
        console.log("Download clicked for:", document.name, document.file_path);
        alert("Download functionality not yet implemented."); // Placeholder
         // Example: get signed url, then create link element and click
    };


    const handleDeleteClick = (documentId: string) => {
        // TODO: Implement document deletion logic (call Supabase storage and database)
        console.log("Delete clicked for ID:", documentId);
        // Example: call supabase.storage.remove(...), then supabase.from('documents').delete()...
        alert("Delete functionality not yet implemented."); // Placeholder
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>Manage documents uploaded for this client.</CardDescription>
                </div>
                 <Button onClick={handleUploadClick}>
                    <Upload className="mr-2 h-4 w-4" /> Upload Document
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Uploaded At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {documents && documents.length > 0 ? (
                            documents.map((doc) => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center space-x-2">
                                             <FileText className="h-4 w-4 text-muted-foreground" />
                                             <span>{doc.name || 'Unnamed Document'}</span>
                                        </div>
                                        {doc.description && <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{doc.file_type || 'Unknown'}</Badge>
                                    </TableCell>
                                    <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                                    <TableCell>{formatDate(doc.created_at)}</TableCell>
                                    <TableCell className="text-right">
                                         <Button variant="ghost" size="sm" className="mr-1" onClick={() => handlePreviewClick(doc)} title="Preview">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="mr-1" onClick={() => handleDownloadClick(doc)} title="Download">
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(doc.id)} title="Delete">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No documents found for this client.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default DocumentsTab;
