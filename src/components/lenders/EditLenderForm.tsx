import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLenders } from "@/hooks/useLenders";
import { toast } from "@/components/ui/use-toast";
import { Tables } from "@/integrations/supabase/types";

type Lender = Tables<'lenders'>;

interface EditLenderFormProps {
  isOpen: boolean;
  onClose: () => void;
  lenderTypes: string[];
  statusOptions: string[];
  lender: Lender | null;
}

export const EditLenderForm = ({
  isOpen,
  onClose,
  lenderTypes,
  statusOptions,
  lender,
}: EditLenderFormProps) => {
  const [editedLender, setEditedLender] = useState<Lender | null>(null);
  const { updateLender } = useLenders();
  
  // Initialize form with lender data when modal opens
  useEffect(() => {
    if (isOpen && lender) {
      setEditedLender({...lender});
    }
  }, [isOpen, lender]);

  const handleSave = async () => {
    if (!editedLender) return;
    
    if (!editedLender.name || !editedLender.type) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all required fields.",
      });
      return;
    }
    
    await updateLender(editedLender);
    onClose();
  };

  if (!editedLender) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Lender</DialogTitle>
          <DialogDescription>
            Update the lender information. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lender-name">Lender Name *</Label>
              <Input 
                id="lender-name" 
                value={editedLender.name || ''} 
                onChange={(e) => setEditedLender({...editedLender, name: e.target.value})}
                placeholder="e.g. First National Bank"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lender-type">Lender Type *</Label>
              <Select 
                value={editedLender.type || ''} 
                onValueChange={(value) => setEditedLender({...editedLender, type: value})}
              >
                <SelectTrigger id="lender-type">
                  <SelectValue placeholder="Select lender type" />
                </SelectTrigger>
                <SelectContent>
                  {lenderTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Contact Person</Label>
              <Input 
                id="contact-name" 
                value={editedLender.contact_name || ''} 
                onChange={(e) => setEditedLender({...editedLender, contact_name: e.target.value})}
                placeholder="e.g. John Smith"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact-email">Contact Email</Label>
              <Input 
                id="contact-email" 
                type="email"
                value={editedLender.contact_email || ''} 
                onChange={(e) => setEditedLender({...editedLender, contact_email: e.target.value})}
                placeholder="e.g. john@example.com"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Contact Phone</Label>
              <Input 
                id="contact-phone" 
                value={editedLender.contact_phone || ''} 
                onChange={(e) => setEditedLender({...editedLender, contact_phone: e.target.value})}
                placeholder="e.g. (555) 123-4567"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lender-status">Status</Label>
              <Select 
                value={editedLender.status || 'Active'} 
                onValueChange={(value) => setEditedLender({...editedLender, status: value})}
              >
                <SelectTrigger id="lender-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lender-notes">Notes</Label>
            <Input 
              id="lender-notes" 
              value={editedLender.notes || ''} 
              onChange={(e) => setEditedLender({...editedLender, notes: e.target.value})}
              placeholder="Additional information about this lender"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
