import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, DollarSign, MoreHorizontal } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { useImprovedLoans } from '@/hooks/useImprovedLoans';
import { Loan } from '@/hooks/useImprovedLoans';
import { LoanKanbanBoard } from '@/components/loans/kanban/LoanKanbanBoard';
import { AddLoanDialog } from '@/components/loans/AddLoanDialog';

const LoansPage = () => {
  const navigate = useNavigate();
  const { loans, isLoading, error, updateLoan } = useImprovedLoans();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [addLoanDialogOpen, setAddLoanDialogOpen] = useState(false);

  // Filter loans based on search and status
  const filteredLoans = loans.filter(loan => {
    const matchesSearch = searchTerm === '' || 
      loan.loan_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.property_address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || loan.loan_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group loans by status for kanban view
  const loansByStatus = {
    application: filteredLoans.filter(l => l.loan_status === 'application'),
    processing: filteredLoans.filter(l => l.loan_status === 'processing'),
    underwriting: filteredLoans.filter(l => l.loan_status === 'underwriting'),
    conditional_approval: filteredLoans.filter(l => l.loan_status === 'conditional_approval'),
    clear_to_close: filteredLoans.filter(l => l.loan_status === 'clear_to_close'),
    funded: filteredLoans.filter(l => l.loan_status === 'funded'),
    denied: filteredLoans.filter(l => l.loan_status === 'denied'),
  };

  const statusLabels = {
    application: 'Application',
    processing: 'Processing',
    underwriting: 'Underwriting',
    conditional_approval: 'Conditional Approval',
    clear_to_close: 'Clear to Close',
    funded: 'Funded',
    denied: 'Denied',
  };

  const statusColors = {
    application: 'bg-blue-100 text-blue-800',
    processing: 'bg-yellow-100 text-yellow-800',
    underwriting: 'bg-orange-100 text-orange-800',
    conditional_approval: 'bg-purple-100 text-purple-800',
    clear_to_close: 'bg-green-100 text-green-800',
    funded: 'bg-emerald-100 text-emerald-800',
    denied: 'bg-red-100 text-red-800',
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };

  const handleStatusChange = (loanId: string, newStatus: string) => {
    updateLoan({ id: loanId, updates: { loan_status: newStatus as any } });
  };

  const handleLoanClick = (loan: Loan) => {
    navigate(`/app/loans/${loan.id}`);
  };

  const LoanCard = ({ loan }: { loan: Loan }) => (
    <Card className="mb-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleLoanClick(loan)}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-sm">
            {loan.loan_number || 'Loan'}
          </h4>
          <Badge className={`text-xs ${statusColors[loan.loan_status as keyof typeof statusColors]}`}>
            {statusLabels[loan.loan_status as keyof typeof statusLabels]}
          </Badge>
        </div>
        
        <div className="space-y-1 text-xs text-muted-foreground">
          {loan.loan_number && <p>#{loan.loan_number}</p>}
          <p className="capitalize">{loan.loan_type} - {loan.loan_purpose}</p>
          {loan.loan_amount && (
            <p className="font-medium">${loan.loan_amount.toLocaleString()}</p>
          )}
          {loan.property_address && (
            <p className="truncate">{loan.property_address}</p>
          )}
          {loan.estimated_closing_date && (
            <p>Est. Close: {new Date(loan.estimated_closing_date).toLocaleDateString()}</p>
          )}
        </div>

        <div className="flex justify-between items-center mt-2">
          {loan.priority_level && (
            <Badge 
              className={`text-xs ${priorityColors[loan.priority_level as keyof typeof priorityColors]}`}
            >
              {loan.priority_level}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading loans...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-red-600">Error loading loans: {error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search loans..."
        filters={[
          {
            value: statusFilter,
            onValueChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All Statuses' },
              { value: 'application', label: 'Application' },
              { value: 'processing', label: 'Processing' },
              { value: 'underwriting', label: 'Underwriting' },
              { value: 'conditional_approval', label: 'Conditional Approval' },
              { value: 'clear_to_close', label: 'Clear to Close' },
              { value: 'funded', label: 'Funded' },
              { value: 'denied', label: 'Denied' }
            ],
            placeholder: 'Filter by status'
          }
        ]}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        viewOptions={['kanban', 'list']}
        onAddClick={() => setAddLoanDialogOpen(true)}
        addButtonText="Add Loan"
        addButtonIcon={<Plus className="h-4 w-4" />}
      />

      {/* Kanban Board */}
      {viewMode === 'kanban' && (
        <LoanKanbanBoard
          loans={filteredLoans}
          onStatusChange={handleStatusChange}
          onLoanClick={handleLoanClick}
        />
      )}

      {/* List View - Table Format like People page */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Est. Close</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No loans found. {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Add your first loan to get started.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLoans.map((loan) => (
                    <TableRow key={loan.id} className="cursor-pointer" onClick={() => handleLoanClick(loan)}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-primary">
                            {loan.loan_number || `Loan #${loan.id.slice(-6)}`}
                          </div>
                          {loan.property_address && (
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {loan.property_address}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          <div>{loan.loan_type}</div>
                          <div className="text-muted-foreground">{loan.loan_purpose}</div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {loan.loan_amount ? (
                          <div className="font-medium">${loan.loan_amount.toLocaleString()}</div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={statusColors[loan.loan_status as keyof typeof statusColors]}>
                          {statusLabels[loan.loan_status as keyof typeof statusLabels]}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        {loan.priority_level ? (
                          <Badge className={priorityColors[loan.priority_level as keyof typeof priorityColors]}>
                            {loan.priority_level}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {loan.estimated_closing_date ? (
                          <div className="text-sm">
                            {new Date(loan.estimated_closing_date).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleLoanClick(loan);
                            }}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              // Edit functionality
                            }}>
                              Edit Loan
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {filteredLoans.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No loans found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first loan'
              }
            </p>
            <Button onClick={() => setAddLoanDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Loan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Loan Dialog */}
      <AddLoanDialog
        open={addLoanDialogOpen}
        onOpenChange={setAddLoanDialogOpen}
      />
    </div>
  );
};

export default LoansPage;