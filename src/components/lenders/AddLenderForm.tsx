
import { useState } from "react";
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
import { useImprovedLenders, NewLenderData } from "@/hooks/useImprovedLenders";
import { toast } from "@/components/ui/use-toast";

interface AddLenderFormProps {
  isOpen: boolean;
  onClose: () => void;
  lenderTypes: string[];
  statusOptions: string[];
}

export const AddLenderForm = ({
  isOpen,
  onClose,
  lenderTypes,
  statusOptions,
}: AddLenderFormProps) => {
  const [newLender, setNewLender] = useState<NewLenderData>({
    name: "",
    type: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    status: "Active",
    notes: ""
  });
  
  const { addLender, isAdding } = useImprovedLenders();

  const handleAddLender = () => {
    if (!newLender.name || !newLender.type || !newLender.contact_name || !newLender.contact_email) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill out all required fields.",
      });
      return;
    }
    
    // No need for await - optimistic updates handle this
    addLender(newLender);
    
    // Reset form and close dialog
    setNewLender({
      name: "",
      type: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      status: "Active",
      notes: ""
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Lender</DialogTitle>
          <DialogDescription>
            Enter the details for the new lender. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lender-name">Lender Name *</Label>
              <Input 
                id="lender-name" 
                value={newLender.name} 
                onChange={(e) => setNewLender({...newLender, name: e.target.value})}
                placeholder="e.g. First National Bank"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lender-type">Lender Type *</Label>
              <Select 
                value={newLender.type} 
                onValueChange={(value) => setNewLender({...newLender, type: value})}
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
              <Label htmlFor="contact-name">Contact Person *</Label>
              <Input 
                id="contact-name" 
                value={newLender.contact_name} 
                onChange={(e) => setNewLender({...newLender, contact_name: e.target.value})}
                placeholder="e.g. John Smith"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact-email">Contact Email *</Label>
              <Input 
                id="contact-email" 
                type="email"
                value={newLender.contact_email} 
                onChange={(e) => setNewLender({...newLender, contact_email: e.target.value})}
                placeholder="e.g. john@example.com"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Contact Phone</Label>
              <Input 
                id="contact-phone" 
                value={newLender.contact_phone || ""} 
                onChange={(e) => setNewLender({...newLender, contact_phone: e.target.value})}
                placeholder="e.g. (555) 123-4567"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lender-status">Status</Label>
              <Select 
                value={newLender.status} 
                onValueChange={(value) => setNewLender({...newLender, status: value})}
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
              value={newLender.notes} 
              onChange={(e) => setNewLender({...newLender, notes: e.target.value})}
              placeholder="Additional information about this lender"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleAddLender} disabled={isAdding}>
            {isAdding ? "Adding..." : "Add Lender"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
