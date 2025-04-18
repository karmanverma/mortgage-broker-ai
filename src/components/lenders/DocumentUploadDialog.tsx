import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext'; // Import the auth hook

// Define the Lender type based on your application structure
interface Lender {
  id: string;
  name: string;
  // Add other lender properties as needed
}

interface DocumentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lender: Lender | null;
}

const DocumentUploadDialog: React.FC<DocumentUploadDialogProps> = ({ isOpen, onClose, lender }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth(); // Get user from auth context
  // const { addDocument } = useLenderDocuments(); // If you need to refresh the list after upload

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !lender) return;

    if (!user) {
      console.error("User not authenticated");
      toast({
        title: "Error",
        description: "You must be logged in to upload documents.",
        variant: "destructive",
      });
      return;
    }


    setIsUploading(true);
    const fileExt = selectedFile.name.split('.').pop();
    // Ensure user ID is included in the path for potential RLS policies or easier filtering
    const filePath = `${user.id}/${lender.id}/${Date.now()}.${fileExt}`;

    try {
      // 1. Upload file to Supabase Storage
      console.log('Uploading file to Supabase storage...');
      const { error: uploadError } = await supabase.storage
        .from('lender_documents') // Ensure 'lender_documents' is your bucket name
        .upload(filePath, selectedFile);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }
      console.log('File uploaded successfully to path:', filePath);

      // 2. Add document metadata to the database
      console.log('Inserting document metadata into database...');
      const { data: newDocument, error: insertError } = await supabase
        .from('documents') // Ensure 'documents' is your table name
        .insert({
          lender_id: lender.id,
          file_path: filePath,
          file_name: selectedFile.name,
          file_type: selectedFile.type,
          user_id: user.id, // Add the user ID here
        })
        .select()
        .single();

      if (insertError) {
          console.error('Database insert error:', insertError);
          // Attempt to delete the orphaned file from storage if DB insert fails
          console.log('Attempting to remove orphaned file from storage:', filePath);
          await supabase.storage.from('lender_documents').remove([filePath]);
          throw insertError;
      }
       console.log('Document metadata inserted:', newDocument);


      // Optional: Update local state if using a hook like useLenderDocuments
      // if (addDocument && newDocument) {
      //   addDocument(newDocument);
      // }


      toast({
        title: 'Success',
        description: `Document "${selectedFile.name}" uploaded successfully.`
      });
      setSelectedFile(null); // Reset file input
      onClose(); // Close the dialog

    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Could not upload the document.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Document{lender ? ` for ${lender.name}` : ''}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="document" className="text-right">
              Document
            </Label>
            <Input
              id="document"
              type="file"
              className="col-span-3"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploadDialog;