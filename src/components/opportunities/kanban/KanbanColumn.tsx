import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { useDndContext, type UniqueIdentifier } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMemo } from "react";
import { cva } from "class-variance-authority";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { OpportunityCard } from "./OpportunityCard";
import { Opportunity } from "@/hooks/useImprovedOpportunities";

export interface Column {
  id: UniqueIdentifier;
  title: string;
  color?: string;
}

export type ColumnType = "Column";

export interface ColumnDragData {
  type: ColumnType;
  column: Column;
}

interface KanbanColumnProps {
  column: Column;
  opportunities: Opportunity[];
  isOverlay?: boolean;
  onOpportunityClick?: (opportunity: Opportunity) => void;
}

export function KanbanColumn({ 
  column, 
  opportunities, 
  isOverlay,
  onOpportunityClick 
}: KanbanColumnProps) {
  const opportunityIds = useMemo(() => {
    return opportunities.map((opportunity) => opportunity.id);
  }, [opportunities]);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    } satisfies ColumnDragData,
    attributes: {
      roleDescription: `Column: ${column.title}`,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const variants = cva(
    "h-[600px] max-h-[600px] w-[210px] max-w-full bg-muted/30 flex flex-col flex-shrink-0 snap-center",
    {
      variants: {
        dragging: {
          default: "border-2 border-transparent",
          over: "ring-2 opacity-30",
          overlay: "ring-2 ring-primary",
        },
      },
    }
  );

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={variants({
        dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
      })}
    >
      <CardHeader className="p-4 font-semibold border-b-2 text-left flex flex-row items-center justify-between">
        <Button
          variant="ghost"
          {...attributes}
          {...listeners}
          className="p-1 text-primary/50 -ml-2 h-auto cursor-grab relative hover:bg-secondary/50"
        >
          <span className="sr-only">{`Move column: ${column.title}`}</span>
          <GripVertical className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm font-medium">{column.title}</span>
          <Badge variant="secondary" className="text-xs">
            {opportunities.length}
          </Badge>
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-1">
        <CardContent className="flex flex-col gap-3 p-3">
          <SortableContext items={opportunityIds}>
            {opportunities.map((opportunity) => (
              <OpportunityCard 
                key={opportunity.id} 
                opportunity={opportunity}
                onClick={() => onOpportunityClick?.(opportunity)}
              />
            ))}
          </SortableContext>
          
          {opportunities.length === 0 && (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Drop opportunities here
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}

export function KanbanContainer({ children }: { children: React.ReactNode }) {
  const dndContext = useDndContext();

  const variations = cva("px-2 md:px-0 flex lg:justify-start pb-4", {
    variants: {
      dragging: {
        default: "snap-x snap-mandatory",
        active: "snap-none",
      },
    },
  });

  return (
    <ScrollArea
      className={variations({
        dragging: dndContext.active ? "active" : "default",
      })}
    >
      <div className="flex gap-4 items-start flex-row">
        {children}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}