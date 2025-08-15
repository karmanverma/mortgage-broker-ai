import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cva } from "class-variance-authority";
import { GripVertical, DollarSign, MapPin, Calendar, AlertTriangle } from "lucide-react";
import { Opportunity } from "@/hooks/useImprovedOpportunities";

export type OpportunityType = "Opportunity";

export interface OpportunityDragData {
  type: OpportunityType;
  opportunity: Opportunity;
}

interface OpportunityCardProps {
  opportunity: Opportunity;
  isOverlay?: boolean;
  onClick?: () => void;
}

const urgencyColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800', 
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const opportunityTypeLabels = {
  residential_purchase: 'Residential Purchase',
  residential_refinance: 'Residential Refinance',
  commercial_purchase: 'Commercial Purchase', 
  commercial_refinance: 'Commercial Refinance',
  investment_property: 'Investment Property',
};

export function OpportunityCard({ opportunity, isOverlay, onClick }: OpportunityCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: opportunity.id,
    data: {
      type: "Opportunity",
      opportunity,
    } satisfies OpportunityDragData,
    attributes: {
      roleDescription: "Opportunity",
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
          <span className="sr-only">Move opportunity</span>
          <GripVertical className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          {opportunity.urgency_level && (
            <Badge 
              className={`text-xs ${urgencyColors[opportunity.urgency_level as keyof typeof urgencyColors]}`}
            >
              {opportunity.urgency_level === 'urgent' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {opportunity.urgency_level}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="px-3 pt-3 pb-4 space-y-3">
        {/* Contact Name */}
        <div>
          <h4 className="font-semibold text-sm leading-tight">
            {opportunity.people?.first_name} {opportunity.people?.last_name}
          </h4>
          {opportunity.people?.company_name && (
            <p className="text-xs text-muted-foreground mt-1">
              {opportunity.people.company_name}
            </p>
          )}
        </div>

        {/* Opportunity Type */}
        <div>
          <Badge variant="outline" className="text-xs font-medium">
            {opportunityTypeLabels[opportunity.opportunity_type as keyof typeof opportunityTypeLabels] || opportunity.opportunity_type}
          </Badge>
        </div>

        {/* Key Details */}
        <div className="space-y-2 text-xs text-muted-foreground">
          {opportunity.estimated_loan_amount && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3 text-green-600" />
              <span className="font-medium">${opportunity.estimated_loan_amount.toLocaleString()}</span>
            </div>
          )}
          
          {opportunity.property_address && (
            <div className="flex items-start gap-1">
              <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-600" />
              <span className="leading-tight overflow-hidden text-ellipsis">{opportunity.property_address}</span>
            </div>
          )}
          
          {opportunity.expected_close_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-orange-600" />
              <span>{new Date(opportunity.expected_close_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Lead Source & Probability */}
        <div className="flex justify-between items-center text-xs">
          {opportunity.lead_source && (
            <span className="text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
              {opportunity.lead_source}
            </span>
          )}
          {opportunity.probability_percentage && (
            <span className="font-medium text-primary">
              {opportunity.probability_percentage}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}