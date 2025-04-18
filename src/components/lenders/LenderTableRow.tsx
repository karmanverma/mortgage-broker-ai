import { useState, useEffect } from "react"; // Added useEffect
import {
  MoreHorizontal,
  Edit,
  Download,
  Trash2,
  FileText,
  Copy,
  FolderOpen // Added FolderOpen icon
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
import { Tables } from "@/integrations/supabase/types";

type Document = Tables<'documents'>;

interface LenderTableRowProps {
  lender: Lender;
  selectedLenders: string[];
  toggleLenderSelection: (id: string) => void;
  handleOpenManageDocuments: (lender: Lender) => void; // <-- Updated prop name
}

export const LenderTableRow = ({
  lender,
  selectedLenders,
  toggleLenderSelection,
  handleOpenManageDocuments, // <-- Updated prop name
}: LenderTableRowProps) => {
  const { deleteLender } = useLenders();
  const { documents, fetchDocuments } = useLenderDocuments(); // Get fetchDocuments as well
  const [docCount, setDocCount] = useState(0);

  // Fetch and count documents specifically for this lender
  // This avoids needing all documents passed down or relying on a potentially stale global list
  useEffect(() => {
    const countDocs = async () => {
      // A simple way is to filter the existing list if it's reliably updated
      // const count = documents.filter(d => d.lender_id === lender.id).length;
      // setDocCount(count);

      // Or, fetch specifically for this lender if the hook supports it
      // or if we implement a direct fetch here (less ideal)
      // For now, let's filter the potentially global list from the hook
      // Note: This count might not update immediately after upload/delete
      // in the dialog unless the `documents` list itself is refreshed globally.
      const count = documents.filter(d => d.lender_id === lender.id).length;
      setDocCount(count);
    };
    countDocs();
    // Re-run if the lender or the global documents list changes
  }, [lender.id, documents]); 

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
      {/* Make Document Count Cell Clickable */}
      <TableCell 
        className="cursor-pointer hover:text-blue-600 hover:underline"
        onClick={() => handleOpenManageDocuments(lender)} 
        title={`Manage documents for ${lender.name}`}
      >
        <span className="text-sm text-gray-500">
          {docCount} docs
        </span>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            {/* Updated Menu Item */}
            <DropdownMenuItem onClick={() => handleOpenManageDocuments(lender)}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Manage Documents
            </DropdownMenuItem>
            <DropdownMenuItem> 
              <Edit className="h-4 w-4 mr-2" />
              Edit Lender
            </DropdownMenuItem>
            {/* <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Download Info 
            </DropdownMenuItem> */}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => {
                if (confirm(`Are you sure you want to delete lender ${lender.name}? This does not delete associated documents.`)) {
                  deleteLender(lender.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Lender
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};
