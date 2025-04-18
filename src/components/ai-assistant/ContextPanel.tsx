import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Info, X, Filter, Search } from "lucide-react";
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
    contextPanelOpen: boolean; // Pass state for conditional rendering of close button
    setContextPanelOpen: (isOpen: boolean | ((prev: boolean) => boolean)) => void; // Update setter type
    onContextChange?: (context: {
      selectedLenderIds: string[];
      selectedDocumentIds: string[];
      selectedClientId?: string;
    }) => void;
    className?: string; // Accept className from parent
}

const ContextPanel: React.FC<ContextPanelProps> = ({
    contextPanelOpen,
    setContextPanelOpen,
    onContextChange,
    className // Receive className from parent
}) => {
    const { user } = useAuth();
    const { lenders: allUserLenders, isLoading: isLoadingLenders, fetchLenders } = useLenders();
    const { documents: allUserDocuments, isLoading: isLoadingDocuments, fetchDocuments } = useLenderDocuments();

    // Client state
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoadingClients, setIsLoadingClients] = useState(true);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [clientSearchTerm, setClientSearchTerm] = useState('');

    // Lender state
    const [selectedLenderIds, setSelectedLenderIds] = useState<string[]>([]);
    const [lenderTypeFilter, setLenderTypeFilter] = useState<string>('All');
    const [initializedLenders, setInitializedLenders] = useState(false); // Flag for initial load

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

    // Fetch base data
    useEffect(() => {
        if (user) {
            fetchLenders();
            fetchDocuments();
        }
    }, [user, fetchLenders, fetchDocuments]);

    // Initialize selected lenders once data is available (Select All by default)
    useEffect(() => {
        if (!isLoadingLenders && !isLoadingDocuments && lendersWithDocuments.length > 0 && !initializedLenders) {
            const allLenderIds = lendersWithDocuments.map(lender => lender.id);
            setSelectedLenderIds(allLenderIds);
            setInitializedLenders(true); // Set flag to prevent re-initialization
        }
    }, [lendersWithDocuments, isLoadingLenders, isLoadingDocuments, initializedLenders]);


    // Propagate context changes
    useEffect(() => {
        const relevantDocumentIds = selectedLenderIds.flatMap(lenderId => documentIdsByLender[lenderId] || []);
        const newContextData = {
            selectedLenderIds,
            selectedDocumentIds: relevantDocumentIds,
            selectedClientId: selectedClientId || undefined
        };
        if (onContextChange) {
            onContextChange(newContextData);
        }
    }, [selectedLenderIds, documentIdsByLender, selectedClientId, onContextChange]);

    const filteredLenders = useMemo(() => {
        return lendersWithDocuments.filter(lender =>
            lenderTypeFilter === 'All' || lender.type === lenderTypeFilter
        );
    }, [lendersWithDocuments, lenderTypeFilter]);

    // MODIFIED: Handle individual lender checkbox changes
    const handleCheckboxChange = (lenderId: string, checked: boolean | string) => {
         if (checked) {
             // Select only this one lender
             setSelectedLenderIds([lenderId]);
         } else {
             // If unchecking the currently selected one, deselect all
             setSelectedLenderIds([]);
         }
    };

    // MODIFIED: Handle "Select All" checkbox changes
    const handleSelectAllVisible = (checked: boolean | string) => {
        const visibleLenderIds = filteredLenders.map(l => l.id);
        if (checked) {
            // Select all visible lenders
            setSelectedLenderIds(visibleLenderIds);
        } else {
            // Deselect all lenders
            setSelectedLenderIds([]);
        }
    };

    // MODIFIED: Determine if "Select All" should be checked
    const allVisibleSelected = useMemo(() => {
        if (filteredLenders.length === 0) return false; // Can't select all if none are visible
        // Check if the number of selected lenders matches the number of filtered lenders
        // AND every filtered lender is included in the selected list
        return selectedLenderIds.length === filteredLenders.length &&
               filteredLenders.every(l => selectedLenderIds.includes(l.id));
    }, [selectedLenderIds, filteredLenders]);


    // Apply the passed className to the root element, and add necessary internal layout styles
    return (
        <div className={cn(
            "bg-white flex flex-col h-full border-l border-gray-200", // Base internal layout
            className // Allow parent to control width, display etc.
        )}>
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between shrink-0">
                <h3 className="font-medium text-base">Context Panel</h3>
                {/* Show close button only on smaller screens (lg:hidden) */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setContextPanelOpen(false)}
                    className="text-muted-foreground lg:hidden"
                    aria-label="Close context panel"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1">
                <div className="p-4"> {/* Add padding here */}
                    <Tabs defaultValue="lenders"> {/* <-- Changed default value to lenders */}
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="clients">Clients</TabsTrigger>
                            <TabsTrigger value="lenders">Lenders</TabsTrigger>
                        </TabsList>

                        {/* Clients Tab */}
                        <TabsContent value="clients" className="space-y-4 mt-4">
                             <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search clients..."
                                    value={clientSearchTerm}
                                    onChange={(e) => setClientSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Card>
                                {/* Added max-h-48 and overflow-y-auto */}
                                <CardContent className="p-3 space-y-3 max-h-48 overflow-y-auto">
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
                                                    checked={selectedClientId === client.id}
                                                    onCheckedChange={(checked) => {
                                                        setSelectedClientId(checked ? client.id : null);
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
                                        <div className="text-sm text-gray-500 text-center py-2">
                                            No clients found
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Lenders Tab */}
                        <TabsContent value="lenders" className="mt-4 space-y-4">
                            <div className="flex justify-between items-center mb-2">
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
                            <Card>
                                {/* Added max-h-60 and overflow-y-auto */}
                                <CardContent className="p-3 space-y-3 max-h-60 overflow-y-auto">
                                    {isLoadingLenders ? (
                                         Array.from({ length: 4 }).map((_, index) => (
                                            <div key={index} className="flex items-center space-x-2 py-1">
                                                <Skeleton className="h-4 w-4" />
                                                <Skeleton className="h-4 w-[80%]" />
                                            </div>
                                        ))
                                    ) : filteredLenders.length > 0 ? (
                                        <>
                                            {/* Select/Deselect All Checkbox */}
                                            <div className="flex items-center space-x-2 pb-2 border-b mb-2">
                                                <Checkbox
                                                    id="select-all-lenders"
                                                    checked={allVisibleSelected} // Use the memoized value
                                                    onCheckedChange={handleSelectAllVisible}
                                                    aria-label="Select all visible lenders"
                                                    disabled={filteredLenders.length === 0}
                                                />
                                                <Label
                                                    htmlFor="select-all-lenders"
                                                    className={cn("text-sm font-medium leading-none cursor-pointer", filteredLenders.length === 0 && "text-gray-400 cursor-not-allowed")}
                                                >
                                                    Select All ({filteredLenders.length})
                                                </Label>
                                            </div>

                                            {/* Lenders List */}
                                            {filteredLenders.map((lender) => (
                                                <div key={lender.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`lender-${lender.id}`} // Ensure unique ID
                                                        checked={selectedLenderIds.includes(lender.id)}
                                                        // Use the modified handler
                                                        onCheckedChange={(checked) => handleCheckboxChange(lender.id, checked)}
                                                    />
                                                    <Label
                                                        htmlFor={`lender-${lender.id}`} // Match unique ID
                                                        className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {lender.name}
                                                        {lender.type && <span className="text-xs text-gray-500 ml-1">({lender.type})</span>}
                                                    </Label>
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="text-sm text-gray-500 text-center py-2">
                                            {lendersWithDocuments.length === 0 ? "No lenders found with docs." : "No lenders match filter."}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t shrink-0 bg-gray-50">
                 <p className="text-xs text-gray-600 mb-2 text-center">
                    {selectedClientId ? '1 client,' : 'No client,'} {/* MODIFIED: Show correct count based on selection logic */} {selectedLenderIds.length === filteredLenders.length && filteredLenders.length > 1 ? 'All' : selectedLenderIds.length} lender(s) selected
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
        </div>
    );
};

export default ContextPanel;
