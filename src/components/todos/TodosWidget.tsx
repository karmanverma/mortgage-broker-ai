import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useImprovedTodos, Todo, TodoEntityType } from '@/hooks/useImprovedTodos';
import { Plus, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, isAfter } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface TodosWidgetProps {
  entityType?: TodoEntityType;
  entityId?: string;
  showHeader?: boolean;
  maxItems?: number;
}

const TodosWidget: React.FC<TodosWidgetProps> = ({ 
  entityType, 
  entityId, 
  showHeader = true,
  maxItems = 6 
}) => {
  const navigate = useNavigate();
  const filters = entityType && entityId ? { entityType, entityId } : undefined;
  const { todos, isLoading, updateTodo } = useImprovedTodos(filters);

  const displayTodos = todos.slice(0, maxItems);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const isOverdue = (todo: Todo) => {
    return todo.due_date && 
           isAfter(new Date(), new Date(todo.due_date)) && 
           todo.status !== 'completed';
  };

  const handleToggleComplete = (todo: Todo) => {
    const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
    updateTodo(todo.id, { status: newStatus });
  };

  const handleOpenTodosPage = () => {
    const params = new URLSearchParams();
    if (entityType) params.set('entityType', entityType);
    if (entityId) params.set('entityId', entityId);
    navigate(`/app/todos?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <Card className="h-64">
        <CardContent className="flex items-center justify-center h-full">
          <LoadingSpinner size="md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-64 flex flex-col">
      {showHeader && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">To-dos</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenTodosPage}
              className="h-6 w-6 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
      )}
      
      <CardContent className="flex-1 pt-0">
        <ScrollArea className="h-full">
          {displayTodos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-sm text-muted-foreground">No todos yet</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenTodosPage}
                className="mt-2 text-xs"
              >
                Add your first todo
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {displayTodos.map((todo) => (
                <div
                  key={todo.id}
                  className={cn(
                    "flex items-start space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors",
                    isOverdue(todo) && "bg-red-50 border border-red-200"
                  )}
                >
                  <Checkbox
                    checked={todo.status === 'completed'}
                    onCheckedChange={() => handleToggleComplete(todo)}
                    className="mt-0.5"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-1 mb-1">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          getPriorityColor(todo.priority)
                        )}
                      />
                      {isOverdue(todo) && (
                        <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                    
                    <p
                      className={cn(
                        "text-xs font-medium leading-tight",
                        todo.status === 'completed' && "line-through text-muted-foreground"
                      )}
                    >
                      {todo.title}
                    </p>
                    
                    {todo.due_date && (
                      <div className="flex items-center mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground mr-1" />
                        <span
                          className={cn(
                            "text-xs",
                            isOverdue(todo) ? "text-red-600 font-medium" : "text-muted-foreground"
                          )}
                        >
                          {formatDistanceToNow(new Date(todo.due_date), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {todos.length > maxItems && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenTodosPage}
                  className="w-full text-xs mt-2"
                >
                  View all {todos.length} todos
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TodosWidget;