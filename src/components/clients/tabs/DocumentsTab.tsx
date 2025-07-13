// src/components/clients/tabs/DocumentsTab.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  <Card className="w-full">
    {/* Top-level Progress Indicator */}
    <CardHeader className="pb-2">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            Manage documents uploaded for this client. Track progress and upload required files by category.
          </CardDescription>
        </div>
        {/* Overall Completion Progress */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Completion</span>
          {/* Replace with actual completion logic */}
          <div className="w-32"><Progress value={65} /></div>
          <span className="text-xs text-muted-foreground">65%</span>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      {/* Document Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[
          { key: 'id', label: 'Identification Documents' },
          { key: 'income', label: 'Income Verification' },
          { key: 'asset', label: 'Asset Documentation' },
          { key: 'property', label: 'Property Documents' },
          { key: 'additional', label: 'Additional Documents' },
        ].map((cat) => (
          <Card key={cat.key} className="flex flex-col h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{cat.label}</CardTitle>
                {/* Category Progress Ring */}
                <Progress value={40} className="w-16 h-2 ml-auto" />
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-2">
              {/* Upload Zone */}
              <div
                className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg min-h-[200px] p-4 bg-muted/40 hover:border-primary transition cursor-pointer"
                // TODO: Add drag-and-drop logic and state
              >
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="font-medium">Drop files here or</span>
                <Button variant="outline" size="sm" className="mt-2">Browse Files</Button>
                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>PDF, JPG, PNG • Max 25MB</span>
                </div>
              </div>
              {/* Uploaded Files List (scaffolded) */}
              <div className="mt-2 space-y-2">
                {/* Example uploaded file card */}
                {/* Map actual files for this category here */}
                <Card className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 min-h-[80px] w-full">
  {/* Left: File info */}
  <div className="flex flex-col gap-1 flex-1 min-w-0">
  <span className="truncate font-medium text-base w-full" title="passport_v1.pdf">passport_v1.pdf</span>
  <div className="flex flex-wrap items-center gap-2">
    <Badge variant="outline">PDF</Badge>
    <span className="text-xs text-muted-foreground">2.1 MB</span>
  </div>
  <span className="text-xs text-muted-foreground mt-1">2 hours ago</span>
</div>
  {/* Right: Meta, status, actions */}
  <div className="flex flex-col md:items-end gap-2 w-full md:w-auto mt-2 md:mt-0">
    <div className="flex flex-col items-start md:items-end gap-1">
  <Badge variant="secondary" className="bg-gray-200 text-gray-700">Pending Review</Badge>
</div>
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" title="View"><Eye className="w-4 h-4" /></Button>
      <Button variant="ghost" size="icon" title="Delete"><Trash2 className="w-4 h-4 text-destructive" /></Button>
    </div>
  </div>
</Card>
                {/* End example file card */}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Global Actions */}
      <div className="flex flex-col md:flex-row gap-2 justify-end mt-8">
        <Button variant="secondary">Export Summary</Button>
        <Button variant="default">Save All</Button>
      </div>
    </CardContent>
  </Card>
);

};

export default DocumentsTab;
