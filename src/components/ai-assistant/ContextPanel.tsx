import React, { useState, useEffect, useMemo } from 'react';
// Re-add Popover imports for the footer
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
// Re-add Info icon and Button for the footer popover
import { Filter, Search, Info } from "lucide-react";
import { Button } from "@/components/ui/button"; // Re-add Button import
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { useLenders } from '@/hooks/useLenders';
import { useLenderDocuments } from '@/hooks/useLenderDocuments';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Client, mapDbClientToClient } from '@/features/clients/types';

interface ContextPanelProps {
    // State Lifted Up
    selectedClientId: string | null;
    selectedLenderIds: string[];
    onSelectedClientChange: (clientId: string | null) => void;
    onSelectedLendersChange: (lenderIds: string[]) => void;
    // End State Lifted Up

    onContextChange?: (context: {
      selectedLenderIds: string[];
      selectedDocumentIds: string[];
      selectedClientId?: string;
    }) => void;
    className?: string;
}

const ContextPanel: React.FC<ContextPanelProps> = ({
    // State props
    selectedClientId,
    selectedLenderIds,
    onSelectedClientChange,
    onSelectedLendersChange,
    // Other props
    onContextChange,
    className
}) => {
    const { user } = useAuth();
    const { lenders: allUserLenders, isLoading: isLoadingLenders, fetchLenders } = useLenders();
    const { documents: allUserDocuments, isLoading: isLoadingDocuments, fetchDocuments } = useLenderDocuments();

    // Internal Component State
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoadingClients, setIsLoadingClients] = useState(true);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [lenderTypeFilter, setLenderTypeFilter] = useState<string>('All');
    const [initialLenderSelectionDone, setInitialLenderSelectionDone] = useState(false); // Flag for initial selection

    const uniqueLenderTypes = useMemo(() => {
        if (!allUserLenders || allUserLenders.length === 0) return [];
        const types = new Set(allUserLenders.map(lender => lender.type));
        return Array.from(types);
    }, [allUserLenders]);

    // Fetch clients
    useEffect(() => {
        const fetchClients = async () => {
            if (!user) return;
            setIsLoadingClients(true);
            try {
                const { data: clientsData, error } = await supabase
                    .from('clients')
                    .select('*')
                    .eq('user_id', user.id);
                if (error) throw error;
                const mappedClients = (clientsData || []).map(client => mapDbClientToClient(client));
                setClients(mappedClients);
            } catch (error) {
                console.error('Error fetching clients:', error);
            } finally {
                setIsLoadingClients(false);
            }
        };
        fetchClients();
    }, [user]);

    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            const searchString = `${client.firstName} ${client.lastName} ${client.email}`.toLowerCase();
            return searchString.includes(clientSearchTerm.toLowerCase());
        });
    }, [clients, clientSearchTerm]);

    const lendersWithDocuments = useMemo(() => {
        if (isLoadingLenders || isLoadingDocuments || !allUserLenders || !allUserDocuments) return [];
        const lenderIdsWithDocs = new Set(allUserDocuments.map(doc => doc.lender_id));
        return allUserLenders.filter(lender => lenderIdsWithDocs.has(lender.id));
    }, [allUserLenders, allUserDocuments, isLoadingLenders, isLoadingDocuments]);

    const documentIdsByLender = useMemo(() => {
        if (isLoadingDocuments || !allUserDocuments) return {};
        return allUserDocuments.reduce((acc, doc) => {
            if (!acc[doc.lender_id]) {
                acc[doc.lender_id] = [];
            }
            acc[doc.lender_id].push(doc.id);
            return acc;
        }, {} as Record<string, string[]>);
    }, [allUserDocuments, isLoadingDocuments]);

    // Fetch base data (lenders, documents)
    useEffect(() => {
        if (user) {
            fetchLenders();
            fetchDocuments();
        }
    }, [user, fetchLenders, fetchDocuments]);

     // Effect to automatically select all lenders with documents on initial load
     useEffect(() => {
        // Ensure data is loaded, lenders with documents exist, and we haven't done this yet
        if (!isLoadingLenders && !isLoadingDocuments && lendersWithDocuments.length > 0 && !initialLenderSelectionDone) {
            const allLenderIdsWithDocs = lendersWithDocuments.map(l => l.id);
            // Only automatically select if *no* lenders are currently selected (avoids overriding previous state/user action)
            if (selectedLenderIds.length === 0) {
                 onSelectedLendersChange(allLenderIdsWithDocs);
            }
            // Mark as done regardless of whether we changed the selection,
            // to prevent it from running again if the user deselects all manually later.
            setInitialLenderSelectionDone(true);
        }
     }, [isLoadingLenders, isLoadingDocuments, lendersWithDocuments, selectedLenderIds, onSelectedLendersChange, initialLenderSelectionDone]);


    // Propagate context changes (now depends on props)
    useEffect(() => {
        const relevantDocumentIds = selectedLenderIds.flatMap(lenderId => documentIdsByLender[lenderId] || []);
        const newContextData = {
            selectedLenderIds, // Use prop
            selectedDocumentIds: relevantDocumentIds,
            selectedClientId: selectedClientId || undefined // Use prop
        };
        if (onContextChange) {
            onContextChange(newContextData);
        }
    }, [selectedLenderIds, selectedClientId, documentIdsByLender, onContextChange]);

    const filteredLenders = useMemo(() => {
        return lendersWithDocuments.filter(lender =>
            lenderTypeFilter === 'All' || lender.type === lenderTypeFilter
        );
    }, [lendersWithDocuments, lenderTypeFilter]);

    // Handle individual lender checkbox changes (call prop function)
    const handleCheckboxChange = (lenderId: string, checked: boolean | string) => {
         const isChecked = !!checked; // Ensure boolean value
         if (isChecked) {
             // Add the lender ID if it's not already included
             if (!selectedLenderIds.includes(lenderId)) {
                 onSelectedLendersChange([...selectedLenderIds, lenderId]);
             }
         } else {
             // Remove the lender ID
             onSelectedLendersChange(selectedLenderIds.filter(id => id !== lenderId));
         }
    };


    // Handle "Select All" checkbox changes (call prop function)
    const handleSelectAllVisible = (checked: boolean | string) => {
        const visibleLenderIds = filteredLenders.map(l => l.id);
        if (checked) {
            // Select only the visible ones, preserving any already selected hidden ones
            const currentlySelectedHidden = selectedLenderIds.filter(id => !visibleLenderIds.includes(id));
            onSelectedLendersChange([...currentlySelectedHidden, ...visibleLenderIds]);
        } else {
            // Deselect only the visible ones, preserving any already selected hidden ones
            onSelectedLendersChange(selectedLenderIds.filter(id => !visibleLenderIds.includes(id)));
        }
    };

    // Determine if "Select All" should be checked (use prop)
    const allVisibleSelected = useMemo(() => {
        if (filteredLenders.length === 0) return false;
        // Check if *every* lender in the filtered list is included in the selectedLenderIds prop
        return filteredLenders.every(l => selectedLenderIds.includes(l.id));
    }, [selectedLenderIds, filteredLenders]);


    return (
        <div className={cn(
            "bg-background flex flex-col h-full border-l border-gray-200", // Base internal layout
            className
        )}>

            {/* Scrollable Content Area */}
            <ScrollArea className="flex-1 p-4">
                <Tabs defaultValue="lenders" className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 shrink-0">
                        <TabsTrigger value="clients">Clients</TabsTrigger>
                        <TabsTrigger value="lenders">Lenders</TabsTrigger>
                    </TabsList>

                    {/* Clients Tab */}
                    <TabsContent value="clients" className="space-y-4 mt-4 flex-1 overflow-y-auto">
                        <div className="relative shrink-0">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search clients..."
                                value={clientSearchTerm}
                                onChange={(e) => setClientSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <div className="p-3 space-y-3">
                            {isLoadingClients ? (
                                Array.from({ length: 3 }).map((_, index) => (
                                    <div key={index} className="flex items-center space-x-2 py-1">
                                        <Skeleton className="h-4 w-4" />
                                        <Skeleton className="h-4 w-[70%]" />
                                    </div>
                                ))
                            ) : filteredClients.length > 0 ? (
                                filteredClients.map((client) => (
                                    <div key={client.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`client-${client.id}`}
                                            checked={selectedClientId === client.id} // Use prop
                                            onCheckedChange={(checked) => {
                                                onSelectedClientChange(checked ? client.id : null); // Use prop callback
                                            }}
                                        />
                                        <Label
                                            htmlFor={`client-${client.id}`}
                                            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            {client.firstName} {client.lastName}
                                        </Label>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-muted-foreground text-center py-2">
                                    No clients found
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Lenders Tab */}
                    <TabsContent value="lenders" className="mt-4 space-y-4 flex-1 overflow-y-auto">
                        <div className="flex justify-between items-center mb-2 shrink-0">
                            <h4 className="text-sm font-medium">Available Lenders</h4>
                            <Select
                                value={lenderTypeFilter}
                                onValueChange={(value) => setLenderTypeFilter(value)}
                                disabled={isLoadingLenders || lendersWithDocuments.length === 0}
                            >
                                <SelectTrigger className="w-[110px] h-8 text-xs">
                                    <Filter className="h-3 w-3 mr-1" />
                                    <SelectValue placeholder="Filter type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Types</SelectItem>
                                    {uniqueLenderTypes.map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="p-3 space-y-3">
                            {isLoadingLenders ? (
                                Array.from({ length: 4 }).map((_, index) => (
                                    <div key={index} className="flex items-center space-x-2 py-1">
                                        <Skeleton className="h-4 w-4" />
                                        <Skeleton className="h-4 w-[80%]" />
                                    </div>
                                ))
                            ) : filteredLenders.length > 0 ? (
                                <>
                                    <div className="flex items-center space-x-2 pb-2 border-b mb-2">
                                        <Checkbox
                                            id="select-all-lenders"
                                            checked={allVisibleSelected} // Use memoized value based on prop
                                            onCheckedChange={handleSelectAllVisible} // Calls prop callback
                                            aria-label="Select all visible lenders"
                                            disabled={filteredLenders.length === 0}
                                        />
                                        <Label
                                            htmlFor="select-all-lenders"
                                            className={cn("text-sm font-medium leading-none cursor-pointer", filteredLenders.length === 0 && "text-muted-foreground cursor-not-allowed")}
                                        >
                                            Select All ({filteredLenders.length})
                                        </Label>
                                    </div>

                                    {filteredLenders.map((lender) => (
                                        <div key={lender.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`lender-${lender.id}`}
                                                checked={selectedLenderIds.includes(lender.id)} // Use prop
                                                onCheckedChange={(checked) => handleCheckboxChange(lender.id, checked)} // Calls prop callback
                                            />
                                            <Label
                                                htmlFor={`lender-${lender.id}`}
                                                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {lender.name}
                                                {lender.type && <span className="text-xs text-muted-foreground ml-1">({lender.type})</span>}
                                            </Label>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div className="text-sm text-muted-foreground text-center py-2">
                                    {lendersWithDocuments.length === 0 ? "No lenders found with docs." : "No lenders match filter."}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </ScrollArea>

            {/* --- Footer Re-added --- */}
            <div className="p-4 border-t shrink-0 bg-gray-50">
                 {/* Use props for counts */}
                 <p className="text-xs text-muted-foreground mb-2 text-center">
                    {selectedClientId ? '1 client,' : 'No client,'}
                    {' '}
                    {/* Indicate 'All visible' if the filter is active and all shown are selected */}
                    {allVisibleSelected && filteredLenders.length > 0 ? (lenderTypeFilter !== 'All' && filteredLenders.length === lendersWithDocuments.length ? 'All visible' : (allVisibleSelected && filteredLenders.length == lendersWithDocuments.length ? 'All' : selectedLenderIds.length)) : selectedLenderIds.length}
                    {' '}
                    lender(s) selected
                </p>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full text-xs font-normal">
                            <Info className="h-3 w-3 mr-1.5" />How AI uses context
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 mx-2 text-sm" align="end" side="top">
                         <p className="font-medium mb-1">AI Context:</p>
                         <ul className="list-disc pl-4 text-xs space-y-1 text-muted-foreground">
                             <li>Uses selected client info for context.</li>
                             <li>References selected lenders & their documents.</li>
                             <li>Helps compare rates, requirements, etc.</li>
                         </ul>
                         <p className="text-xs text-muted-foreground mt-2">Select items above to guide the AI.</p>
                    </PopoverContent>
                </Popover>
            </div>
            {/* --- End Footer --- */}
        </div>
    );
};

export default ContextPanel;
