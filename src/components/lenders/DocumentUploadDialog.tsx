
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText, X, Upload, Download, Trash2 } from "lucide-react";
import { Lender } from "@/hooks/useLenders";
import { useLenderDocuments, NewDocument } from "@/hooks/useLenderDocuments";
import { getFileUrl } from "@/integrations/supabase/client";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DocumentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lender: Lender | null;
}

export const DocumentUploadDialog = ({
  isOpen,
  onClose,
  lender,
}: DocumentUploadDialogProps) => {
  const [newDocument, setNewDocument] = useState<{
    name: string;
    description: string;
    file: File | null;
  }>({
    name: "",
    description: "",
    file: null
  });

  const { 
    documents, 
    isLoading: documentsLoading, 
    uploadDocument, 
    deleteDocument 
  } = useLenderDocuments();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewDocument({
        ...newDocument,
        name: newDocument.name || file.name.split('.')[0],
        file: file
      });
    }
  };

  const handleUploadDocument = async () => {
    if (!lender || !newDocument.file || !newDocument.name) {
      return;
    }
    
    const docToUpload: NewDocument = {
      name: newDocument.name,
      description: newDocument.description,
      file: newDocument.file,
      lenderId: lender.id
    };
    
    await uploadDocument(docToUpload);
    
    // Reset form
    setNewDocument({
      name: "",
      description: "",
      file: null
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {lender ? `Documents for ${lender.name}` : 'Documents'}
          </DialogTitle>
          <DialogDescription>
            Upload and manage documents for this lender.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Document</TabsTrigger>
            <TabsTrigger value="manage">Manage Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document-name">Document Name *</Label>
                <Input 
                  id="document-name" 
                  value={newDocument.name} 
                  onChange={(e) => setNewDocument({...newDocument, name: e.target.value})}
                  placeholder="e.g. Rate Sheet"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="document-description">Description</Label>
                <Input 
                  id="document-description" 
                  value={newDocument.description} 
                  onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                  placeholder="Briefly describe this document"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="document-file">File *</Label>
                <div className="border border-dashed border-gray-300 rounded-md p-6 text-center">
                  {newDocument.file ? (
                    <div className="flex flex-col items-center">
                      <FileText className="h-8 w-8 text-blue-500 mb-2" />
                      <p className="text-sm font-medium">{newDocument.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(newDocument.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setNewDocument({...newDocument, file: null})}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-2">
                        Drag and drop a file here, or click to browse
                      </p>
                      <Input 
                        id="document-file"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => document.getElementById('document-file')?.click?.()}
                      >
                        Browse Files
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <Button 
                className="w-full"
                onClick={handleUploadDocument}
                disabled={!newDocument.file || !newDocument.name}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="manage" className="pt-4">
            {documentsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-500">Loading documents...</p>
              </div>
            ) : lender && documents.filter(d => d.lender_id === lender.id).length > 0 ? (
              <div className="space-y-3">
                {documents
                  .filter(d => d.lender_id === lender.id)
                  .map((doc) => (
                    <div 
                      key={doc.id} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(doc.created_at).toLocaleDateString()} • 
                            {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(getFileUrl('lender_documents', doc.file_path), '_blank')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500"
                                onClick={() => deleteDocument(doc)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 mb-4">No documents uploaded yet</p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const uploadTab = document.querySelector('[data-state="inactive"][value="upload"]');
                    if (uploadTab instanceof HTMLElement) {
                      uploadTab.click();
                    }
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Document
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
