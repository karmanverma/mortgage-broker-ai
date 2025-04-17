
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLenders } from "@/hooks/useLenders";
import { useLenderDocuments } from "@/hooks/useLenderDocuments";

// Import refactored components
import { LenderSearch } from "@/components/lenders/LenderSearch";
import { LendersList } from "@/components/lenders/LendersList";
import { AddLenderForm } from "@/components/lenders/AddLenderForm";
import { DocumentUploadDialog } from "@/components/lenders/DocumentUploadDialog";

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
  const [isUploadDocumentOpen, setIsUploadDocumentOpen] = useState(false);
  const [activeDocumentLender, setActiveDocumentLender] = useState<any>(null);

  const { lenders, isLoading: lendersLoading, fetchLenders } = useLenders();
  const { fetchDocuments } = useLenderDocuments();

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

  // Handle opening the document upload dialog
  const handleOpenDocumentUpload = (lender: any) => {
    setActiveDocumentLender(lender);
    fetchDocuments(lender.id);
    setIsUploadDocumentOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h1 className="text-2xl font-bold tracking-tight">Lenders</h1>
        <Button onClick={() => setIsAddLenderOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Lender
        </Button>
      </div>

      {/* Search and filters */}
      <LenderSearch
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        resetFilters={resetFilters}
        lenderTypes={lenderTypes}
        statusOptions={statusOptions}
      />

      {/* Lenders list */}
      <LendersList
        filteredLenders={filteredLenders}
        view={view}
        setView={setView}
        selectedLenders={selectedLenders}
        toggleLenderSelection={toggleLenderSelection}
        selectAll={selectAll}
        handleOpenDocumentUpload={handleOpenDocumentUpload}
        setIsAddLenderOpen={setIsAddLenderOpen}
        resetFilters={resetFilters}
        searchTerm={searchTerm}
        selectedType={selectedType}
        selectedStatus={selectedStatus}
        isLoading={lendersLoading}
      />

      {/* Dialogs */}
      <AddLenderForm 
        isOpen={isAddLenderOpen}
        onClose={() => setIsAddLenderOpen(false)}
        lenderTypes={lenderTypes}
        statusOptions={statusOptions}
      />

      <DocumentUploadDialog
        isOpen={isUploadDocumentOpen}
        onClose={() => setIsUploadDocumentOpen(false)}
        lender={activeDocumentLender}
      />
    </div>
  );
};

export default Lenders;
