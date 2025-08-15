import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cva } from "class-variance-authority";
import { GripVertical, DollarSign, MapPin, Calendar, Building, AlertTriangle, User } from "lucide-react";
import { Loan } from "@/hooks/useImprovedLoans";

export type LoanType = "Loan";

export interface LoanDragData {
  type: LoanType;
  loan: Loan;
}

interface LoanCardProps {
  loan: Loan;
  isOverlay?: boolean;
  onClick?: () => void;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-blue-100 text-blue-800', 
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const loanTypeLabels = {
  conventional: 'Conventional',
  fha: 'FHA',
  va: 'VA',
  usda: 'USDA',
  jumbo: 'Jumbo',
  commercial: 'Commercial',
  hard_money: 'Hard Money',
};

const loanPurposeLabels = {
  purchase: 'Purchase',
  refinance: 'Refinance',
  cash_out_refinance: 'Cash-Out Refi',
  investment: 'Investment',
};

export function LoanCard({ loan, isOverlay, onClick }: LoanCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: loan.id,
    data: {
      type: "Loan",
      loan,
    } satisfies LoanDragData,
    attributes: {
      roleDescription: "Loan",
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const variants = cva("cursor-pointer", {
    variants: {
      dragging: {
        over: "ring-2 opacity-30",
        overlay: "ring-2 ring-primary",
      },
    },
  });

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger onClick if clicking on the drag handle
    if ((e.target as HTMLElement).closest('[data-drag-handle]')) {
      return;
    }
    onClick?.();
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={variants({
        dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
      })}
      onClick={handleCardClick}
    >
      <CardHeader className="px-3 py-3 flex flex-row items-center justify-between border-b-2 border-secondary relative">
        <Button
          variant="ghost"
          {...attributes}
          {...listeners}
          data-drag-handle
          className="p-1 text-secondary-foreground/50 -ml-2 h-auto cursor-grab hover:bg-secondary/50"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="sr-only">Move loan</span>
          <GripVertical className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          {loan.priority_level && (
            <Badge 
              className={`text-xs ${priorityColors[loan.priority_level as keyof typeof priorityColors]}`}
            >
              {loan.priority_level === 'urgent' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {loan.priority_level}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="px-3 pt-3 pb-4 space-y-3">
        {/* Client Name */}
        <div>
          <h4 className="font-semibold text-sm leading-tight">
            {loan.clients?.people?.first_name} {loan.clients?.people?.last_name}
          </h4>
          {loan.loan_number && (
            <p className="text-xs text-muted-foreground mt-1">
              #{loan.loan_number}
            </p>
          )}
        </div>

        {/* Loan Type & Purpose */}
        <div className="flex gap-1 flex-wrap">
          <Badge variant="outline" className="text-xs font-medium">
            {loanTypeLabels[loan.loan_type as keyof typeof loanTypeLabels] || loan.loan_type}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {loanPurposeLabels[loan.loan_purpose as keyof typeof loanPurposeLabels] || loan.loan_purpose}
          </Badge>
        </div>

        {/* Key Details */}
        <div className="space-y-2 text-xs text-muted-foreground">
          {loan.loan_amount && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-green-600" />
              <span className="font-medium">${loan.loan_amount.toLocaleString()}</span>
            </div>
          )}
          
          {loan.property_address && (
            <div className="flex items-start gap-1">
              <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-600" />
              <span className="leading-tight overflow-hidden text-ellipsis">{loan.property_address}</span>
            </div>
          )}
          
          {loan.estimated_closing_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-orange-600" />
              <span>Est. Close: {new Date(loan.estimated_closing_date).toLocaleDateString()}</span>
            </div>
          )}

          {loan.lenders?.name && (
            <div className="flex items-center gap-1">
              <Building className="h-3 w-3 text-purple-600" />
              <span className="truncate">{loan.lenders.name}</span>
            </div>
          )}
        </div>

        {/* Interest Rate & LTV */}
        <div className="flex justify-between items-center text-xs">
          {loan.interest_rate && (
            <span className="text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
              {loan.interest_rate}% APR
            </span>
          )}
          {loan.loan_to_value_ratio && (
            <span className="font-medium text-primary">
              {loan.loan_to_value_ratio}% LTV
            </span>
          )}
        </div>

        {/* Opportunity Link */}
        {loan.opportunities && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="truncate">From: {loan.opportunities.people?.first_name} {loan.opportunities.people?.last_name}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}