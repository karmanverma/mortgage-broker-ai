
import { useState } from "react";
import {
  MoreHorizontal,
  Edit,
  Download,
  Trash2,
  FileText,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Lender, useLenders } from "@/hooks/useLenders";
import { useLenderDocuments } from "@/hooks/useLenderDocuments";

interface LenderTableRowProps {
  lender: Lender;
  selectedLenders: string[];
  toggleLenderSelection: (id: string) => void;
  handleOpenDocumentUpload: (lender: Lender) => void;
}

export const LenderTableRow = ({
  lender,
  selectedLenders,
  toggleLenderSelection,
  handleOpenDocumentUpload,
}: LenderTableRowProps) => {
  const { deleteLender } = useLenders();
  const { documents } = useLenderDocuments();

  return (
    <TableRow key={lender.id}>
      <TableCell>
        <Checkbox
          checked={selectedLenders.includes(lender.id)}
          onCheckedChange={() => toggleLenderSelection(lender.id)}
          aria-label={`Select ${lender.name}`}
        />
      </TableCell>
      <TableCell className="font-medium">{lender.name}</TableCell>
      <TableCell>{lender.type}</TableCell>
      <TableCell>{lender.contact_name}</TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="text-sm">{lender.contact_email}</span>
          <span className="text-sm text-gray-500">{lender.contact_phone}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={
            lender.status === "Active" 
              ? "bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700" 
              : lender.status === "Inactive"
              ? "bg-gray-50 text-gray-700 hover:bg-gray-50 hover:text-gray-700"
              : lender.status === "New"
              ? "bg-blue-50 text-blue-700 hover:bg-blue-50 hover:text-blue-700"
              : "bg-amber-50 text-amber-700 hover:bg-amber-50 hover:text-amber-700"
          }
        >
          {lender.status}
        </Badge>
      </TableCell>
      <TableCell>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center"
          onClick={() => handleOpenDocumentUpload(lender)}
        >
          <FileText className="h-4 w-4 text-gray-400 mr-1" />
          <span>{documents.filter(d => d.lender_id === lender.id).length}</span>
        </Button>
      </TableCell>
      <TableCell>
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
      </TableCell>
    </TableRow>
  );
};
