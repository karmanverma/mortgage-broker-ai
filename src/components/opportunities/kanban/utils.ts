import { Active, DataRef, Over } from "@dnd-kit/core";

type DraggableData = {
  type: "Column" | "Opportunity";
  column?: any;
  opportunity?: any;
};

export function hasDraggableData<T extends Active | Over>(
  entry: T | null | undefined
): entry is T & {
  data: DataRef<DraggableData>;
} {
  if (!entry) {
    return false;
  }

  const data = entry.data.current;

  if (data?.type === "Column" || data?.type === "Opportunity") {
    return true;
  }

  return false;
}