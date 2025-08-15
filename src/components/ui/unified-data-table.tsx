import React from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  width?: string;
  className?: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

export interface TableAction<T = any> {
  label: string;
  icon?: React.ReactNode;
  onClick: (item: T) => void;
  className?: string;
  disabled?: boolean | ((item: T) => boolean);
}

export interface UnifiedDataTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  getRowId: (item: T) => string;
  className?: string;
}

export function UnifiedDataTable<T = any>({
  data,
  columns,
  actions = [],
  isLoading = false,
  error = null,
  emptyMessage = "No data found",
  emptyDescription = "No items match your current filters.",
  onRowClick,
  getRowId,
  className = ""
}: UnifiedDataTableProps<T>) {
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="text-center text-red-600 p-8">
          Error loading data: {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead 
                  key={column.key} 
                  className={column.className}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.label}
                </TableHead>
              ))}
              {actions.length > 0 && (
                <TableHead className="w-12"></TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (actions.length > 0 ? 1 : 0)} 
                  className="text-center py-8 text-muted-foreground"
                >
                  <div className="space-y-2">
                    <div className="font-medium">{emptyMessage}</div>
                    <div className="text-sm">{emptyDescription}</div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow 
                  key={getRowId(item)}
                  className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.render ? column.render(item) : (item as any)[column.key]}
                    </TableCell>
                  ))}
                  {actions.length > 0 && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions.map((action, index) => {
                            const isDisabled = typeof action.disabled === 'function' 
                              ? action.disabled(item) 
                              : action.disabled;
                            
                            return (
                              <DropdownMenuItem
                                key={index}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  action.onClick(item);
                                }}
                                className={action.className}
                                disabled={isDisabled}
                              >
                                {action.icon && <span className="mr-2">{action.icon}</span>}
                                {action.label}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Helper components for common table cell patterns
export const AvatarCell: React.FC<{
  src?: string;
  alt: string;
  fallback: string;
  name: string;
  subtitle?: string;
  linkTo?: string;
}> = ({ src, alt, fallback, name, subtitle, linkTo }) => {
  const content = (
    <div className="flex items-center space-x-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback className="text-xs">{fallback}</AvatarFallback>
      </Avatar>
      <div>
        <div className={`font-medium ${linkTo ? 'hover:underline text-primary' : ''}`}>
          {name}
        </div>
        {subtitle && (
          <div className="text-sm text-muted-foreground">{subtitle}</div>
        )}
      </div>
    </div>
  );

  return linkTo ? <Link to={linkTo}>{content}</Link> : content;
};

export const BadgeCell: React.FC<{
  value: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}> = ({ value, variant = "default", className }) => (
  <Badge variant={variant} className={className}>
    {value}
  </Badge>
);

export const ContactCell: React.FC<{
  email?: string;
  phone?: string;
  iconSize?: string;
}> = ({ email, phone, iconSize = "h-3 w-3" }) => (
  <div className="space-y-1">
    {email && (
      <div className="flex items-center text-sm">
        <span className="truncate">{email}</span>
      </div>
    )}
    {phone && (
      <div className="flex items-center text-sm">
        <span>{phone}</span>
      </div>
    )}
    {!email && !phone && <span className="text-muted-foreground">-</span>}
  </div>
);

export const TagsCell: React.FC<{
  tags?: string[];
  maxVisible?: number;
}> = ({ tags = [], maxVisible = 2 }) => (
  <div className="flex flex-wrap gap-1">
    {tags.slice(0, maxVisible).map((tag, index) => (
      <Badge key={index} variant="outline" className="text-xs">
        {tag}
      </Badge>
    ))}
    {tags.length > maxVisible && (
      <Badge variant="outline" className="text-xs">
        +{tags.length - maxVisible}
      </Badge>
    )}
  </div>
);