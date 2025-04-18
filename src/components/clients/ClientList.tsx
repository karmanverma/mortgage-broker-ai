
'use client';

import React from 'react'; 
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Client } from '@/features/clients/types'; // Importing Client type
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowUpDown, Eye } from 'lucide-react';
import { cn } from "@/lib/utils";

interface ClientListProps {
  clients: Client[];
}

// Helper functions
const formatCurrency = (amount: number | null | undefined) => {
  if (amount == null) return 'N/A'; // Use == to catch both null and undefined
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
};

const formatDate = (date: Date | string | null | undefined, formatString = 'PP') => {
  if (!date) return 'N/A';
  try {
    const validDate = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(validDate.getTime())) return 'Invalid Date';
    return format(validDate, formatString);
  } catch {
    return 'Invalid Date';
  }
};

// Map application status to badge variants (safely handle null/undefined)
type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | null | undefined;

const getStatusBadgeVariant = (status: string | null | undefined): BadgeVariant => {
  // Use a safe default if status is null or undefined
  const lowerCaseStatus = status?.toLowerCase() || 'unknown'; 
  switch (lowerCaseStatus) {
    case 'new': return 'secondary';
    case 'in review': return 'default'; 
    case 'approved': return 'success'; 
    case 'closed': return 'outline';
    case 'denied': return 'destructive';
    case 'withdrawn': return 'outline';
    default: return 'secondary';
  }
};


const ClientList: React.FC<ClientListProps> = ({ clients }) => {
  
  const handleSort = (columnId: keyof Client) => {
    console.log(`Sorting by ${columnId}`);
    // Add actual sorting logic here
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSort('lastName')} // Updated to use camelCase
              >
                 <div className="flex items-center">
                   Name <ArrowUpDown className="ml-2 h-3 w-3" />
                 </div>
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead 
                 className="text-right cursor-pointer hover:bg-muted/50 transition-colors"
                 onClick={() => handleSort('loanAmountSought')} // Updated to use camelCase
               >
                 <div className="flex items-center justify-end">
                    Amount Sought <ArrowUpDown className="ml-2 h-3 w-3" />
                  </div>
              </TableHead>
              <TableHead>Loan Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead 
                 className="cursor-pointer hover:bg-muted/50 transition-colors"
                 onClick={() => handleSort('dateAdded')} // Updated to use dateAdded from our type
              >
                  <div className="flex items-center">
                    Date Added <ArrowUpDown className="ml-2 h-3 w-3" />
                  </div>
              </TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length > 0 ? (
              clients.map((client) => {
                // Safely get the status text for display, default to 'N/A' or 'Unknown'
                const statusText = client.applicationStatus?.toLowerCase() || 'n/a';
                const statusVariant = getStatusBadgeVariant(client.applicationStatus);
                
                return (
                  <TableRow key={client.id} data-state="false"> 
                    <TableCell className="font-medium">
                      {/* Updated to use camelCase property names */}
                      {client.firstName || ''} {client.lastName || ''}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{client.email || '--'}</TableCell>
                    <TableCell className="text-muted-foreground">{client.phone || '--'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(client.loanAmountSought)}</TableCell>
                    <TableCell className="text-muted-foreground">{client.loanType || '--'}</TableCell>
                    <TableCell>
                      {/* Render badge only if variant is determined */}
                      {statusVariant && (
                        <Badge variant={statusVariant} className="capitalize">
                          {statusText}
                        </Badge>
                      )}
                      {!statusVariant && (
                         <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(client.dateAdded)}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/app/clients/${client.id}`} title="View Details">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No clients match your search or no clients added yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ClientList;
