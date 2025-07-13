import { useState, useEffect } from "react";
import { LayoutList, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText } from "lucide-react";
import { LenderTableRow } from "./LenderTableRow";
import { LenderCard } from "./LenderCard";
import { NoLendersFound } from "./NoLendersFound";

// Use the Lender type from useLenders
import { Lender } from '@/hooks/useLenders';

interface LendersListProps {
  filteredLenders: Lender[];
  view: "table" | "grid";
  setView: (view: "table" | "grid") => void;
  selectedLenders: string[];
  toggleLenderSelection: (id: string) => void;
  selectAll: () => void;
  handleOpenManageDocuments: (lender: Lender) => void;
  handleOpenEditLender: (lender: Lender) => void;
  setIsAddLenderOpen: (isOpen: boolean) => void;
  resetFilters: () => void;
  searchTerm: string;
  selectedType: string;
  selectedStatus: string;
  isLoading: boolean;
}

export const LendersList: React.FC<LendersListProps> = ({
  filteredLenders,
  view,
  setView,
  selectedLenders,
  toggleLenderSelection,
  selectAll,
  handleOpenManageDocuments,
  handleOpenEditLender,
  setIsAddLenderOpen,
  resetFilters,
  searchTerm,
  selectedType,
  selectedStatus,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <LoadingSpinner size="lg" className="text-blue-500 mb-4" />
        <p className="text-muted-foreground">Loading lenders...</p>
      </div>
    );
  }

  if (filteredLenders.length === 0) {
    return (
      <NoLendersFound
        searchTerm={searchTerm}
        selectedType={selectedType}
        selectedStatus={selectedStatus}
        resetFilters={resetFilters}
        setIsAddLenderOpen={setIsAddLenderOpen}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* View toggle has been moved to LenderSearch component */}

      {view === "table" && (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedLenders.length === filteredLenders.length && filteredLenders.length > 0}
                    onCheckedChange={selectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Lender Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Documents</TableHead> 
                <TableHead className="text-right">Actions</TableHead> 
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLenders.map((lender) => (
                <LenderTableRow
                  key={lender.id}
                  lender={lender}
                  selectedLenders={selectedLenders}
                  toggleLenderSelection={toggleLenderSelection}
                  handleOpenManageDocuments={handleOpenManageDocuments} // <-- Pass down updated prop
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {view === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLenders.map((lender) => (
            <LenderCard
              key={lender.id}
              lender={lender}
              handleOpenDocumentUpload={handleOpenManageDocuments}
              handleOpenEditLender={handleOpenEditLender}
            />
          ))}
        </div>
      )}
    </div>
  );
};
