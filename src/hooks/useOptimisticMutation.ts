import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { useCallback } from 'react';

interface OptimisticUpdateConfig<TData, TVariables> {
  queryKey: unknown[];
  updateFn: (oldData: TData | undefined, variables: TVariables) => TData;
  rollbackFn?: (oldData: TData | undefined, variables: TVariables) => TData;
}

export function useOptimisticMutation<TData, TError, TVariables, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  config: OptimisticUpdateConfig<TData, TVariables>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn' | 'onMutate' | 'onError' | 'onSettled'>
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: config.queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TData>(config.queryKey);

      // Optimistically update to the new value
      queryClient.setQueryData<TData>(config.queryKey, (old) => 
        config.updateFn(old, variables)
      );

      // Return a context object with the snapshotted value
      return { previousData, variables } as TContext;
    },
    onError: (error, variables, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(config.queryKey, context.previousData);
      }
      
      // Call custom onError if provided
      options?.onError?.(error, variables, context);
    },
    onSuccess: (data, variables, context) => {
      // Call custom onSuccess if provided
      options?.onSuccess?.(data, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: config.queryKey });
      
      // Call custom onSettled if provided
      options?.onSettled?.(data, error, variables, context);
    },
    ...options,
  });

  return mutation;
}

// Utility hook for list-based optimistic updates
export function useOptimisticListMutation<TItem, TError, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TItem>,
  queryKey: unknown[],
  options?: {
    addItem?: (variables: TVariables) => TItem;
    updateItem?: (oldItem: TItem, variables: TVariables) => TItem;
    removeItem?: (variables: TVariables) => boolean;
    findItem?: (item: TItem, variables: TVariables) => boolean;
  } & Omit<UseMutationOptions<TItem, TError, TVariables>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<TItem[]>(queryKey);

      queryClient.setQueryData<TItem[]>(queryKey, (old = []) => {
        if (options?.addItem) {
          return [...old, options.addItem(variables)];
        }
        if (options?.updateItem && options?.findItem) {
          return old.map(item => 
            options.findItem!(item, variables) 
              ? options.updateItem!(item, variables)
              : item
          );
        }
        if (options?.removeItem) {
          return old.filter(item => !options.removeItem!(variables));
        }
        return old;
      });

      return { previousData };
    },
    onError: (error, variables, context: any) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      options?.onError?.(error, variables, context);
    },
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      options?.onSettled?.();
    },
  });
}