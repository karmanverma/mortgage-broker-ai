// src/components/lenders/UploadDocumentTab.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud, CheckCircle, XCircle, FileText } from 'lucide-react';

interface UploadDocumentTabProps {
    lenderId: string; // lenderId is still needed here
    onUploadSuccess: () => void;
    // Update prop signature: Expects an object { file: File }
    uploadDocument: (options: { file: File }) => Promise<any>; // Using 'any' for simplicity, ideally should match hook return
}

const UploadDocumentTab: React.FC<UploadDocumentTabProps> = ({
    lenderId, // Keep lenderId prop
    onUploadSuccess,
    uploadDocument // This is now the function directly from the hook
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setSelectedFile(file);
            setFileName(file.name);
            setUploadStatus('idle');
        } else {
            setSelectedFile(null);
            setFileName('');
        }
    };

    const clearInputs = () => {
         setSelectedFile(null);
         setFileName('');
         if (fileInputRef.current) {
             fileInputRef.current.value = '';
         }
    }

    const handleUpload = async () => {
        if (!selectedFile || !lenderId) return; // Still need lenderId check here
        setIsUploading(true);
        setUploadStatus('idle');
        try {
            // Call the prop with the correct object structure
            await uploadDocument({ file: selectedFile });
            setUploadStatus('success');
            onUploadSuccess();
            clearInputs();
        } catch (error) {
            console.error("Error uploading document:", error);
            setUploadStatus('error');
        } finally {
            setIsUploading(false);
        }
    };

    useEffect(() => {
        if (!selectedFile) {
            setUploadStatus('idle');
            setFileName('');
        }
    }, [selectedFile]);

    return (
        <div className="space-y-5 mt-4">
            {/* File Input Block */}
            <div>
                <Label htmlFor="document-upload" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Choose Document
                </Label>
                 <div className="flex items-center space-x-2">
                     <Input
                         id="document-upload"
                         type="file"
                         ref={fileInputRef}
                         onChange={handleFileChange}
                         disabled={isUploading}
                         className="flex-grow h-14 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                     />
                     {selectedFile && !isUploading && (
                        <Button variant="ghost" size="sm" onClick={clearInputs} aria-label="Clear file selection" className="p-1 h-auto">
                            <XCircle className="h-4 w-4 text-muted-foreground"/>
                        </Button>
                     )}
                 </div>
            </div>

            {/* File Name Input Block */}
            {selectedFile && (
                <div className="space-y-1.5">
                    <Label htmlFor="file-name" className="block text-sm font-medium text-gray-700">
                        File Name (Editable, Max 36 Chars)
                    </Label>
                    <div className="relative">
                        <FileText className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                         <Input
                             id="file-name"
                             type="text"
                             value={fileName}
                             onChange={(e) => setFileName(e.target.value)}
                             maxLength={36}
                             placeholder="Enter desired file name"
                             disabled={isUploading}
                             className="pl-8 pr-2 h-9"
                         />
                    </div>
                    <p className="text-xs text-muted-foreground pt-0.5">
                        Original: {selectedFile.name}
                    </p>
                </div>
            )}

            {/* Upload Button */}
            <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading || !fileName.trim()}
                className="w-full"
            >
                {isUploading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                    <UploadCloud className="mr-2 h-4 w-4" />
                )}
                {isUploading ? 'Uploading...' : 'Upload Document'}
            </Button>

            {/* Status Messages */}
            {uploadStatus !== 'idle' && (
                <div className={`flex items-center text-sm pt-1 ${uploadStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {uploadStatus === 'success' && <CheckCircle className="mr-1.5 h-4 w-4 flex-shrink-0" />}
                    {uploadStatus === 'error' && <XCircle className="mr-1.5 h-4 w-4 flex-shrink-0" />}
                    <span>{uploadStatus === 'success' ? 'Upload successful!' : 'Upload failed. Please try again.'}</span>
                </div>
            )}
        </div>
    );
};

export default UploadDocumentTab;
