import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Todo, NewTodo, TodoStatus, TodoPriority, TodoEntityType } from '@/hooks/useImprovedTodos';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  todo?: Todo;
  onSave: (todoData: NewTodo) => void;
  onUpdate?: (todoId: string, updates: Partial<NewTodo>) => void;
  isLoading?: boolean;
  defaultEntityType?: TodoEntityType;
  defaultEntityId?: string;
}

const TodoModal: React.FC<TodoModalProps> = ({
  isOpen,
  onClose,
  todo,
  onSave,
  onUpdate,
  isLoading = false,
  defaultEntityType,
  defaultEntityId,
}) => {
  const [formData, setFormData] = useState<NewTodo>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: undefined,
    entity_type: defaultEntityType,
    entity_id: defaultEntityId,
    tags: [],
  });
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (todo) {
      setFormData({
        title: todo.title,
        description: todo.description || '',
        status: todo.status,
        priority: todo.priority,
        due_date: todo.due_date,
        entity_type: todo.entity_type,
        entity_id: todo.entity_id,
        tags: todo.tags,
      });
      setDueDate(todo.due_date ? new Date(todo.due_date) : undefined);
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: undefined,
        entity_type: defaultEntityType,
        entity_id: defaultEntityId,
        tags: [],
      });
      setDueDate(undefined);
    }
  }, [todo, defaultEntityType, defaultEntityId, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const todoData = {
      ...formData,
      title: formData.title.trim(),
      due_date: dueDate ? dueDate.toISOString() : undefined,
    };

    if (todo && onUpdate) {
      onUpdate(todo.id, todoData);
    } else {
      onSave(todoData);
    }
    onClose();
  };

  const getPriorityColor = (priority: TodoPriority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-blue-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{todo ? 'Edit Todo' : 'Add New Todo'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter todo title..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add description (optional)..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: TodoStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: TodoPriority) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
                      Low
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
                      High
                    </span>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <span className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                      Urgent
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
                {dueDate && (
                  <div className="p-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDueDate(undefined)}
                      className="w-full"
                    >
                      Clear Date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entity Type</Label>
              <Select 
                value={formData.entity_type || 'standalone'} 
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  entity_type: value === 'standalone' ? undefined : value as TodoEntityType,
                  entity_id: value === 'standalone' ? undefined : formData.entity_id
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standalone">Standalone</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="lender">Lender</SelectItem>
                  <SelectItem value="realtor">Realtor</SelectItem>
                  <SelectItem value="opportunity">Opportunity</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                  <SelectItem value="person">Person</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.entity_type && (
              <div className="space-y-2">
                <Label>Entity ID</Label>
                <Input
                  value={formData.entity_id || ''}
                  onChange={(e) => setFormData({ ...formData, entity_id: e.target.value || undefined })}
                  placeholder="Entity UUID"
                  className="font-mono text-sm"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.title.trim() || isLoading}>
              {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
              {todo ? 'Update' : 'Add'} Todo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TodoModal;