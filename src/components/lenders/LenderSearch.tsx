
import { ChangeEvent } from "react";
import { Search, X, Filter, ChevronDown, SlidersHorizontal, LayoutGrid, Table as TableIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LenderSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  resetFilters: () => void;
  lenderTypes: string[];
  statusOptions: string[];
  view: "table" | "grid";
  setView: (view: "table" | "grid") => void;
}

export const LenderSearch = ({
  searchTerm,
  setSearchTerm,
  selectedType,
  setSelectedType,
  selectedStatus,
  setSelectedStatus,
  resetFilters,
  lenderTypes,
  statusOptions,
  view,
  setView,
}: LenderSearchProps) => {
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search lenders..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-8"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1 md:flex-none">
                <Filter className="h-4 w-4 mr-2" />
                Type
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Lender Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setSelectedType("")}
                className={selectedType === "" ? "bg-accent" : ""}
              >
                All Types
              </DropdownMenuItem>
              {lenderTypes.map((type) => (
                <DropdownMenuItem 
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={selectedType === type ? "bg-accent" : ""}
                >
                  {type}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1 md:flex-none">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Status
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Lender Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setSelectedStatus("")}
                className={selectedStatus === "" ? "bg-accent" : ""}
              >
                All Statuses
              </DropdownMenuItem>
              {statusOptions.map((status) => (
                <DropdownMenuItem 
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={selectedStatus === status ? "bg-accent" : ""}
                >
                  {status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Tabs value={view} onValueChange={setView} className="hidden md:block">
            <TabsList className="p-1 h-auto">
              <TabsTrigger value="grid" className="p-2">
                <LayoutGrid className="h-4 w-4" />
                <span className="sr-only">Grid View</span>
              </TabsTrigger>
              <TabsTrigger value="table" className="p-2">
                <TableIcon className="h-4 w-4" />
                <span className="sr-only">Table View</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {(searchTerm || selectedType || selectedStatus) && (
            <Button variant="ghost" onClick={resetFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>
      {/* Active filters */}
      {(selectedType || selectedStatus) && (
        <div className="flex items-center space-x-2 mt-2">
          <span className="text-sm text-gray-500">Filters:</span>
          {selectedType && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Type: {selectedType}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => setSelectedType("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {selectedStatus && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Status: {selectedStatus}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => setSelectedStatus("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
