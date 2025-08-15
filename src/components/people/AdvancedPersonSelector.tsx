import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Search, X, ChevronDown, ChevronUp } from 'lucide-react';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useImprovedPeople } from '@/hooks/useImprovedPeople';
import {
  Person,
  ContactType,
  formatPersonName,
  getContactTypeColor,
  getContactTypeDisplayName
} from '@/features/people/types';
import AddPersonForm from './AddPersonForm';

export interface AdvancedPersonSelectorProps {
  selectedPersonId?: string;
  onPersonSelect: (person: Person | null) => void;
  contactType?: ContactType;
  placeholder?: string;
  className?: string;
  onPersonCreated?: (person: Person) => void;
  disabled?: boolean;
  allowClear?: boolean;
  showRecentContacts?: boolean;
  maxResults?: number;
}

// Fuzzy search utility
const fuzzySearch = (searchTerm: string, text: string): number => {
  if (!searchTerm) return 1;
  
  const search = searchTerm.toLowerCase();
  const target = text.toLowerCase();
  
  // Exact match gets highest score
  if (target.includes(search)) {
    return target.indexOf(search) === 0 ? 1 : 0.8;
  }
  
  // Character-by-character fuzzy matching
  let searchIndex = 0;
  let score = 0;
  
  for (let i = 0; i < target.length && searchIndex < search.length; i++) {
    if (target[i] === search[searchIndex]) {
      score++;
      searchIndex++;
    }
  }
  
  return searchIndex === search.length ? score / search.length * 0.6 : 0;
};

// Score person relevance for search
const scorePerson = (person: Person, searchTerm: string): number => {
  if (!searchTerm) return 1;
  
  const nameScore = fuzzySearch(searchTerm, formatPersonName(person));
  const emailScore = fuzzySearch(searchTerm, person.email_primary || '');
  const companyScore = fuzzySearch(searchTerm, person.company_name || '');
  
  return Math.max(nameScore, emailScore * 0.8, companyScore * 0.6);
};

export const AdvancedPersonSelector: React.FC<AdvancedPersonSelectorProps> = ({
  selectedPersonId,
  onPersonSelect,
  contactType,
  placeholder = "Select a person",
  className,
  onPersonCreated,
  disabled = false,
  allowClear = true,
  showRecentContacts = true,
  maxResults = 50
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [recentContacts, setRecentContacts] = useState<string[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
  // Use improved people hook with debounced search
  const { people, isLoading, addPerson } = useImprovedPeople(
    {
      contact_type: contactType,
      status: 'active'
    },
    {
      onPersonCreated: (person) => {
        console.log('[AdvancedPersonSelector] Person created:', person);
        if (onPersonCreated) {
          onPersonCreated(person);
        }
        onPersonSelect(person);
        setShowCreateDialog(false);
        setIsOpen(false);
      }
    }
  );

  // Memoize filtered and scored people
  const filteredPeople = useMemo(() => {
    let filtered = people.filter(person => 
      !contactType || person.contact_type === contactType
    );
    
    if (searchTerm) {
      filtered = filtered
        .map(person => ({
          person,
          score: scorePerson(person, searchTerm)
        }))
        .filter(({ score }) => score > 0.1)
        .sort((a, b) => b.score - a.score)
        .map(({ person }) => person);
    }
    
    // Prioritize recent contacts if enabled
    if (showRecentContacts && recentContacts.length > 0) {
      const recent = filtered.filter(p => recentContacts.includes(p.id));
      const others = filtered.filter(p => !recentContacts.includes(p.id));
      filtered = [...recent, ...others];
    }
    
    return filtered.slice(0, maxResults);
  }, [people, contactType, searchTerm, recentContacts, showRecentContacts, maxResults]);

  const selectedPerson = people.find(p => p.id === selectedPersonId);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < filteredPeople.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && filteredPeople[highlightedIndex]) {
            handlePersonSelect(filteredPeople[highlightedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, highlightedIndex, filteredPeople]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handlePersonSelect = (person: Person) => {
    onPersonSelect(person);
    setIsOpen(false);
    setHighlightedIndex(-1);
    
    // Add to recent contacts
    if (showRecentContacts) {
      setRecentContacts(prev => {
        const updated = [person.id, ...prev.filter(id => id !== person.id)];
        return updated.slice(0, 5); // Keep only 5 recent contacts
      });
    }
  };

  const handleClearSelection = () => {
    onPersonSelect(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setHighlightedIndex(-1);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div className={className}>
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isOpen}
                  className="w-full justify-between"
                  disabled={disabled}
                >
                  {selectedPerson ? formatPersonName(selectedPerson) : placeholder}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <div className="p-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      ref={inputRef}
                      placeholder="Search people..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={handleInputChange}
                      autoFocus
                    />
                  </div>
                </div>
                
                <ScrollArea className="max-h-60">
                  {isLoading ? (
                    <div className="p-2 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : filteredPeople.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {searchTerm ? 'No people found' : contactType ? `No ${contactType}s available` : 'No people available'}
                    </div>
                  ) : (
                    <div ref={listRef}>
                      {filteredPeople.map((person, index) => (
                        <div
                          key={person.id}
                          className={`p-2 cursor-pointer hover:bg-muted ${
                            index === highlightedIndex ? 'bg-muted' : ''
                          }`}
                          onClick={() => handlePersonSelect(person)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{formatPersonName(person)}</div>
                              <div className="text-sm text-muted-foreground truncate">
                                {person.email_primary}
                                {person.company_name && ` • ${person.company_name}`}
                              </div>
                              {showRecentContacts && recentContacts.includes(person.id) && (
                                <div className="text-xs text-primary">Recent contact</div>
                              )}
                            </div>
                            <Badge className={getContactTypeColor(person.contact_type as ContactType)}>
                              {getContactTypeDisplayName(person.contact_type as ContactType)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
            
            {/* Clear button */}
            {allowClear && selectedPersonId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
                onClick={handleClearSelection}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setShowCreateDialog(true)}
            className="shrink-0"
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
        </div>

        {/* Selected Person Preview */}
        {selectedPerson && (
          <Card className="border-primary/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{formatPersonName(selectedPerson)}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedPerson.email_primary}
                    {selectedPerson.phone_primary && ` • ${selectedPerson.phone_primary}`}
                  </div>
                  {selectedPerson.company_name && (
                    <div className="text-sm text-muted-foreground">
                      {selectedPerson.company_name}
                      {selectedPerson.title_position && ` • ${selectedPerson.title_position}`}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getContactTypeColor(selectedPerson.contact_type as ContactType)}>
                    {getContactTypeDisplayName(selectedPerson.contact_type as ContactType)}
                  </Badge>
                  {allowClear && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={handleClearSelection}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Empty state when no person selected */}
        {!selectedPerson && !isLoading && (
          <div className="text-sm text-muted-foreground text-center py-2">
            {contactType ? `Select an existing ${contactType} or create a new one` : 'Select an existing person or create a new one'}
          </div>
        )}
      </div>

      {/* Create Person Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Create New {contactType ? getContactTypeDisplayName(contactType) : 'Person'}
            </DialogTitle>
          </DialogHeader>
          <AddPersonForm 
            onSubmitSuccess={() => {}}
            onCancel={() => setShowCreateDialog(false)}
            defaultContactType={contactType}
            hideContactType={!!contactType}
            customAddPerson={addPerson}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvancedPersonSelector;