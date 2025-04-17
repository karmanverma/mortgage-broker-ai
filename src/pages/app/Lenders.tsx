import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLenders } from "@/hooks/useLenders";
import { useLenderDocuments } from "@/hooks/useLenderDocuments"; // Make sure fetchDocuments is exported/used if needed here

// Import refactored components
import { LenderSearch } from "@/components/lenders/LenderSearch";
import { LendersList } from "@/components/lenders/LendersList";
import { AddLenderForm } from "@/components/lenders/AddLenderForm";
import { DocumentUploadDialog } from "@/components/lenders/DocumentUploadDialog";
import { Tables } from "@/integrations/supabase/types";

// Define Lender type explicitly
type Lender = Tables<'lenders'>;

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
  const [activeDocumentLender, setActiveDocumentLender] = useState<Lender | null>(null); // Use Lender type

  const { lenders, isLoading: lendersLoading, fetchLenders } = useLenders();
  // Only need fetchDocuments from the hook for the upload dialog action
  const { fetchDocuments } = useLenderDocuments();

  // Fetch lenders on mount
  useEffect(() => {
    console.log("Lenders.tsx: Fetching lenders...");
    fetchLenders();
    // Do not fetch all documents here
  }, [fetchLenders]); // Only fetchLenders dependency

  // Filter lenders based on search and filters
  const filteredLenders = lenders.filter(lender => {
    const matchesSearch = searchTerm === "" ||
      (lender.name && lender.name.toLowerCase().includes(searchTerm.toLowerCase())) || // Added null check
      (lender.contact_name && lender.contact_name.toLowerCase().includes(searchTerm.toLowerCase())); // Added null check

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
  const handleOpenDocumentUpload = (lender: Lender) => { // Use Lender type
    console.log(`Lenders.tsx: Opening document upload for lender ID: ${lender.id}`);
    setActiveDocumentLender(lender);
    // Optionally fetch documents specifically for this lender when opening the dialog
    // This depends on whether the dialog needs the documents immediately
    // fetchDocuments(lender.id);
    setIsUploadDocumentOpen(true);
  };

  // Determine loading state (only lenders now)
  const isLoading = lendersLoading;

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
        // Do not pass documents down
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
        isLoading={isLoading} // Pass original loading state
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
        // DocumentUploadDialog likely uses the useLenderDocuments hook internally now
      />
    </div>
  );
};

export default Lenders;
