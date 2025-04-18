import { useState } from "react";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  FolderOpen
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useLenders } from "@/hooks/useLenders";
import { Lender } from "@/integrations/supabase/types";

interface LenderTableRowProps {
  lender: Lender;
  selectedLenders: string[];
  toggleLenderSelection: (id: string) => void;
  handleOpenManageDocuments: (lender: Lender) => void;
}

export const LenderTableRow = ({
  lender,
  selectedLenders,
  toggleLenderSelection,
  handleOpenManageDocuments,
}: LenderTableRowProps) => {
  const { deleteLender } = useLenders();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteLender(lender.id, lender.name);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
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
        <TableCell
          className="cursor-pointer hover:underline" // Removed hover:text-blue-600, keep hover:underline
          onClick={() => handleOpenManageDocuments(lender)}
          title={`Manage documents for ${lender.name}`}
        >
          {/* Removed text-blue-500 class */}
          <span className="text-sm font-medium">
            Manage
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
              <DropdownMenuItem onClick={() => handleOpenManageDocuments(lender)}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Manage Documents
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit Lender
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-700 focus:bg-red-50"
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Lender
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the lender "{lender.name}"?
              This action cannot be undone and does not delete associated documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
