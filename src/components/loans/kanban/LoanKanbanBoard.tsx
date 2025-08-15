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
import { LoanKanbanColumn, LoanKanbanContainer, type Column } from "./LoanKanbanColumn";
import { LoanCard } from "./LoanCard";
import { hasDraggableData } from "./utils";
import { coordinateGetter } from "./multipleContainersKeyboardPreset";
import { Loan } from "@/hooks/useImprovedLoans";

// Define the loan statuses as columns
const defaultColumns = [
  {
    id: "application" as const,
    title: "Application",
    color: "bg-blue-100",
  },
  {
    id: "processing" as const,
    title: "Processing", 
    color: "bg-yellow-100",
  },
  {
    id: "underwriting" as const,
    title: "Underwriting",
    color: "bg-orange-100",
  },
  {
    id: "conditional_approval" as const,
    title: "Conditional Approval",
    color: "bg-purple-100",
  },
  {
    id: "clear_to_close" as const,
    title: "Clear to Close",
    color: "bg-green-100",
  },
  {
    id: "funded" as const,
    title: "Funded",
    color: "bg-emerald-100",
  },
  {
    id: "denied" as const,
    title: "Denied",
    color: "bg-red-100",
  },
] satisfies Column[];

export type LoanStatus = (typeof defaultColumns)[number]["id"];

interface LoanKanbanBoardProps {
  loans: Loan[];
  onStatusChange: (loanId: string, newStatus: string) => void;
  onLoanClick?: (loan: Loan) => void;
}

export function LoanKanbanBoard({ 
  loans, 
  onStatusChange,
  onLoanClick 
}: LoanKanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const pickedUpLoanColumn = useRef<LoanStatus | null>(null);
  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeLoan, setActiveLoan] = useState<Loan | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: coordinateGetter,
    })
  );

  // Group loans by status
  const loansByStatus = useMemo(() => {
    const grouped: Record<string, Loan[]> = {};
    
    columns.forEach(column => {
      grouped[column.id as string] = loans.filter(
        loan => loan.loan_status === column.id
      );
    });
    
    return grouped;
  }, [loans, columns]);

  function getDraggingLoanData(loanId: UniqueIdentifier, columnId: LoanStatus) {
    const loansInColumn = loansByStatus[columnId] || [];
    const loanPosition = loansInColumn.findIndex((loan) => loan.id === loanId);
    const column = columns.find((col) => col.id === columnId);
    return {
      loansInColumn,
      loanPosition,
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
      } else if (active.data.current?.type === "Loan") {
        pickedUpLoanColumn.current = active.data.current.loan.loan_status;
        const { loansInColumn, loanPosition, column } = getDraggingLoanData(
          active.id,
          pickedUpLoanColumn.current
        );
        return `Picked up Loan ${
          active.data.current.loan.clients?.people?.first_name
        } ${
          active.data.current.loan.clients?.people?.last_name
        } at position: ${loanPosition + 1} of ${
          loansInColumn.length
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
        active.data.current?.type === "Loan" &&
        over.data.current?.type === "Loan"
      ) {
        const { loansInColumn, loanPosition, column } = getDraggingLoanData(
          over.id,
          over.data.current.loan.loan_status
        );
        if (over.data.current.loan.loan_status !== pickedUpLoanColumn.current) {
          return `Loan ${
            active.data.current.loan.clients?.people?.first_name
          } ${
            active.data.current.loan.clients?.people?.last_name
          } was moved over column ${column?.title} in position ${
            loanPosition + 1
          } of ${loansInColumn.length}`;
        }
        return `Loan was moved over position ${loanPosition + 1} of ${
          loansInColumn.length
        } in column ${column?.title}`;
      }
    },
    onDragEnd({ active, over }) {
      if (!hasDraggableData(active) || !hasDraggableData(over)) {
        pickedUpLoanColumn.current = null;
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
        active.data.current?.type === "Loan" &&
        over.data.current?.type === "Loan"
      ) {
        const { loansInColumn, loanPosition, column } = getDraggingLoanData(
          over.id,
          over.data.current.loan.loan_status
        );
        if (over.data.current.loan.loan_status !== pickedUpLoanColumn.current) {
          return `Loan was dropped into column ${column?.title} in position ${
            loanPosition + 1
          } of ${loansInColumn.length}`;
        }
        return `Loan was dropped into position ${loanPosition + 1} of ${
          loansInColumn.length
        } in column ${column?.title}`;
      }
      pickedUpLoanColumn.current = null;
    },
    onDragCancel({ active }) {
      pickedUpLoanColumn.current = null;
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
      <LoanKanbanContainer>
        <SortableContext items={columnsId}>
          {columns.map((col) => (
            <LoanKanbanColumn
              key={col.id}
              column={col}
              loans={loansByStatus[col.id as string] || []}
              onLoanClick={onLoanClick}
            />
          ))}
        </SortableContext>
      </LoanKanbanContainer>

      {"document" in window &&
        createPortal(
          <DragOverlay>
            {activeColumn && (
              <LoanKanbanColumn
                isOverlay
                column={activeColumn}
                loans={loansByStatus[activeColumn.id as string] || []}
              />
            )}
            {activeLoan && <LoanCard loan={activeLoan} isOverlay />}
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

    if (data?.type === "Loan") {
      setActiveLoan(data.loan);
      return;
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null);
    setActiveLoan(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (!hasDraggableData(active)) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeId === overId) return;

    const isActiveAColumn = activeData?.type === "Column";
    const isActiveALoan = activeData?.type === "Loan";

    // Handle column reordering
    if (isActiveAColumn) {
      setColumns((columns) => {
        const activeColumnIndex = columns.findIndex((col) => col.id === activeId);
        const overColumnIndex = columns.findIndex((col) => col.id === overId);
        return arrayMove(columns, activeColumnIndex, overColumnIndex);
      });
      return;
    }

    // Handle loan status change
    if (isActiveALoan && hasDraggableData(over)) {
      const activeLoan = activeData.loan;
      let newStatus: string | null = null;

      // Determine the new status based on what we're dropping over
      if (overData?.type === "Loan") {
        newStatus = overData.loan.loan_status;
      } else if (overData?.type === "Column") {
        newStatus = overData.column.id as string;
      }

      // Only update if the status actually changed
      if (newStatus && activeLoan.loan_status !== newStatus) {
        onStatusChange(activeLoan.id, newStatus);
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

    const isActiveALoan = activeData?.type === "Loan";

    if (!isActiveALoan) return;

    // We'll handle the status change in onDragEnd instead of onDragOver
    // This prevents multiple API calls during dragging
  }
}