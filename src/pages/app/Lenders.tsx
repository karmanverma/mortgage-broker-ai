import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLenders, Lender } from "@/hooks/useLenders";
// import { useLenderDocuments } from "@/hooks/useLenderDocuments"; // Document hook now used within ManageDocumentsDialog

import { LenderSearch } from "@/components/lenders/LenderSearch";
import { LendersList } from "@/components/lenders/LendersList";
import { AddLenderForm } from "@/components/lenders/AddLenderForm";
import { EditLenderForm } from "@/components/lenders/EditLenderForm";
import ManageDocumentsDialog from "@/components/lenders/ManageDocumentsDialog"; // Corrected: Default import

// Using the exported Lender type from useLenders

const lenderTypes = ["Bank", "Broker", "Direct Lender", "Credit Union", "Correspondent", "Wholesale"];

const statusOptions = ["Active", "Inactive", "New", "On Hold"];

const Lenders = () => {
  const [view, setView] = useState<"table" | "grid">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedLenders, setSelectedLenders] = useState<string[]>([]);
  const [isAddLenderOpen, setIsAddLenderOpen] = useState(false);
  const [isEditLenderOpen, setIsEditLenderOpen] = useState(false);
  const [isManageDocsOpen, setIsManageDocsOpen] = useState(false); // State for new dialog
  const [activeLender, setActiveLender] = useState<Lender | null>(null); // State for active lender context

  const { lenders, isLoading: lendersLoading, fetchLenders } = useLenders();

  useEffect(() => {
    console.log("Lenders.tsx: Fetching lenders...");
    fetchLenders();
  }, [fetchLenders]);

  const filteredLenders = lenders.filter(lender => {
    const matchesSearch = searchTerm === "" ||
      (lender.name && lender.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lender.contact_name && lender.contact_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === "" || lender.type === selectedType;
    const matchesStatus = selectedStatus === "" || lender.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const selectAll = () => {
    if (selectedLenders.length === filteredLenders.length) {
      setSelectedLenders([]);
    } else {
      setSelectedLenders(filteredLenders.map(lender => lender.id));
    }
  };

  const toggleLenderSelection = (id: string) => {
    if (selectedLenders.includes(id)) {
      setSelectedLenders(selectedLenders.filter(lenderId => lenderId !== id));
    } else {
      setSelectedLenders([...selectedLenders, id]);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedType("");
    setSelectedStatus("");
  };

  // Function to open the new Manage Documents dialog
  const handleOpenManageDocuments = (lender: Lender) => {
    console.log(`Lenders.tsx: Opening manage documents for lender ID: ${lender.id}`);
    setActiveLender(lender);
    setIsManageDocsOpen(true);
  };

  // Function to open the Edit Lender dialog
  const handleOpenEditLender = (lender: Lender) => {
    console.log(`Lenders.tsx: Opening edit for lender ID: ${lender.id}`);
    setActiveLender(lender);
    setIsEditLenderOpen(true);
  };

  const isLoading = lendersLoading;

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 mb-6">
        {/* <h1 className="text-2xl font-bold tracking-tight">Lenders</h1> Removed main page title as it is now in header */}
        <Button onClick={() => setIsAddLenderOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Lender
        </Button>
      </div>

      <div className="space-y-4">
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
          view={view}
          setView={setView}
        />

        <LendersList
          filteredLenders={filteredLenders}
          view={view}
          setView={setView}
          selectedLenders={selectedLenders}
          toggleLenderSelection={toggleLenderSelection}
          selectAll={selectAll}
          handleOpenManageDocuments={handleOpenManageDocuments}
          handleOpenEditLender={handleOpenEditLender}
          setIsAddLenderOpen={setIsAddLenderOpen}
          resetFilters={resetFilters}
          searchTerm={searchTerm}
          selectedType={selectedType}
          selectedStatus={selectedStatus}
          isLoading={isLoading}
        />
      </div>

      <AddLenderForm
        isOpen={isAddLenderOpen}
        onClose={() => setIsAddLenderOpen(false)}
        lenderTypes={lenderTypes}
        statusOptions={statusOptions}
      />

      {/* Render the new ManageDocumentsDialog */}
      <ManageDocumentsDialog
        isOpen={isManageDocsOpen}
        onClose={() => setIsManageDocsOpen(false)}
        lender={activeLender}
      />

      {/* Render the new EditLenderForm component */}
      <EditLenderForm
        isOpen={isEditLenderOpen}
        onClose={() => setIsEditLenderOpen(false)}
        lenderTypes={lenderTypes}
        statusOptions={statusOptions}
        lender={activeLender}
      />
    </div>
  );
};

export default Lenders;
