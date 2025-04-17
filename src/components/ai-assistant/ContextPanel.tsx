import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Building, Info, X, Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { useLenders, Lender } from '@/hooks/useLenders'; // Import useLenders and Lender type
import { useLenderDocuments, Document } from '@/hooks/useLenderDocuments'; // Import useLenderDocuments and Document type
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton for loading state

// Define lender type for filtering (can be extended from Lender type if needed)
type LenderTypeFilter = 'All' | string; // Allow 'All' or specific types from data

interface ContextPanelProps {
    contextPanelOpen: boolean;
    setContextPanelOpen: (isOpen: boolean) => void;
    // Add a callback prop to pass the selected context data up
    onContextChange?: (context: { selectedLenderIds: string[]; selectedDocumentIds: string[] }) => void;
}

const ContextPanel: React.FC<ContextPanelProps> = ({
    contextPanelOpen,
    setContextPanelOpen,
    onContextChange
}) => {
    const { user } = useAuth();
    const { lenders: allUserLenders, isLoading: isLoadingLenders, fetchLenders } = useLenders();
    const { documents: allUserDocuments, isLoading: isLoadingDocuments, fetchDocuments } = useLenderDocuments();

    // State for selected lenders
    const [selectedLenderIds, setSelectedLenderIds] = useState<string[]>([]);
    // State for lender type filter
    const [lenderTypeFilter, setLenderTypeFilter] = useState<LenderTypeFilter>('All');
    // State to hold the prepared context data
    const [contextDataForAI, setContextDataForAI] = useState<{ selectedLenderIds: string[]; selectedDocumentIds: string[] }>({ selectedLenderIds: [], selectedDocumentIds: [] });

    // Fetch data when user is available or changes
    useEffect(() => {
        if (user) {
            console.log("ContextPanel: User found, fetching lenders and documents.");
            fetchLenders();
            // Fetch all documents for the user initially to determine which lenders have docs
            fetchDocuments();
        } else {
            console.log("ContextPanel: No user, skipping fetch.");
            // Clear data if user logs out? Or handle upstream.
        }
    }, [user, fetchLenders, fetchDocuments]); // Dependencies include user and fetch functions

    // Memoize the list of lenders who have at least one document
    const lendersWithDocuments = useMemo((): Lender[] => {
        if (isLoadingLenders || isLoadingDocuments || !allUserLenders || !allUserDocuments) {
            return [];
        }
        const lenderIdsWithDocs = new Set(allUserDocuments.map(doc => doc.lender_id));
        return allUserLenders.filter(lender => lenderIdsWithDocs.has(lender.id));
    }, [allUserLenders, allUserDocuments, isLoadingLenders, isLoadingDocuments]);

    // Memoize a map of lender IDs to their document IDs for quick lookup
    const documentIdsByLender = useMemo((): Record<string, string[]> => {
        if (isLoadingDocuments || !allUserDocuments) {
            return {};
        }
        return allUserDocuments.reduce((acc, doc) => {
            if (!acc[doc.lender_id]) {
                acc[doc.lender_id] = [];
            }
            acc[doc.lender_id].push(doc.id);
            return acc;
        }, {} as Record<string, string[]>);
    }, [allUserDocuments, isLoadingDocuments]);


    // Apply the type filter to lenders who have documents
    const filteredLenders = useMemo(() => {
        return lendersWithDocuments.filter(lender =>
            lenderTypeFilter === 'All' || lender.type === lenderTypeFilter
        );
    }, [lendersWithDocuments, lenderTypeFilter]);

    // Update selected lenders when filter changes or data loads
    // Keep only selected lenders that are still visible after filtering/loading
     useEffect(() => {
        const visibleLenderIds = new Set(filteredLenders.map(l => l.id));
        setSelectedLenderIds(prevSelected => prevSelected.filter(id => visibleLenderIds.has(id)));
     }, [filteredLenders]); // Rerun when the filtered list changes

    // Handle individual checkbox change
    const handleCheckboxChange = (lenderId: string, checked: boolean | string) => {
        setSelectedLenderIds(prevSelected =>
            checked
                ? [...prevSelected, lenderId]
                : prevSelected.filter(id => id !== lenderId)
        );
    };

    // Handler to select/deselect all *visible* lenders
    const handleSelectAllVisible = (checked: boolean | string) => {
        const visibleLenderIds = filteredLenders.map(l => l.id);
        if (checked) {
            setSelectedLenderIds(prevSelected => Array.from(new Set([...prevSelected, ...visibleLenderIds])));
        } else {
            setSelectedLenderIds(prevSelected => prevSelected.filter(id => !visibleLenderIds.includes(id)));
        }
    };

    // Determine if "Select All" checkbox should be checked
    const allVisibleSelected = filteredLenders.length > 0 && filteredLenders.every(l => selectedLenderIds.includes(l.id));

    // --- Prepare data for webhook/AI ---
    // Update context data whenever selected lenders or the document map change
    useEffect(() => {
        const relevantDocumentIds = selectedLenderIds.flatMap(lenderId => documentIdsByLender[lenderId] || []);
        const newContextData = {
            selectedLenderIds: selectedLenderIds,
            selectedDocumentIds: relevantDocumentIds
        };
        setContextDataForAI(newContextData);

        // Call the callback prop if provided
        if (onContextChange) {
            onContextChange(newContextData);
        }

        // Log the prepared data (for debugging)
        console.log("ContextPanel: Prepared Context Data:", newContextData);

    }, [selectedLenderIds, documentIdsByLender, onContextChange]);


    // Placeholder for actual referenced lender logic
    const placeholderReferencedLender = null; // Replace with logic if needed

    const isLoading = isLoadingLenders || isLoadingDocuments;

    // Extract unique lender types for the filter dropdown
    const uniqueLenderTypes = useMemo(() => {
        const types = new Set(lendersWithDocuments.map(l => l.type).filter(Boolean)); // Filter out null/undefined types
        return Array.from(types).sort();
    }, [lendersWithDocuments]);


    return (
        <>
            {/* Backdrop for Mobile Overlay */}
            {contextPanelOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setContextPanelOpen(false)} />}

            {/* Panel Container */}
            <div className={cn(
                "bg-white border-gray-200 flex flex-col transition-transform duration-300 ease-in-out flex-shrink-0",
                "fixed inset-y-0 right-0 z-40 w-72 border-l", // Mobile styles
                "lg:static lg:z-auto lg:w-80 lg:border-l lg:translate-x-0", // Desktop styles
                contextPanelOpen ? "translate-x-0" : "translate-x-full lg:hidden" // Open/Close state
            )}>
                 {/* Header */}
                 <div className="p-4 border-b flex items-center justify-between shrink-0">
                     <h3 className="font-medium">Context Panel</h3>
                     <Button variant="ghost" size="icon" onClick={() => setContextPanelOpen(false)}><X className="h-4 w-4" /></Button>
                 </div>
                 {/* Scrollable Content */}
                 <ScrollArea className="flex-1 p-4">
                     <Tabs defaultValue="lenders">
                         <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="context">Context</TabsTrigger><TabsTrigger value="lenders">Lenders</TabsTrigger></TabsList>
                         {/* Context Tab Content (Placeholder) */}
                         <TabsContent value="context" className="space-y-4 mt-4">
                             <div><h4 className="text-sm font-medium mb-2">Current Topic</h4><Card><CardHeader className="py-3"><CardTitle className="text-sm">Topic (N/A)</CardTitle></CardHeader><CardContent className="py-2"><div className="text-xs text-gray-500">Context info not yet available.</div></CardContent></Card></div>
                             <div><h4 className="text-sm font-medium mb-2">Key Info</h4><div className="space-y-2"><div className="p-2 bg-gray-50 rounded-md text-sm flex items-start"><Info className="h-4 w-4 text-gray-500 mr-2 mt-0.5 shrink-0" /><div>No key info extracted.</div></div></div></div>
                         </TabsContent>
                         {/* Lenders Tab Content */}
                         <TabsContent value="lenders" className="mt-4 space-y-4">
                             {/* Referenced Section */}
                             <div>
                                 <h4 className="text-sm font-medium mb-2">Referenced</h4>
                                 <Card>
                                     <CardHeader className="py-3">
                                         <CardTitle className="text-sm flex items-center">
                                             <Building className="h-4 w-4 mr-2" />
                                             {placeholderReferencedLender ? placeholderReferencedLender.name : "Lender (N/A)"}
                                         </CardTitle>
                                     </CardHeader>
                                     <CardContent className="py-2 space-y-1.5 text-xs">
                                         <div className="text-gray-500">
                                            {placeholderReferencedLender ? `Details for ${placeholderReferencedLender.name}` : "Lender context not yet available."}
                                         </div>
                                     </CardContent>
                                 </Card>
                             </div>

                             {/* Lenders List Section */}
                             <div>
                                 <div className="flex justify-between items-center mb-2">
                                     <h4 className="text-sm font-medium">Available Lenders (with Docs)</h4>
                                     {/* Filter Dropdown */}
                                     <Select
                                        value={lenderTypeFilter}
                                        onValueChange={(value: LenderTypeFilter) => setLenderTypeFilter(value)}
                                        disabled={isLoading || lendersWithDocuments.length === 0}
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
                                     <CardContent className="p-3 space-y-3">
                                        {isLoading ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center space-x-2"> <Skeleton className="h-4 w-4" /> <Skeleton className="h-4 w-[80%]" /> </div>
                                                <div className="flex items-center space-x-2"> <Skeleton className="h-4 w-4" /> <Skeleton className="h-4 w-[70%]" /> </div>
                                                <div className="flex items-center space-x-2"> <Skeleton className="h-4 w-4" /> <Skeleton className="h-4 w-[90%]" /> </div>
                                            </div>
                                        ) : filteredLenders.length > 0 ? (
                                            <>
                                                {/* Select/Deselect All Checkbox */}
                                                <div className="flex items-center space-x-2 pb-2 border-b">
                                                    <Checkbox
                                                        id="select-all-lenders"
                                                        checked={allVisibleSelected}
                                                        onCheckedChange={handleSelectAllVisible}
                                                        aria-label="Select all visible lenders"
                                                        disabled={filteredLenders.length === 0}
                                                    />
                                                    <Label
                                                        htmlFor="select-all-lenders"
                                                        className={cn("text-sm font-medium leading-none", filteredLenders.length === 0 && "text-gray-400 cursor-not-allowed")}
                                                    >
                                                        Select All ({filteredLenders.length})
                                                    </Label>
                                                </div>

                                                {/* Lenders List */}
                                                {filteredLenders.map((lender) => (
                                                    <div key={lender.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={lender.id}
                                                            checked={selectedLenderIds.includes(lender.id)}
                                                            onCheckedChange={(checked) => handleCheckboxChange(lender.id, checked)}
                                                        />
                                                        <Label
                                                            htmlFor={lender.id}
                                                            className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                        >
                                                            {lender.name}
                                                            {lender.type && <span className="text-xs text-gray-500 ml-1">({lender.type})</span>}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </>
                                        ) : (
                                            <div className="text-sm text-gray-500 text-center py-2">
                                                {lendersWithDocuments.length === 0 ? "No lenders found with uploaded documents." : "No lenders match the current filter."}
                                            </div>
                                        )}
                                     </CardContent>
                                 </Card>
                             </div>
                         </TabsContent>
                     </Tabs>
                 </ScrollArea>
                 {/* Footer */}
                 <div className="p-4 border-t shrink-0">
                      {/* Optional: Display selected count */}
                     <p className="text-xs text-gray-500 mb-2 text-center">
                        {selectedLenderIds.length} lender(s) selected, {contextDataForAI.selectedDocumentIds.length} document(s) in context.
                     </p>
                     <Popover>
                         <PopoverTrigger asChild><Button variant="outline" size="sm" className="w-full text-xs"><Info className="h-4 w-4 mr-2" />How does AI work?</Button></PopoverTrigger>
                         <PopoverContent className="w-80 mx-2" align="start" side="top">
                              <div className="space-y-2 text-sm"><div className="font-medium">The AI Assistant:</div><ul className="list-disc pl-5 text-xs space-y-1 text-gray-600"><li>Answers questions based on conversation</li><li>Can use selected Lenders & Documents as context</li><li>Helps compare rates & requirements based on context</li></ul><div className="text-xs text-gray-500 mt-2">Select lenders with documents to provide context.</div></div>
                         </PopoverContent>
                     </Popover>
                 </div>
             </div>
        </>
    );
};

export default ContextPanel;
