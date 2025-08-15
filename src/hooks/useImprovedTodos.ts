import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { useActivityAndNotification } from './useActivityAndNotification';
import { useOptimisticListMutation } from './useOptimisticMutation';

export type TodoEntityType = 'client' | 'lender' | 'realtor' | 'opportunity' | 'loan' | 'person';
export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  due_date?: string;
  completed_at?: string;
  entity_type?: TodoEntityType;
  entity_id?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface NewTodo {
  title: string;
  description?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  due_date?: string;
  entity_type?: TodoEntityType;
  entity_id?: string;
  tags?: string[];
}

export interface TodosFilters {
  entityType?: TodoEntityType;
  entityId?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  search?: string;
  overdue?: boolean;
}

export function useImprovedTodos(filters?: TodosFilters) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { logActivityAndNotify } = useActivityAndNotification();

  const TODOS_QUERY_KEY = ['todos', filters] as const;

  // Fetch todos query with filtering and smart ordering
  const todosQuery = useQuery({
    queryKey: TODOS_QUERY_KEY,
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      let query = supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id);

      // Apply filters
      if (filters?.entityType && filters?.entityId) {
        query = query.eq('entity_type', filters.entityType).eq('entity_id', filters.entityId);
      } else if (filters?.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      let todos = data || [];

      // Client-side filtering for overdue
      if (filters?.overdue) {
        const now = new Date();
        todos = todos.filter(todo => 
          todo.due_date && 
          new Date(todo.due_date) < now && 
          todo.status !== 'completed'
        );
      }

      // Smart ordering: overdue first, then by priority, then by due date
      todos.sort((a, b) => {
        const now = new Date();
        const aOverdue = a.due_date && new Date(a.due_date) < now && a.status !== 'completed';
        const bOverdue = b.due_date && new Date(b.due_date) < now && b.status !== 'completed';
        
        // Overdue todos first
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        
        // Then by priority
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const aPriority = priorityOrder[a.priority as TodoPriority];
        const bPriority = priorityOrder[b.priority as TodoPriority];
        if (aPriority !== bPriority) return aPriority - bPriority;
        
        // Then by due date (earliest first)
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        if (a.due_date && !b.due_date) return -1;
        if (!a.due_date && b.due_date) return 1;
        
        // Finally by created date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      return todos;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Add todo mutation
  const addTodoMutation = useOptimisticListMutation(
    async (todoData: NewTodo) => {
      if (!user) throw new Error('User not authenticated');
      if (!todoData.title.trim()) throw new Error('Todo title is required');
      
      const { data, error } = await supabase
        .from('todos')
        .insert({
          user_id: user.id,
          ...todoData,
          title: todoData.title.trim(),
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Log activity if todo is attached to an entity
      if (todoData.entity_type && todoData.entity_id) {
        const activityData: any = {
          action_type: 'todo_added',
          description: `Todo added to ${todoData.entity_type}`,
          user_id: user.id,
          created_at: new Date().toISOString(),
          entity_type: todoData.entity_type,
          entity_id: todoData.entity_id,
          client_id: null,
          lender_id: null,
          document_id: null,
          opportunity_id: null,
          loan_id: null,
          people_id: null,
          realtor_id: null,
          id: undefined,
        };

        // Set the appropriate entity field
        switch (todoData.entity_type) {
          case 'client':
            activityData.client_id = todoData.entity_id;
            break;
          case 'lender':
            activityData.lender_id = todoData.entity_id;
            break;
          case 'realtor':
            activityData.realtor_id = todoData.entity_id;
            break;
          case 'opportunity':
            activityData.opportunity_id = todoData.entity_id;
            break;
          case 'loan':
            activityData.loan_id = todoData.entity_id;
            break;
          case 'person':
            activityData.people_id = todoData.entity_id;
            break;
        }

        await logActivityAndNotify(
          activityData,
          {
            user_id: user.id,
            type: 'todo_added',
            entity_id: todoData.entity_id,
            entity_type: todoData.entity_type,
            message: `A new todo was added to the ${todoData.entity_type}.`,
            read: false,
            created_at: new Date().toISOString(),
            id: undefined,
          }
        );
      }
      
      return data;
    },
    TODOS_QUERY_KEY,
    {
      addItem: (todoData) => ({
        id: `temp-${Date.now()}`,
        user_id: user?.id || '',
        title: todoData.title,
        description: todoData.description,
        status: todoData.status || 'pending',
        priority: todoData.priority || 'medium',
        due_date: todoData.due_date,
        completed_at: undefined,
        entity_type: todoData.entity_type,
        entity_id: todoData.entity_id,
        tags: todoData.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
      onSuccess: () => {
        toast({
          title: "Todo Added",
          description: "Todo has been added successfully.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error Adding Todo",
          description: error.message,
          variant: "destructive",
        });
      },
    }
  );

  // Update todo mutation
  const updateTodoMutation = useOptimisticListMutation(
    async ({ todoId, updates }: { todoId: string; updates: Partial<NewTodo> }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('todos')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', todoId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    TODOS_QUERY_KEY,
    {
      updateItem: ({ todoId, updates }) => ({ id: todoId, ...updates }),
      onSuccess: () => {
        toast({
          title: "Todo Updated",
          description: "Todo has been updated successfully.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error Updating Todo",
          description: error.message,
          variant: "destructive",
        });
      },
    }
  );

  // Delete todo mutation
  const deleteTodoMutation = useOptimisticListMutation(
    async (todoId: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', todoId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return todoId;
    },
    TODOS_QUERY_KEY,
    {
      removeItem: (todoId) => todoId,
      onSuccess: () => {
        toast({
          title: "Todo Deleted",
          description: "Todo has been deleted successfully.",
        });
      },
      onError: (error) => {
        toast({
          title: "Error Deleting Todo",
          description: error.message,
          variant: "destructive",
        });
      },
    }
  );

  return {
    // Data
    todos: todosQuery.data || [],
    
    // Loading states
    isLoading: todosQuery.isLoading,
    isAdding: addTodoMutation.isPending,
    isUpdating: updateTodoMutation.isPending,
    isDeleting: deleteTodoMutation.isPending,
    
    // Error states
    error: todosQuery.error,
    
    // Actions
    addTodo: (todoData: NewTodo) => addTodoMutation.mutate(todoData),
    updateTodo: (todoId: string, updates: Partial<NewTodo>) => 
      updateTodoMutation.mutate({ todoId, updates }),
    deleteTodo: (todoId: string) => deleteTodoMutation.mutate(todoId),
    
    // Utility
    refetch: todosQuery.refetch,
  };
}