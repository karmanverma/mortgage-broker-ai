import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown, User, Building2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Client } from '@/features/clients/types';

interface ContextSelectorProps {
  selectedClientId: string | null;
  selectedLenderIds: string[];
  clients: Client[];
  lenders: any[]; // You can type this properly based on your lender type
  onSelectedClientChange: (clientId: string | null) => void;
  onSelectedLendersChange: (lenderIds: string[]) => void;
  className?: string;
}

export function ContextSelector({
  selectedClientId,
  selectedLenderIds,
  clients = [],
  lenders = [],
  onSelectedClientChange,
  onSelectedLendersChange,
  className
}: ContextSelectorProps) {
  const [clientOpen, setClientOpen] = useState(false);
  const [lenderOpen, setLenderOpen] = useState(false);

  const selectedClient = clients.find(client => client.id === selectedClientId);

  const handleLenderToggle = (lenderId: string) => {
    const newSelectedLenders = selectedLenderIds.includes(lenderId)
      ? selectedLenderIds.filter(id => id !== lenderId)
      : [...selectedLenderIds, lenderId];
    onSelectedLendersChange(newSelectedLenders);
  };

  const clearClient = () => {
    onSelectedClientChange(null);
  };

  const clearLenders = () => {
    onSelectedLendersChange([]);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Client Selector */}
      <Popover open={clientOpen} onOpenChange={setClientOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={clientOpen}
            className="h-8 justify-between text-xs"
            size="sm"
          >
            <User className="mr-2 h-3 w-3" />
            {selectedClient
              ? `${selectedClient.firstName} ${selectedClient.lastName}`
              : "Select client..."}
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search clients..." className="h-9" />
            <CommandList>
              <CommandEmpty>No clients found.</CommandEmpty>
              <CommandGroup>
                {clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={`${client.firstName} ${client.lastName}`}
                    onSelect={() => {
                      onSelectedClientChange(client.id === selectedClientId ? null : client.id);
                      setClientOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedClientId === client.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {client.firstName} {client.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {client.email}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Lender Selector */}
      <Popover open={lenderOpen} onOpenChange={setLenderOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={lenderOpen}
            className="h-8 justify-between text-xs"
            size="sm"
          >
            <Building2 className="mr-2 h-3 w-3" />
            {selectedLenderIds.length > 0
              ? `${selectedLenderIds.length} lender${selectedLenderIds.length > 1 ? 's' : ''}`
              : "Select lenders..."}
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search lenders..." className="h-9" />
            <CommandList>
              <CommandEmpty>No lenders found.</CommandEmpty>
              <CommandGroup>
                {lenders.map((lender) => (
                  <CommandItem
                    key={lender.id}
                    value={lender.name}
                    onSelect={() => handleLenderToggle(lender.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedLenderIds.includes(lender.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{lender.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {lender.type || 'Lender'}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Context Display */}
      {selectedClient && (
        <Badge variant="secondary" className="text-xs">
          <User className="mr-1 h-3 w-3" />
          {selectedClient.firstName} {selectedClient.lastName}
          <Button
            variant="ghost"
            size="sm"
            className="ml-1 h-auto p-0 text-xs hover:bg-transparent"
            onClick={clearClient}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}

      {selectedLenderIds.length > 0 && (
        <Badge variant="outline" className="text-xs">
          <Building2 className="mr-1 h-3 w-3" />
          {selectedLenderIds.length} Lender{selectedLenderIds.length > 1 ? 's' : ''}
          <Button
            variant="ghost"
            size="sm"
            className="ml-1 h-auto p-0 text-xs hover:bg-transparent"
            onClick={clearLenders}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
    </div>
  );
}