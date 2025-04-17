import { useState, useEffect } from "react";
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
  Upload,
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
import { toast } from "@/components/ui/use-toast";
import { useLenders, NewLender, Lender } from "@/hooks/useLenders";
import { useLenderDocuments, NewDocument } from "@/hooks/useLenderDocuments";
import { getFileUrl } from "@/integrations/supabase/client";

// Lender type options
const lenderTypes = ["Bank", "Broker", "Direct Lender", "Credit Union", "Correspondent", "Wholesale"];

// Status options
const statusOptions = ["Active", "Inactive", "New", "On Hold"];

const Lenders = () => {
  const [view, setView] = useState<"table" | "grid">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedLenders, setSelectedLenders] = useState<string[]>([]);
  const [isAddLenderOpen, setIsAddLenderOpen] = useState(false);
  const [newLender, setNewLender] = useState<NewLender>({
    name: "",
    type: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    status: "Active",
    notes: ""
  });
  
  const [isUploadDocumentOpen, setIsUploadDocumentOpen] = useState(false);
  const [activeDocumentLender, setActiveDocumentLender] = useState<Lender | null>(null);
  const [newDocument, setNewDocument] = useState<{
    name: string;
    description: string;
    file: File | null;
  }>({
    name: "",
    description: "",
    file: null
  });

  const { lenders, isLoading: lendersLoading, fetchLenders, addLender, deleteLender } = useLenders();
  const { 
    documents, 
    isLoading: documentsLoading, 
    fetchDocuments, 
    uploadDocument, 
    deleteDocument 
  } = useLenderDocuments();

  // Fetch lenders on mount
  useEffect(() => {
    fetchLenders();
  }, []);

  // Filter lenders based on search and filters
  const filteredLenders = lenders.filter(lender => {
    const matchesSearch = searchTerm === "" || 
      lender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lender.contact_name.toLowerCase().includes(searchTerm.toLowerCase());
    
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
  const toggleLenderSelection = (id: string) => {
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
  const handleAddLender = async () => {
    if (!newLender.name || !newLender.type || !newLender.contactName || !newLender.contactEmail) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all required fields.",
      });
      return;
    }
    
    await addLender(newLender);
    
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

  // Handle opening the document upload dialog
  const handleOpenDocumentUpload = (lender: Lender) => {
    setActiveDocumentLender(lender);
    fetchDocuments(lender.id);
    setIsUploadDocumentOpen(true);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewDocument({
        ...newDocument,
        name: newDocument.name || file.name.split('.')[0],
        file: file
      });
    }
  };

  // Handle document upload
  const handleUploadDocument = async () => {
    if (!activeDocumentLender || !newDocument.file || !newDocument.name) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide a document name and select a file to upload.",
      });
      return;
    }
    
    const docToUpload: NewDocument = {
      name: newDocument.name,
      description: newDocument.description,
      file: newDocument.file,
      lenderId: activeDocumentLender.id
    };
    
    await uploadDocument(docToUpload);
    
    // Reset form
    setNewDocument({
      name: "",
      description: "",
      file: null
    });
    
    // Keep the dialog open to allow more uploads
    // Fetch the updated documents list
    fetchDocuments(activeDocumentLender.id);
  };

  // Handle document deletion
  const handleDeleteDocument = async (doc: any) => {
    if (confirm("Are you sure you want to delete this document?")) {
      await deleteDocument(doc);
    }
  };

  // Get document count for a lender
  const getDocumentCount = (lenderId: string) => {
    return documents.filter(doc => doc.lender_id === lenderId).length;
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

      {/* Document Upload Dialog */}
      <Dialog open={isUploadDocumentOpen} onOpenChange={setIsUploadDocumentOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {activeDocumentLender ? `Documents for ${activeDocumentLender.name}` : 'Documents'}
            </DialogTitle>
            <DialogDescription>
              Upload and manage documents for this lender.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload Document</TabsTrigger>
              <TabsTrigger value="manage">Manage Documents</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="document-name">Document Name *</Label>
                  <Input 
                    id="document-name" 
                    value={newDocument.name} 
                    onChange={(e) => setNewDocument({...newDocument, name: e.target.value})}
                    placeholder="e.g. Rate Sheet"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="document-description">Description</Label>
                  <Input 
                    id="document-description" 
                    value={newDocument.description} 
                    onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                    placeholder="Briefly describe this document"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="document-file">File *</Label>
                  <div className="border border-dashed border-gray-300 rounded-md p-6 text-center">
                    {newDocument.file ? (
                      <div className="flex flex-col items-center">
                        <FileText className="h-8 w-8 text-blue-500 mb-2" />
                        <p className="text-sm font-medium">{newDocument.file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(newDocument.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => setNewDocument({...newDocument, file: null})}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 mb-2">
                          Drag and drop a file here, or click to browse
                        </p>
                        <Input 
                          id="document-file"
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <Button 
                          variant="outline" 
                          onClick={() => document.getElementById('document-file')?.click()}
                        >
                          Browse Files
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button 
                  className="w-full"
                  onClick={handleUploadDocument}
                  disabled={!newDocument.file || !newDocument.name}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="manage" className="pt-4">
              {documentsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-gray-500">Loading documents...</p>
                </div>
              ) : documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div 
                      key={doc.id} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(doc.created_at).toLocaleDateString()} • 
                            {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(getFileUrl('lender_documents', doc.file_path), '_blank')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500"
                                onClick={() => handleDeleteDocument(doc)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 mb-4">No documents uploaded yet</p>
                  <Button 
                    variant="outline"
                    onClick={() => document.querySelector('[data-state="inactive"][value="upload"]')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Your First Document
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

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

      {/* Loading state */}
      {lendersLoading ? (
        <div className="flex flex-col items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-500">Loading lenders...</p>
        </div>
      ) : (
        // Empty state
        filteredLenders.length === 0 && (
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
              <Button onClick={() => setIsAddLenderOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Lender
              </Button>
            )}
          </div>
        )
      )}
      
      {/* Table view */}
      {!lendersLoading && view === "table" && filteredLenders.length > 0 && (
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Grid view */}
      {!lendersLoading && view === "grid" && filteredLenders.length > 0 && (
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
          ))}
        </div>
      )}
    </div>
  );
};

export default Lenders;
