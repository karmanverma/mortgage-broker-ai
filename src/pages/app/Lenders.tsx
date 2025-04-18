import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLenders } from "@/hooks/useLenders";
import { useLenderDocuments } from "@/hooks/useLenderDocuments";

import { LenderSearch } from "@/components/lenders/LenderSearch";
import { LendersList } from "@/components/lenders/LendersList";
import { AddLenderForm } from "@/components/lenders/AddLenderForm";
import { DocumentUploadDialog } from "@/components/lenders/DocumentUploadDialog";
import { Tables } from "@/integrations/supabase/types";

type Lender = Tables<'lenders'>;

const lenderTypes = ["Bank", "Broker", "Direct Lender", "Credit Union", "Correspondent", "Wholesale"];

const statusOptions = ["Active", "Inactive", "New", "On Hold"];

const Lenders = () => {
  const [view, setView] = useState<"table" | "grid">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedLenders, setSelectedLenders] = useState<string[]>([]);
  const [isAddLenderOpen, setIsAddLenderOpen] = useState(false);
  const [isUploadDocumentOpen, setIsUploadDocumentOpen] = useState(false);
  const [activeDocumentLender, setActiveDocumentLender] = useState<Lender | null>(null);

  const { lenders, isLoading: lendersLoading, fetchLenders } = useLenders();
  const { fetchDocuments } = useLenderDocuments();

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

  const handleOpenDocumentUpload = (lender: Lender) => {
    console.log(`Lenders.tsx: Opening document upload for lender ID: ${lender.id}`);
    setActiveDocumentLender(lender);
    setIsUploadDocumentOpen(true);
  };

  const isLoading = lendersLoading;

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h1 className="text-2xl font-bold tracking-tight">Lenders</h1>
        <Button onClick={() => setIsAddLenderOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Lender
        </Button>
      </div>

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
        isLoading={isLoading}
      />

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
