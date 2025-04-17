
import { Building, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoLendersFoundProps {
  searchTerm: string;
  selectedType: string;
  selectedStatus: string;
  resetFilters: () => void;
  setIsAddLenderOpen: (isOpen: boolean) => void;
}

export const NoLendersFound = ({
  searchTerm,
  selectedType,
  selectedStatus,
  resetFilters,
  setIsAddLenderOpen,
}: NoLendersFoundProps) => {
  const hasFilters = searchTerm || selectedType || selectedStatus;

  return (
    <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
      <Building className="h-16 w-16 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">No lenders found</h3>
      <p className="text-gray-500 text-center max-w-sm mb-4">
        {hasFilters
          ? "Try adjusting your filters or search term to find what you're looking for."
          : "Get started by adding your first lender to the database."}
      </p>
      {hasFilters ? (
        <Button variant="outline" onClick={resetFilters}>
          Clear Filters
        </Button>
      ) : (
        <Button onClick={() => setIsAddLenderOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Lender
        </Button>
      )}
    </div>
  );
};
