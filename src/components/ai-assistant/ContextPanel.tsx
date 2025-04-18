import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Building, Info, X, Filter, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { useLenders } from '@/hooks/useLenders';
import { useLenderDocuments } from '@/hooks/useLenderDocuments';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/features/clients/types';

interface ContextPanelProps {
    contextPanelOpen: boolean;
    setContextPanelOpen: (isOpen: boolean) => void;
    onContextChange?: (context: { 
      selectedLenderIds: string[]; 
      selectedDocumentIds: string[];
      selectedClientId?: string;
    }) => void;
}

const ContextPanel: React.FC<ContextPanelProps> = ({
    contextPanelOpen,
    setContextPanelOpen,
    onContextChange
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
                setClients(clientsData || []);
            } catch (error) {
                console.error('Error fetching clients:', error);
            } finally {
                setIsLoadingClients(false);
            }
        };

        fetchClients();
    }, [user]);

    // Filter clients based on search term
    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            const searchString = `${client.first_name} ${client.last_name} ${client.email}`.toLowerCase();
            return searchString.includes(clientSearchTerm.toLowerCase());
        });
    }, [clients, clientSearchTerm]);

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


    useEffect(() => {
        if (user) {
            fetchLenders();
            fetchDocuments();
        }
    }, [user, fetchLenders, fetchDocuments]);

    // Update context data when selections change
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

    // Filter lenders as before
    const filteredLenders = useMemo(() => {
        return lendersWithDocuments.filter(lender =>
            lenderTypeFilter === 'All' || lender.type === lenderTypeFilter
        );
    }, [lendersWithDocuments, lenderTypeFilter]);

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

    return (
        <>
            {contextPanelOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setContextPanelOpen(false)} />}
            <div className={cn(
                "bg-white border-gray-200 flex flex-col transition-transform duration-300 ease-in-out flex-shrink-0",
                "fixed inset-y-0 right-0 z-40 w-72 border-l",
                "lg:static lg:z-auto lg:w-80 lg:border-l lg:translate-x-0",
                contextPanelOpen ? "translate-x-0" : "translate-x-full lg:hidden"
            )}>
                <div className="p-4 border-b flex items-center justify-between shrink-0">
                    <h3 className="font-medium">Context Panel</h3>
                    <Button variant="ghost" size="icon" onClick={() => setContextPanelOpen(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <ScrollArea className="flex-1 p-4">
                    <Tabs defaultValue="clients">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="clients">Clients</TabsTrigger>
                            <TabsTrigger value="lenders">Lenders</TabsTrigger>
                        </TabsList>

                        {/* Clients Tab */}
                        <TabsContent value="clients" className="space-y-4 mt-4">
                            <div className="space-y-4">
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
                                    <CardContent className="p-3 space-y-3">
                                        {isLoadingClients ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center space-x-2">
                                                    <Skeleton className="h-4 w-4" />
                                                    <Skeleton className="h-4 w-[80%]" />
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Skeleton className="h-4 w-4" />
                                                    <Skeleton className="h-4 w-[70%]" />
                                                </div>
                                            </div>
                                        ) : (
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
                                                        className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        {client.first_name} {client.last_name}
                                                    </Label>
                                                </div>
                                            ))
                                        )}
                                        {!isLoadingClients && filteredClients.length === 0 && (
                                            <div className="text-sm text-gray-500 text-center py-2">
                                                No clients found
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Lenders Tab */}
                        <TabsContent value="lenders" className="mt-4 space-y-4">
                            <div>
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
                                    <CardContent className="p-3 space-y-3">
                                        {isLoadingLenders ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center space-x-2">
                                                    <Skeleton className="h-4 w-4" />
                                                    <Skeleton className="h-4 w-[80%]" />
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Skeleton className="h-4 w-4" />
                                                    <Skeleton className="h-4 w-[70%]" />
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Skeleton className="h-4 w-4" />
                                                    <Skeleton className="h-4 w-[90%]" />
                                                </div>
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
                {/* Footer with counts and info */}
                <div className="p-4 border-t shrink-0">
                    <p className="text-xs text-gray-500 mb-2 text-center">
                        {selectedClientId ? '1 client,' : 'No client,'} {selectedLenderIds.length} lender(s) selected
                    </p>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full text-xs">
                                <Info className="h-4 w-4 mr-2" />How does AI work?
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 mx-2" align="start" side="top">
                            <div className="space-y-2 text-sm">
                                <div className="font-medium">The AI Assistant:</div>
                                <ul className="list-disc pl-5 text-xs space-y-1 text-gray-600">
                                    <li>Uses selected client's information for context</li>
                                    <li>References selected lenders & documents</li>
                                    <li>Helps compare rates & requirements</li>
                                </ul>
                                <div className="text-xs text-gray-500 mt-2">
                                    Select a client and lenders to provide context for the conversation.
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </>
    );
};

export default ContextPanel;
