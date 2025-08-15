import { Tables } from '@/integrations/supabase/types';

// Document types from database
export type Document = Tables<'documents'>;
export type DocumentInsert = Tables<'documents'>['Insert'];
export type DocumentUpdate = Tables<'documents'>['Update'];

// Document categories for UI organization
export type DocumentCategory = 'identification' | 'income' | 'assets' | 'property' | 'additional';

// Specific document types
export type DocumentType = 
  | 'tax_return'
  | 'bank_statement' 
  | 'pay_stub'
  | 'w2'
  | '1099'
  | 'credit_report'
  | 'asset_verification'
  | 'insurance'
  | 'drivers_license'
  | 'passport'
  | 'social_security_card'
  | 'employment_verification'
  | 'investment_statements'
  | 'appraisal'
  | 'property_tax'
  | 'title_documents'
  | 'other';

// Document status
export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'expired';

// Category to document type mapping
export const DOCUMENT_CATEGORY_MAPPING: Record<DocumentCategory, DocumentType[]> = {
  identification: ['drivers_license', 'passport', 'social_security_card'],
  income: ['tax_return', 'pay_stub', 'w2', '1099', 'employment_verification'],
  assets: ['bank_statement', 'asset_verification', 'investment_statements'],
  property: ['insurance', 'appraisal', 'property_tax', 'title_documents'],
  additional: ['credit_report', 'other']
};

// Category display names
export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  identification: 'Identification Documents',
  income: 'Income Verification',
  assets: 'Asset Documentation',
  property: 'Property Documents',
  additional: 'Additional Documents'
};

// Document type display names
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  tax_return: 'Tax Return',
  bank_statement: 'Bank Statement',
  pay_stub: 'Pay Stub',
  w2: 'W-2 Form',
  '1099': '1099 Form',
  credit_report: 'Credit Report',
  asset_verification: 'Asset Verification',
  insurance: 'Insurance Documents',
  drivers_license: "Driver's License",
  passport: 'Passport',
  social_security_card: 'Social Security Card',
  employment_verification: 'Employment Verification',
  investment_statements: 'Investment Statements',
  appraisal: 'Property Appraisal',
  property_tax: 'Property Tax Documents',
  title_documents: 'Title Documents',
  other: 'Other'
};

// File type validation
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.docx', '.xlsx'];

// File size limit (25MB)
export const MAX_FILE_SIZE = 25 * 1024 * 1024;

// Storage bucket name
export const DOCUMENTS_BUCKET = 'client-documents';

// Document upload interface
export interface DocumentUpload {
  file: File;
  documentCategory: DocumentCategory;
  documentType: DocumentType;
  clientId: string;
  loanId?: string;
  description?: string;
  complianceRequired?: boolean;
  expirationDate?: string;
}

// Document with file URL for display
export interface DocumentWithUrl extends Document {
  fileUrl?: string;
  isLoading?: boolean;
}

// Progress tracking
export interface CategoryProgress {
  category: DocumentCategory;
  totalDocuments: number;
  approvedDocuments: number;
  pendingDocuments: number;
  rejectedDocuments: number;
  percentage: number;
}

// Document filter options
export interface DocumentFilters {
  category?: DocumentCategory;
  status?: DocumentStatus;
  loanId?: string;
  documentType?: DocumentType;
}