import { useState, useEffect } from "react";
import { LayoutList, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Lender } from "@/hooks/useLenders"; 
import { FileText } from "lucide-react";
import { LenderTableRow } from "./LenderTableRow";
import { LenderCard } from "./LenderCard";
import { NoLendersFound } from "./NoLendersFound";

interface LendersListProps {
  filteredLenders: Lender[];
  view: "table" | "grid";
  setView: (view: "table" | "grid") => void;
  selectedLenders: string[];
  toggleLenderSelection: (id: string) => void;
  selectAll: () => void;
  handleOpenManageDocuments: (lender: Lender) => void; // <-- Updated prop name
  setIsAddLenderOpen: (isOpen: boolean) => void;
  resetFilters: () => void;
  searchTerm: string;
  selectedType: string;
  selectedStatus: string;
  isLoading: boolean;
}

export const LendersList = ({
  filteredLenders,
  view,
  setView,
  selectedLenders,
  toggleLenderSelection,
  selectAll,
  handleOpenManageDocuments, // <-- Updated prop name
  setIsAddLenderOpen,
  resetFilters,
  searchTerm,
  selectedType,
  selectedStatus,
  isLoading,
}: LendersListProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-500">Loading lenders...</p>
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
      <div className="flex items-center ml-auto justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={view === "table" ? "bg-accent" : ""}
                onClick={() => setView("table")}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Table View</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={view === "grid" ? "bg-accent" : ""}
                onClick={() => setView("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Grid View</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {view === "table" && (
        <div className="rounded-md border">
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
              // Assuming LenderCard will also need a way to open the dialog
              handleOpenManageDocuments={handleOpenManageDocuments} // <-- Pass down updated prop
            />
          ))}
        </div>
      )}
    </div>
  );
};
