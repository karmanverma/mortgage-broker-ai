import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Search, Plus, LayoutGrid, List, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
}

interface PageHeaderProps {
  // Search functionality
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  
  // Filters
  filters?: Array<{
    value: string;
    onValueChange: (value: string) => void;
    options: FilterOption[];
    placeholder: string;
    className?: string;
  }>;
  
  // View toggle
  viewMode?: 'grid' | 'list' | 'kanban';
  onViewModeChange?: (mode: 'grid' | 'list' | 'kanban') => void;
  viewOptions?: Array<'grid' | 'list' | 'kanban'>;
  
  // Actions
  onAddClick?: () => void;
  addButtonText?: string;
  addButtonIcon?: React.ReactNode;
  
  // Additional actions
  actions?: React.ReactNode;
  
  // Layout
  className?: string;
}

export function PageHeader({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  viewMode,
  onViewModeChange,
  viewOptions = ['grid', 'list'],
  onAddClick,
  addButtonText = 'Add New',
  addButtonIcon = <Plus className="h-4 w-4" />,
  actions,
  className
}: PageHeaderProps) {
  const hasSearch = !!onSearchChange;
  const hasFilters = filters.length > 0;
  const hasViewToggle = !!onViewModeChange && viewOptions.length > 1;
  const hasActions = !!onAddClick || !!actions;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Search */}
        {hasSearch && (
          <div className="relative flex-1 min-w-0 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Filters */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2">
            {filters.map((filter, index) => (
              <Select
                key={index}
                value={filter.value}
                onValueChange={filter.onValueChange}
              >
                <SelectTrigger className={cn('w-auto min-w-[140px]', filter.className)}>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={filter.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1 hidden sm:block" />

        {/* View Toggle */}
        {hasViewToggle && (
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && onViewModeChange?.(value as any)}
            className="border rounded-md p-1"
          >
            {viewOptions.includes('grid') && (
              <ToggleGroupItem value="grid" aria-label="Grid view" size="sm">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
            )}
            {viewOptions.includes('list') && (
              <ToggleGroupItem value="list" aria-label="List view" size="sm">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            )}
            {viewOptions.includes('kanban') && (
              <ToggleGroupItem value="kanban" aria-label="Kanban view" size="sm">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
            )}
          </ToggleGroup>
        )}

        {/* Actions */}
        {hasActions && (
          <div className="flex gap-2">
            {actions}
            {onAddClick && (
              <Button onClick={onAddClick}>
                {addButtonIcon}
                <span className="ml-2">{addButtonText}</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Separator */}
      <Separator />
    </div>
  );
}