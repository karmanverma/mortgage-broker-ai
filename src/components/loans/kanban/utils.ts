import type { Active, DataRef, Over } from "@dnd-kit/core";

type DraggableData = {
  [key in string]: any;
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

  if (data?.type === "Column" || data?.type === "Loan") {
    return true;
  }

  return false;
}