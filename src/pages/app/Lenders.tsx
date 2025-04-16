
import { useState } from "react";
import { 
  Building, 
  ChevronDown, 
  Copy, 
  Download, 
  Edit, 
  FileText, 
  Filter, 
  Grid, 
  Info, 
  LayoutList, 
  MoreHorizontal, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Trash2, 
  User, 
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";

// Mock lender data
const mockLenders = [
  {
    id: 1,
    name: "First National Bank",
    type: "Bank",
    contactName: "Sarah Johnson",
    contactEmail: "sarah.j@firstnational.com",
    contactPhone: "(555) 123-4567",
    status: "Active",
    documents: 12,
    notes: "Preferred lender for conventional loans. Competitive rates for high credit scores."
  },
  {
    id: 2,
    name: "Liberty Mortgage",
    type: "Broker",
    contactName: "Michael Chen",
    contactEmail: "mchen@libertymtg.com",
    contactPhone: "(555) 987-6543",
    status: "Active",
    documents: 8,
    notes: "Specializes in FHA and VA loans. Quick turnaround times."
  },
  {
    id: 3,
    name: "Homestead Funding",
    type: "Direct Lender",
    contactName: "David Rodriguez",
    contactEmail: "david@homesteadfunding.com",
    contactPhone: "(555) 567-8901",
    status: "Active",
    documents: 15,
    notes: "Good for jumbo loans and non-QM products. Higher rates but flexible underwriting."
  },
  {
    id: 4,
    name: "Community First CU",
    type: "Credit Union",
    contactName: "Jessica Williams",
    contactEmail: "jwilliams@communityfirst.org",
    contactPhone: "(555) 345-6789",
    status: "Active",
    documents: 6,
    notes: "Members-only credit union with great rates. Slower processing times."
  },
  {
    id: 5,
    name: "Midwest Mortgage Group",
    type: "Correspondent",
    contactName: "Robert Taylor",
    contactEmail: "rtaylor@midwestmtg.com",
    contactPhone: "(555) 234-5678",
    status: "Inactive",
    documents: 3,
    notes: "Currently not accepting new applications. Relationship on hold until Q3."
  },
  {
    id: 6,
    name: "Coastal Home Loans",
    type: "Direct Lender",
    contactName: "Amanda Lewis",
    contactEmail: "alewis@coastalhl.com",
    contactPhone: "(555) 876-5432",
    status: "Active",
    documents: 9,
    notes: "Specializes in vacation properties and second homes. Competitive rates."
  },
  {
    id: 7,
    name: "Union Capital Bank",
    type: "Bank",
    contactName: "Thomas Wilson",
    contactEmail: "twilson@unioncapital.com",
    contactPhone: "(555) 456-7890",
    status: "Active",
    documents: 11,
    notes: "Excellent for portfolio loans. Requires established relationship."
  },
  {
    id: 8,
    name: "Heritage Mortgage Services",
    type: "Broker",
    contactName: "Olivia Martinez",
    contactEmail: "omartinez@heritagems.com",
    contactPhone: "(555) 678-9012",
    status: "New",
    documents: 2,
    notes: "New partnership established last month. Competitive on conventional loans."
  }
];

// Lender type options
const lenderTypes = ["Bank", "Broker", "Direct Lender", "Credit Union", "Correspondent", "Wholesale"];

// Status options
const statusOptions = ["Active", "Inactive", "New", "On Hold"];

const Lenders = () => {
  const [view, setView] = useState<"table" | "grid">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedLenders, setSelectedLenders] = useState<number[]>([]);
  const [isAddLenderOpen, setIsAddLenderOpen] = useState(false);
  const [newLender, setNewLender] = useState({
    name: "",
    type: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    status: "Active",
    notes: ""
  });
  
  const { toast } = useToast();

  // Filter lenders based on search and filters
  const filteredLenders = mockLenders.filter(lender => {
    const matchesSearch = searchTerm === "" || 
      lender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lender.contactName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === "" || lender.type === selectedType;
    const matchesStatus = selectedStatus === "" || lender.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Select all lenders
  const selectAll = () => {
    if (selectedLenders.length === filteredLenders.length) {
      setSelectedLenders([]);
    } else {
      setSelectedLenders(filteredLenders.map(lender => lender.id));
    }
  };

  // Toggle selection of a single lender
  const toggleLenderSelection = (id: number) => {
    if (selectedLenders.includes(id)) {
      setSelectedLenders(selectedLenders.filter(lenderId => lenderId !== id));
    } else {
      setSelectedLenders([...selectedLenders, id]);
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedType("");
    setSelectedStatus("");
  };

  // Handle adding a new lender
  const handleAddLender = () => {
    // In a real app, you would send this to your API
    console.log("Adding new lender:", newLender);
    
    toast({
      title: "Lender Added",
      description: `${newLender.name} has been added successfully.`,
    });
    
    // Reset form and close dialog
    setNewLender({
      name: "",
      type: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      status: "Active",
      notes: ""
    });
    setIsAddLenderOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h1 className="text-2xl font-bold tracking-tight">Lenders</h1>
        <Dialog open={isAddLenderOpen} onOpenChange={setIsAddLenderOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Lender
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Lender</DialogTitle>
              <DialogDescription>
                Enter the details for the new lender. All fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lender-name">Lender Name *</Label>
                  <Input 
                    id="lender-name" 
                    value={newLender.name} 
                    onChange={(e) => setNewLender({...newLender, name: e.target.value})}
                    placeholder="e.g. First National Bank"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lender-type">Lender Type *</Label>
                  <Select 
                    value={newLender.type} 
                    onValueChange={(value) => setNewLender({...newLender, type: value})}
                  >
                    <SelectTrigger id="lender-type">
                      <SelectValue placeholder="Select lender type" />
                    </SelectTrigger>
                    <SelectContent>
                      {lenderTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Contact Person *</Label>
                  <Input 
                    id="contact-name" 
                    value={newLender.contactName} 
                    onChange={(e) => setNewLender({...newLender, contactName: e.target.value})}
                    placeholder="e.g. John Smith"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Contact Email *</Label>
                  <Input 
                    id="contact-email" 
                    type="email"
                    value={newLender.contactEmail} 
                    onChange={(e) => setNewLender({...newLender, contactEmail: e.target.value})}
                    placeholder="e.g. john@example.com"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">Contact Phone</Label>
                  <Input 
                    id="contact-phone" 
                    value={newLender.contactPhone} 
                    onChange={(e) => setNewLender({...newLender, contactPhone: e.target.value})}
                    placeholder="e.g. (555) 123-4567"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lender-status">Status</Label>
                  <Select 
                    value={newLender.status} 
                    onValueChange={(value) => setNewLender({...newLender, status: value})}
                  >
                    <SelectTrigger id="lender-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lender-notes">Notes</Label>
                <Input 
                  id="lender-notes" 
                  value={newLender.notes} 
                  onChange={(e) => setNewLender({...newLender, notes: e.target.value})}
                  placeholder="Additional information about this lender"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddLenderOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleAddLender}>
                Add Lender
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search lenders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
        
        <div className="flex items-center ml-auto">
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

      {/* Empty state */}
      {filteredLenders.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <Building className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No lenders found</h3>
          <p className="text-gray-500 text-center max-w-sm mb-4">
            {searchTerm || selectedType || selectedStatus
              ? "Try adjusting your filters or search term to find what you're looking for."
              : "Get started by adding your first lender to the database."}
          </p>
          {searchTerm || selectedType || selectedStatus ? (
            <Button variant="outline" onClick={resetFilters}>
              Clear Filters
            </Button>
          ) : (
            <DialogTrigger asChild>
              <Button onClick={() => setIsAddLenderOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Lender
              </Button>
            </DialogTrigger>
          )}
        </div>
      )}
      
      {/* Table view */}
      {view === "table" && filteredLenders.length > 0 && (
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
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLenders.map((lender) => (
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
                  <TableCell>{lender.contactName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{lender.contactEmail}</span>
                      <span className="text-sm text-gray-500">{lender.contactPhone}</span>
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
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-400 mr-1" />
                      <span>{lender.documents}</span>
                    </div>
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
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="h-4 w-4 mr-2" />
                          View Documents
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download Info
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Grid view */}
      {view === "grid" && filteredLenders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLenders.map((lender) => (
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
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileText className="h-4 w-4 mr-2" />
                        View Documents
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Download Info
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
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
                        <div>{lender.contactName}</div>
                        <div className="text-sm text-gray-500">{lender.contactEmail}</div>
                        <div className="text-sm text-gray-500">{lender.contactPhone}</div>
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
                        <span className="font-medium">{lender.documents} Documents</span>
                      </div>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>
                    
                    {lender.documents > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-blue-500 mr-2" />
                            <span className="text-sm">Rate Sheet</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-blue-500 mr-2" />
                            <span className="text-sm">Product Guide</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <Button variant="link" size="sm" className="text-xs px-2">
                          View all documents
                        </Button>
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
          ))}
        </div>
      )}
    </div>
  );
};

export default Lenders;
