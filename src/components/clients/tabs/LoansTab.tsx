import React, { useState } from 'react';
import { TrendingUp, Plus, Eye, Edit, Trash2, Calendar, DollarSign, Building, User, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useImprovedLoans } from '@/hooks/useImprovedLoans';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AddLoanDialog } from '@/components/loans/AddLoanDialog';
import { format } from 'date-fns';

interface LoansTabProps {
  clientId: string;
  clientType: string;
}

const formatCurrency = (amount: number | null | undefined) => {
  if (amount == null) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const formatDate = (date: string | null | undefined) => {
  if (!date) return 'N/A';
  try {
    return format(new Date(date), 'MMM dd, yyyy');
  } catch {
    return 'Invalid Date';
  }
};

const getStatusVariant = (status: string | null | undefined) => {
  switch (status?.toLowerCase()) {
    case 'application': return 'secondary';
    case 'processing': return 'default';
    case 'underwriting': return 'outline';
    case 'approved': return 'default';
    case 'funded': return 'default';
    case 'closed': return 'default';
    case 'denied': return 'destructive';
    case 'cancelled': return 'destructive';
    default: return 'secondary';
  }
};

export const LoansTab: React.FC<LoansTabProps> = ({ clientId, clientType }) => {
  const { loans, isLoading, addLoan, updateLoan, deleteLoan, isAdding } = useImprovedLoans({ clientId });
  const [showAddDialog, setShowAddDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Loan Pipeline</h3>
          <p className="text-sm text-muted-foreground">
            Track active and historical loans for this {clientType} client
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} disabled={isAdding}>
          <Plus className="h-4 w-4 mr-2" />
          {isAdding ? 'Adding...' : 'Add Loan'}
        </Button>
      </div>

      {/* Loans List */}
      {loans.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-medium mb-2">No Loans Yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              Start tracking loans for this client to manage your loan pipeline effectively.
            </p>
            <Button onClick={() => setShowAddDialog(true)} disabled={isAdding}>
              <Plus className="h-4 w-4 mr-2" />
              {isAdding ? 'Adding...' : 'Create First Loan'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {loans.map((loan) => (
            <Card key={loan.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {loan.loan_number || `Loan #${loan.id.slice(-8)}`}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(loan.loan_status)}>
                        {loan.loan_status?.replace('_', ' ').toUpperCase() || 'APPLICATION'}
                      </Badge>
                      {loan.priority_level && (
                        <Badge variant="outline">
                          {loan.priority_level.toUpperCase()} PRIORITY
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Loan Amount</p>
                      <p className="font-medium">
                        {formatCurrency(loan.loan_amount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Interest Rate</p>
                      <p className="font-medium">
                        {loan.interest_rate ? `${loan.interest_rate}%` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Est. Closing</p>
                      <p className="font-medium">
                        {formatDate(loan.estimated_closing_date)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {(loan.lenders?.name || loan.property_address) && (
                  <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loan.lenders?.name && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Lender</p>
                          <p className="font-medium">{loan.lenders.name}</p>
                        </div>
                      </div>
                    )}
                    {loan.property_address && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Property</p>
                          <p className="font-medium">{loan.property_address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {loan.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="text-sm">{loan.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <AddLoanDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        preselectedClientId={clientId}
      />
    </div>
  );
};