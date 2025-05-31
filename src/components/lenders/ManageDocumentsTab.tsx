import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Loader2, Download, Trash2, FileText } from 'lucide-react';
import { LenderDocument } from '@/integrations/supabase/types';

interface ManageDocumentsTabProps {
    documents: LenderDocument[];
    isLoading: boolean;
    isProcessing: (docId: string | null) => boolean;
    handleDownload: (document: LenderDocument) => void;
    handleDelete: (document: LenderDocument) => void;
}

const ManageDocumentsTab: React.FC<ManageDocumentsTabProps> = ({
    documents,
    isLoading,
    isProcessing,
    handleDownload,
    handleDelete,
}) => {

    return (
        <ScrollArea className="h-[300px] mt-4 border rounded-md">
            {isLoading ? (
                <div className="flex justify-center items-center h-full p-4">
                    <LoadingSpinner size="md" className="text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading documents...</span>
                </div>
            ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6">
                  <FileText className="h-10 w-10 mb-3 text-gray-400" />
                  <p className="font-medium">No documents found</p>
                  <p className="text-sm">Upload documents using the 'Upload New' tab.</p>
                </div>
            ) : (
                // Keep table-fixed
                <Table className="table-fixed w-full">
                    <TableHeader>
                        <TableRow>
                            {/* Only Name column has explicit width */}
                            <TableHead className="w-[60%] pl-4">Name</TableHead>
                            {/* Removed explicit width from Uploaded */}
                            <TableHead className="pl-2">Uploaded</TableHead> {/* Added some padding */}
                            {/* Removed explicit width from Actions */}
                            <TableHead className="text-right pr-4">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {documents.map((doc) => (
                            <TableRow key={doc.id} className="hover:bg-muted/50">
                                {/* Keep overflow/break strategy for Name cell */}
                                <TableCell
                                    className="font-medium py-2 pl-4 pr-2 overflow-hidden break-words"
                                    title={doc.name}
                                >
                                    {doc.name}
                                </TableCell>
                                {/* Added padding to Uploaded cell */}
                                <TableCell className="text-sm text-muted-foreground py-2 pl-2">{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right py-1 pr-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDownload(doc)}
                                        disabled={isProcessing(doc.id)}
                                        aria-label={`Download ${doc.name}`}
                                        title="Download"
                                        className="h-7 w-7"
                                    >
                                        {isProcessing(doc.id) ? <LoadingSpinner size="sm" /> : <Download className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive/80 ml-1 h-7 w-7"
                                        onClick={() => handleDelete(doc)}
                                        disabled={isProcessing(doc.id)}
                                        aria-label={`Delete ${doc.name}`}
                                        title="Delete"
                                    >
                                        {isProcessing(doc.id) ? <LoadingSpinner size="sm" /> : <Trash2 className="h-4 w-4" />}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </ScrollArea>
    );
};

export default ManageDocumentsTab;
