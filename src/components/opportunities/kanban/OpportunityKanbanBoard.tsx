import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  useSensor,
  useSensors,
  KeyboardSensor,
  Announcements,
  UniqueIdentifier,
  TouchSensor,
  MouseSensor,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { KanbanColumn, KanbanContainer, type Column } from "./KanbanColumn";
import { OpportunityCard } from "./OpportunityCard";
import { hasDraggableData } from "./utils";
import { coordinateGetter } from "./multipleContainersKeyboardPreset";
import { Opportunity } from "@/hooks/useImprovedOpportunities";

// Define the opportunity stages as columns
const defaultColumns = [
  {
    id: "inquiry" as const,
    title: "New Lead",
    color: "bg-blue-100",
  },
  {
    id: "contacted" as const,
    title: "Contacted", 
    color: "bg-yellow-100",
  },
  {
    id: "qualified" as const,
    title: "Qualified",
    color: "bg-green-100",
  },
  {
    id: "nurturing" as const,
    title: "Nurturing",
    color: "bg-purple-100",
  },
  {
    id: "ready_to_apply" as const,
    title: "Ready to Apply",
    color: "bg-orange-100",
  },
  {
    id: "converted" as const,
    title: "Converted",
    color: "bg-emerald-100",
  },
  {
    id: "lost" as const,
    title: "Lost",
    color: "bg-red-100",
  },
] satisfies Column[];

export type OpportunityStage = (typeof defaultColumns)[number]["id"];

interface OpportunityKanbanBoardProps {
  opportunities: Opportunity[];
  onStageChange: (opportunityId: string, newStage: string) => void;
  onOpportunityClick?: (opportunity: Opportunity) => void;
}

