import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useImprovedTodos, Todo, TodoStatus, TodoPriority, TodoEntityType } from '@/hooks/useImprovedTodos';
import { Search, Plus, Filter, Grid, List, Clock, AlertCircle, Trash2, Edit } from 'lucide-react';
import { formatDistanceToNow, format, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';
import TodoModal from '@/components/todos/TodoModal';

const TodosPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TodoStatus | ''>('all');
  const [selectedPriority, setSelectedPriority] = useState<TodoPriority | ''>('all');
  const [selectedEntityType, setSelectedEntityType] = useState<TodoEntityType | ''>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [showModalFor, setShowModalFor] = useState<Todo | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Get initial filters from URL params
  useEffect(() => {
    const entityType = searchParams.get('entityType') as TodoEntityType;
    const entityId = searchParams.get('entityId');
    if (entityType) {
      setSelectedEntityType(entityType);
    }
  }, [searchParams]);

  const filters = {
    search: searchTerm || undefined,
    status: selectedStatus && selectedStatus !== 'all' ? selectedStatus : undefined,
    priority: selectedPriority && selectedPriority !== 'all' ? selectedPriority : undefined,
    entityType: selectedEntityType && selectedEntityType !== 'all' ? selectedEntityType : undefined,
    entityId: searchParams.get('entityId') || undefined,
    overdue: showOverdueOnly || undefined,
  };

  const {
    todos,
    isLoading,
    isAdding,
    isUpdating,
    isDeleting,
    addTodo,
    updateTodo,
    deleteTodo,
  } = useImprovedTodos(filters);

  const getPriorityColor = (priority: TodoPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityBadgeColor = (priority: TodoPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status: TodoStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const handleEditTodo = (todo: Todo) => {
    setShowModalFor(todo);
  };

  const handleDeleteTodo = (todoId: string) => {
    if (confirm('Are you sure you want to delete this todo?')) {
      deleteTodo(todoId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const TodoCard = ({ todo }: { todo: Todo }) => (
    <Card className={cn(
      "transition-all hover:shadow-md",
      isOverdue(todo) && "border-red-200 bg-red-50",
      todo.status === 'completed' && "opacity-75"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            checked={todo.status === 'completed'}
            onCheckedChange={() => handleToggleComplete(todo)}
            className="mt-1"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <div
                className={cn(
                  "w-3 h-3 rounded-full flex-shrink-0",
                  getPriorityColor(todo.priority)
                )}
              />
              {isOverdue(todo) && (
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              )}
            </div>
            
            <h3
              className={cn(
                "font-medium mb-1",
                todo.status === 'completed' && "line-through text-muted-foreground"
              )}
            >
              {todo.title}
            </h3>
            
            {todo.description && (
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {todo.description}
              </p>
            )}
            
            <div className="flex flex-wrap gap-1 mb-2">
              <Badge className={getPriorityBadgeColor(todo.priority)}>
                {todo.priority}
              </Badge>
              <Badge className={getStatusBadgeColor(todo.status)}>
                {todo.status.replace('_', ' ')}
              </Badge>
              {todo.entity_type && (
                <Badge variant="outline">
                  {todo.entity_type}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {todo.due_date && (
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span
                    className={cn(
                      isOverdue(todo) && "text-red-600 font-medium"
                    )}
                  >
                    {formatDistanceToNow(new Date(todo.due_date), { addSuffix: true })}
                  </span>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleEditTodo(todo)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteTodo(todo.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">To-dos</h1>
          <p className="text-muted-foreground">Manage your tasks and deadlines</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Todo
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search todos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as TodoStatus | '')}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedPriority} onValueChange={(value) => setSelectedPriority(value as TodoPriority | '')}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedEntityType} onValueChange={(value) => setSelectedEntityType(value as TodoEntityType | '')}>
              <SelectTrigger>
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="client">Clients</SelectItem>
                <SelectItem value="lender">Lenders</SelectItem>
                <SelectItem value="realtor">Realtors</SelectItem>
                <SelectItem value="opportunity">Opportunities</SelectItem>
                <SelectItem value="loan">Loans</SelectItem>
                <SelectItem value="person">People</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex space-x-2">
              <Button
                variant={showOverdueOnly ? "default" : "outline"}
                onClick={() => setShowOverdueOnly(!showOverdueOnly)}
                className="flex-1"
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                Overdue
              </Button>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'list' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-r-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Todos List/Grid */}
      <div className={cn(
        viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          : "space-y-4"
      )}>
        {todos.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No todos found matching your criteria.</p>
              <Button onClick={() => setShowAddModal(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Todo
              </Button>
            </CardContent>
          </Card>
        ) : (
          todos.map((todo) => <TodoCard key={todo.id} todo={todo} />)
        )}
      </div>

      {/* Add Todo Modal */}
      <TodoModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={addTodo}
        isLoading={isAdding}
        defaultEntityType={selectedEntityType && selectedEntityType !== 'all' ? selectedEntityType : undefined}
        defaultEntityId={searchParams.get('entityId') || undefined}
      />

      {/* Edit Todo Modal */}
      <TodoModal
        isOpen={!!showModalFor}
        onClose={() => setShowModalFor(null)}
        todo={showModalFor || undefined}
        onSave={addTodo}
        onUpdate={updateTodo}
        isLoading={isUpdating}
      />
    </div>
  );
};

export default TodosPage;