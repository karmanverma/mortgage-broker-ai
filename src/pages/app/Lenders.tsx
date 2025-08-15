import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useImprovedLenders, Lender } from "@/hooks/useImprovedLenders";
import { PersonDisplay } from "@/components/people/PersonDisplay";
import { PeopleManager } from "@/components/people/PeopleManager";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { useLenderDocuments } from "@/hooks/useLenderDocuments"; // Document hook now used within ManageDocumentsDialog

import { LendersList } from "@/components/lenders/LendersList";
import LendersListUnified from "@/components/lenders/LendersListUnified";
import { EnhancedAddLenderForm } from "@/components/lenders/EnhancedAddLenderForm";
import { EditLenderForm } from "@/components/lenders/EditLenderForm";
import ManageDocumentsDialog from "@/components/lenders/ManageDocumentsDialog"; // Corrected: Default import

// Using the exported Lender type from useLenders

const lenderTypes = ["Bank", "Broker", "Direct Lender", "Credit Union", "Correspondent", "Wholesale"];

const statusOptions = ["Active", "Inactive", "New", "On Hold"];

const Lenders = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"grid" | "list">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedLenders, setSelectedLenders] = useState<string[]>([]);
  const [isAddLenderOpen, setIsAddLenderOpen] = useState(false);
  const [isEditLenderOpen, setIsEditLenderOpen] = useState(false);
  const [isManageDocsOpen, setIsManageDocsOpen] = useState(false); // State for new dialog
  const [activeLender, setActiveLender] = useState<Lender | null>(null); // State for active lender context
  const [expandedPeople, setExpandedPeople] = useState<Record<string, boolean>>({});
  const [managingPeopleFor, setManagingPeopleFor] = useState<string | null>(null);

  const { 
    lenders, 
    isLoading: lendersLoading,
    addPersonToLender,
    removePersonFromLender,
    setPrimaryPerson,
  } = useImprovedLenders();

  // No need for manual fetchLenders call - data is automatically managed

  const filteredLenders = lenders.filter(lender => {
    const primaryPerson = lender.primary_person;
    const matchesSearch = searchTerm === "" ||
      (lender.name && lender.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (primaryPerson && `${primaryPerson.first_name} ${primaryPerson.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === "all" || lender.type === selectedType;
    const matchesStatus = selectedStatus === "all" || lender.status === selectedStatus;

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
    setSelectedType("all");
    setSelectedStatus("all");
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

  const togglePeopleExpanded = (lenderId: string) => {
    setExpandedPeople(prev => ({
      ...prev,
      [lenderId]: !prev[lenderId]
    }));
  };

  const handleManagePeople = (lender: Lender) => {
    setActiveLender(lender);
    setManagingPeopleFor(lender.id);
  };

  const isLoading = lendersLoading;

  return (
    <div className="p-6">
      <PageHeader
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search lenders..."
        filters={[
          {
            value: selectedType,
            onValueChange: setSelectedType,
            options: [
              { value: 'all', label: 'All Types' },
              ...lenderTypes.map(type => ({ value: type, label: type }))
            ],
            placeholder: 'Filter by type'
          },
          {
            value: selectedStatus,
            onValueChange: setSelectedStatus,
            options: [
              { value: 'all', label: 'All Statuses' },
              ...statusOptions.map(status => ({ value: status, label: status }))
            ],
            placeholder: 'Filter by status'
          }
        ]}
        viewMode={view}
        onViewModeChange={setView}
        viewOptions={['grid', 'list']}
        onAddClick={() => setIsAddLenderOpen(true)}
        addButtonText="Add Lender"
        addButtonIcon={<Plus className="h-4 w-4" />}
      />

      <div className="space-y-4">

        {view === 'list' ? (
          <LendersListUnified
            lenders={filteredLenders}
            isLoading={isLoading}
            onLenderClick={(lender) => navigate(`/app/lenders/${lender.id}`)}
            onEditLender={handleOpenEditLender}
            onManageDocuments={handleOpenManageDocuments}
            onManagePeople={handleManagePeople}
          />
        ) : (
          <LendersList
            filteredLenders={filteredLenders}
            view="grid"
            setView={() => {}}
            selectedLenders={selectedLenders}
            toggleLenderSelection={toggleLenderSelection}
            selectAll={selectAll}
            handleOpenManageDocuments={handleOpenManageDocuments}
            handleOpenEditLender={handleOpenEditLender}
            handleManagePeople={handleManagePeople}
            expandedPeople={expandedPeople}
            onTogglePeopleExpanded={togglePeopleExpanded}
            setIsAddLenderOpen={setIsAddLenderOpen}
            resetFilters={resetFilters}
            searchTerm={searchTerm}
            selectedType={selectedType}
            selectedStatus={selectedStatus}
            isLoading={isLoading}
          />
        )}
      </div>

      <EnhancedAddLenderForm
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

      {/* People Management Dialog */}
      {activeLender && managingPeopleFor && (
        <Dialog open={!!managingPeopleFor} onOpenChange={() => setManagingPeopleFor(null)}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Manage People for {activeLender.name}</DialogTitle>
              <DialogDescription>
                Add, remove, or manage people associated with this lender.
              </DialogDescription>
            </DialogHeader>
            <PeopleManager
              entityType="lender"
              entityId={activeLender.id}
              entityName={activeLender.name}
              people={activeLender.people || []}
              onAddPerson={(personId, isPrimary, relationshipType) => 
                addPersonToLender({ lenderId: activeLender.id, personId, isPrimary, relationshipType })
              }
              onRemovePerson={(personId) => 
                removePersonFromLender({ lenderId: activeLender.id, personId })
              }
              onSetPrimary={(personId) => 
                setPrimaryPerson({ lenderId: activeLender.id, personId })
              }
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Lenders;