export function OpportunityKanbanBoard({ 
  opportunities, 
  onStageChange,
  onOpportunityClick 
}: OpportunityKanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const pickedUpOpportunityColumn = useRef<OpportunityStage | null>(null);
  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeOpportunity, setActiveOpportunity] = useState<Opportunity | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: coordinateGetter,
    })
  );

  // Group opportunities by stage
  const opportunitiesByStage = useMemo(() => {
    const grouped: Record<string, Opportunity[]> = {};
    
    columns.forEach(column => {
      grouped[column.id as string] = opportunities.filter(
        opportunity => opportunity.stage === column.id
      );
    });
    
    return grouped;
  }, [opportunities, columns]);

  function getDraggingOpportunityData(opportunityId: UniqueIdentifier, columnId: OpportunityStage) {
    const opportunitiesInColumn = opportunitiesByStage[columnId] || [];
    const opportunityPosition = opportunitiesInColumn.findIndex((opportunity) => opportunity.id === opportunityId);
    const column = columns.find((col) => col.id === columnId);
    return {
      opportunitiesInColumn,
      opportunityPosition,
      column,
    };
  }

  const announcements: Announcements = {
    onDragStart({ active }) {
      if (!hasDraggableData(active)) return;
      if (active.data.current?.type === "Column") {
        const startColumnIdx = columnsId.findIndex((id) => id === active.id);
        const startColumn = columns[startColumnIdx];
        return `Picked up Column ${startColumn?.title} at position: ${
          startColumnIdx + 1
        } of ${columnsId.length}`;
      } else if (active.data.current?.type === "Opportunity") {
        pickedUpOpportunityColumn.current = active.data.current.opportunity.stage;
        const { opportunitiesInColumn, opportunityPosition, column } = getDraggingOpportunityData(
          active.id,
          pickedUpOpportunityColumn.current
        );
        return `Picked up Opportunity ${
          active.data.current.opportunity.people?.first_name
        } ${
          active.data.current.opportunity.people?.last_name
        } at position: ${opportunityPosition + 1} of ${
          opportunitiesInColumn.length
        } in column ${column?.title}`;
      }
    },
    onDragOver({ active, over }) {
      if (!hasDraggableData(active) || !hasDraggableData(over)) return;

      if (
        active.data.current?.type === "Column" &&
        over.data.current?.type === "Column"
      ) {
        const overColumnIdx = columnsId.findIndex((id) => id === over.id);
        return `Column ${active.data.current.column.title} was moved over ${
          over.data.current.column.title
        } at position ${overColumnIdx + 1} of ${columnsId.length}`;
      } else if (
        active.data.current?.type === "Opportunity" &&
        over.data.current?.type === "Opportunity"
      ) {
        const { opportunitiesInColumn, opportunityPosition, column } = getDraggingOpportunityData(
          over.id,
          over.data.current.opportunity.stage
        );
        if (over.data.current.opportunity.stage !== pickedUpOpportunityColumn.current) {
          return `Opportunity ${
            active.data.current.opportunity.people?.first_name
          } ${
            active.data.current.opportunity.people?.last_name
          } was moved over column ${column?.title} in position ${
            opportunityPosition + 1
          } of ${opportunitiesInColumn.length}`;
        }
        return `Opportunity was moved over position ${opportunityPosition + 1} of ${
          opportunitiesInColumn.length
        } in column ${column?.title}`;
      }
    },
    onDragEnd({ active, over }) {
      if (!hasDraggableData(active) || !hasDraggableData(over)) {
        pickedUpOpportunityColumn.current = null;
        return;
      }
      if (
        active.data.current?.type === "Column" &&
        over.data.current?.type === "Column"
      ) {
        const overColumnPosition = columnsId.findIndex((id) => id === over.id);
        return `Column ${
          active.data.current.column.title
        } was dropped into position ${overColumnPosition + 1} of ${
          columnsId.length
        }`;
      } else if (
        active.data.current?.type === "Opportunity" &&
        over.data.current?.type === "Opportunity"
      ) {
        const { opportunitiesInColumn, opportunityPosition, column } = getDraggingOpportunityData(
          over.id,
          over.data.current.opportunity.stage
        );
        if (over.data.current.opportunity.stage !== pickedUpOpportunityColumn.current) {
          return `Opportunity was dropped into column ${column?.title} in position ${
            opportunityPosition + 1
          } of ${opportunitiesInColumn.length}`;
        }
        return `Opportunity was dropped into position ${opportunityPosition + 1} of ${
          opportunitiesInColumn.length
        } in column ${column?.title}`;
      }
      pickedUpOpportunityColumn.current = null;
    },
    onDragCancel({ active }) {
      pickedUpOpportunityColumn.current = null;
      if (!hasDraggableData(active)) return;
      return `Dragging ${active.data.current?.type} cancelled.`;
    },
  };

  return (
    <DndContext
      accessibility={{
        announcements,
      }}
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
    >
      <KanbanContainer>
        <SortableContext items={columnsId}>
          {columns.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              opportunities={opportunitiesByStage[col.id as string] || []}
              onOpportunityClick={onOpportunityClick}
            />
          ))}
        </SortableContext>
      </KanbanContainer>

      {"document" in window &&
        createPortal(
          <DragOverlay>
            {activeColumn && (
              <KanbanColumn
                isOverlay
                column={activeColumn}
                opportunities={opportunitiesByStage[activeColumn.id as string] || []}
              />
            )}
            {activeOpportunity && <OpportunityCard opportunity={activeOpportunity} isOverlay />}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  );

  function onDragStart(event: DragStartEvent) {
    if (!hasDraggableData(event.active)) return;
    const data = event.active.data.current;
    if (data?.type === "Column") {
      setActiveColumn(data.column);
      return;
    }

    if (data?.type === "Opportunity") {
      setActiveOpportunity(data.opportunity);
      return;
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null);
    setActiveOpportunity(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (!hasDraggableData(active)) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeId === overId) return;

    const isActiveAColumn = activeData?.type === "Column";
    const isActiveAnOpportunity = activeData?.type === "Opportunity";

    // Handle column reordering
    if (isActiveAColumn) {
      setColumns((columns) => {
        const activeColumnIndex = columns.findIndex((col) => col.id === activeId);
        const overColumnIndex = columns.findIndex((col) => col.id === overId);
        return arrayMove(columns, activeColumnIndex, overColumnIndex);
      });
      return;
    }

    // Handle opportunity stage change
    if (isActiveAnOpportunity && hasDraggableData(over)) {
      const activeOpportunity = activeData.opportunity;
      let newStage: string | null = null;

      // Determine the new stage based on what we're dropping over
      if (overData?.type === "Opportunity") {
        newStage = overData.opportunity.stage;
      } else if (overData?.type === "Column") {
        newStage = overData.column.id as string;
      }

      // Only update if the stage actually changed
      if (newStage && activeOpportunity.stage !== newStage) {
        onStageChange(activeOpportunity.id, newStage);
      }
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    if (!hasDraggableData(active) || !hasDraggableData(over)) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    const isActiveAnOpportunity = activeData?.type === "Opportunity";
    const isOverAnOpportunity = overData?.type === "Opportunity";

    if (!isActiveAnOpportunity) return;

    // We'll handle the stage change in onDragEnd instead of onDragOver
    // This prevents multiple API calls during dragging
  }
}