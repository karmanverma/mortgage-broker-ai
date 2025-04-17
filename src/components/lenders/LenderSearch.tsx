
import { ChangeEvent } from "react";
import { Search, X, Filter, ChevronDown, SlidersHorizontal } from "lucide-react";
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
}: LenderSearchProps) => {
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search lenders..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-9"
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
        
        <div className="flex items-center space-x-2 w-full md:w-auto">
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
          
          {(searchTerm || selectedType || selectedStatus) && (
            <Button variant="ghost" onClick={resetFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>
      
      {/* Active filters */}
      {(selectedType || selectedStatus) && (
        <div className="flex items-center space-x-2">
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
