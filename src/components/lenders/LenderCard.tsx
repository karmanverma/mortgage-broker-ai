
import { useState } from "react";
import {
  MoreHorizontal,
  Edit,
  Download,
  Trash2,
  FileText,
  User,
  Info,
  Copy,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Lender, useLenders } from "@/hooks/useLenders";
import { useLenderDocuments } from "@/hooks/useLenderDocuments";
import { getFileUrl } from "@/integrations/supabase/client";

interface LenderCardProps {
  lender: Lender;
  handleOpenDocumentUpload: (lender: Lender) => void;
}

export const LenderCard = ({
  lender,
  handleOpenDocumentUpload,
}: LenderCardProps) => {
  const { deleteLender } = useLenders();
  const { documents } = useLenderDocuments();

  return (
    <Card key={lender.id} className="overflow-hidden">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center">
              {lender.name}
              <Badge
                variant="outline"
                className={
                  lender.status === "Active" 
                    ? "bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700 ml-2" 
                    : lender.status === "Inactive"
                    ? "bg-gray-50 text-gray-700 hover:bg-gray-50 hover:text-gray-700 ml-2"
                    : lender.status === "New"
                    ? "bg-blue-50 text-blue-700 hover:bg-blue-50 hover:text-blue-700 ml-2"
                    : "bg-amber-50 text-amber-700 hover:bg-amber-50 hover:text-amber-700 ml-2"
                }
              >
                {lender.status}
              </Badge>
            </CardTitle>
            <div className="text-sm text-gray-500">{lender.type}</div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleOpenDocumentUpload(lender)}>
                <FileText className="h-4 w-4 mr-2" />
                View Documents
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Download Info
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${lender.name}?`)) {
                    deleteLender(lender.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-400 mr-2" />
                <div className="font-medium">Contact Person</div>
              </div>
              <div className="pl-6">
                <div>{lender.contact_name}</div>
                <div className="text-sm text-gray-500">{lender.contact_email}</div>
                <div className="text-sm text-gray-500">{lender.contact_phone}</div>
              </div>
            </div>
            
            {lender.notes && (
              <div className="space-y-2">
                <div className="flex items-center">
                  <Info className="h-4 w-4 text-gray-400 mr-2" />
                  <div className="font-medium">Notes</div>
                </div>
                <div className="pl-6 text-sm text-gray-600">
                  {lender.notes}
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2 pt-2">
              <Button size="sm" variant="outline" className="w-full">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button size="sm" variant="outline" className="w-full">
                <Copy className="h-4 w-4 mr-2" />
                Copy Info
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="documents" className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FileText className="h-4 w-4 text-gray-400 mr-2" />
                <span className="font-medium">
                  {documents.filter(d => d.lender_id === lender.id).length} Documents
                </span>
              </div>
              <Button 
                size="sm"
                onClick={() => handleOpenDocumentUpload(lender)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            
            {documents.filter(d => d.lender_id === lender.id).length > 0 ? (
              <div className="space-y-2">
                {documents
                  .filter(d => d.lender_id === lender.id)
                  .slice(0, 2)
                  .map(doc => (
                    <div 
                      key={doc.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center overflow-hidden">
                        <FileText className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                        <span className="text-sm truncate">{doc.name}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => window.open(getFileUrl('lender_documents', doc.file_path), '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                }
                
                {documents.filter(d => d.lender_id === lender.id).length > 2 && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-xs px-2"
                    onClick={() => handleOpenDocumentUpload(lender)}
                  >
                    View all documents
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No documents uploaded yet
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
