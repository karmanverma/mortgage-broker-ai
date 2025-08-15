import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DocumentCategory, 
  DocumentType, 
  DocumentUpload as DocumentUploadType,
  DOCUMENT_CATEGORY_MAPPING,
  DOCUMENT_TYPE_LABELS,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE
} from '@/features/documents/types';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface DocumentUploadProps {
  clientId: string;
  loanId?: string;
  category?: DocumentCategory;
  onUpload: (upload: DocumentUploadType) => Promise<void>;
  onCancel: () => void;
  isUploading?: boolean;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  clientId,
  loanId,
  category,
  onUpload,
  onCancel,
  isUploading = false
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentCategory, setDocumentCategory] = useState<DocumentCategory>(category || 'additional');
  const [documentType, setDocumentType] = useState<DocumentType>('other');
  const [description, setDescription] = useState('');
  const [complianceRequired, setComplianceRequired] = useState(false);
  const [expirationDate, setExpirationDate] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const validateFile = (file: File): string[] => {
    const fileErrors: string[] = [];
    
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      fileErrors.push(`${file.name}: File type not allowed`);
    }
    
    if (file.size > MAX_FILE_SIZE) {
      fileErrors.push(`${file.name}: File size exceeds 25MB limit`);
    }
    
    return fileErrors;
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    const allErrors: string[] = [];
    
    // Validate accepted files
    const validFiles: File[] = [];
    acceptedFiles.forEach(file => {
      const fileErrors = validateFile(file);
      if (fileErrors.length > 0) {
        allErrors.push(...fileErrors);
      } else {
        validFiles.push(file);
      }
    });
    
    // Handle rejected files
    rejectedFiles.forEach(({ file, errors: rejectionErrors }) => {
      rejectionErrors.forEach((error: any) => {
        allErrors.push(`${file.name}: ${error.message}`);
      });
    });
    
    setErrors(allErrors);
    setSelectedFiles(prev => [...prev, ...validFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true
  });

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      setErrors(['Please select at least one file to upload']);
      return;
    }

    try {
      for (const file of selectedFiles) {
        const upload: DocumentUploadType = {
          file,
          documentCategory,
          documentType,
          clientId,
          loanId,
          description: description.trim() || undefined,
          complianceRequired,
          expirationDate: expirationDate || undefined
        };
        
        await onUpload(upload);
      }
      
      // Reset form
      setSelectedFiles([]);
      setDescription('');
      setComplianceRequired(false);
      setExpirationDate('');
      setErrors([]);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const availableTypes = DOCUMENT_CATEGORY_MAPPING[documentCategory] || [];

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Documents
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* File Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-lg font-medium">Drop files here...</p>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">
                Drag & drop files here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supports PDF, JPG, PNG, DOCX, XLSX • Max 25MB per file
              </p>
            </div>
          )}
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Files ({selectedFiles.length})</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document Category */}
        <div className="space-y-2">
          <Label>Document Category</Label>
          <Select value={documentCategory} onValueChange={(value: DocumentCategory) => {
            setDocumentCategory(value);
            setDocumentType('other'); // Reset type when category changes
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="identification">Identification Documents</SelectItem>
              <SelectItem value="income">Income Verification</SelectItem>
              <SelectItem value="assets">Asset Documentation</SelectItem>
              <SelectItem value="property">Property Documents</SelectItem>
              <SelectItem value="additional">Additional Documents</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Document Type */}
        <div className="space-y-2">
          <Label>Document Type</Label>
          <Select value={documentType} onValueChange={(value: DocumentType) => setDocumentType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {DOCUMENT_TYPE_LABELS[type]}
                </SelectItem>
              ))}
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label>Description (Optional)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any additional notes about these documents..."
            rows={3}
          />
        </div>

        {/* Options */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="compliance"
              checked={complianceRequired}
              onCheckedChange={(checked) => setComplianceRequired(checked as boolean)}
            />
            <Label htmlFor="compliance" className="text-sm">
              Mark as compliance required
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Expiration Date (Optional)</Label>
            <Input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="space-y-2">
            {errors.map((error, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={selectedFiles.length === 0 || isUploading}
          >
            {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};