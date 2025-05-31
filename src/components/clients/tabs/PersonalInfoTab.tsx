// src/components/clients/tabs/PersonalInfoTab.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button"; // Import Button component
import { Tables } from '@/integrations/supabase/types'; // Use Supabase types
import { format } from 'date-fns'; // For formatting date

// Define type alias for clarity
type Client = Tables<"clients">;

// Helper component for consistent display
const DetailItemDisplay = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="mb-3">
        <Label className="text-sm text-muted-foreground">{label}</Label>
        <p className="text-base font-medium mt-1">{value || 'N/A'}</p>
    </div>
);

// Helper function to format date, handling null/undefined
const formatDate = (date: string | Date | null | undefined, formatString = 'PPP') => {
  if (!date) return 'N/A';
  try {
    const validDate = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(validDate.getTime())) return 'Invalid Date';
    return format(validDate, formatString);
  } catch {
    return 'Invalid Date';
  }
};

interface PersonalInfoTabProps {
    data: Client; // Receive client data from parent
    isEditing?: boolean;
    onEdit?: () => void;
    onChange?: (data: Client) => void;
    onSave?: () => void;
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ data: client, isEditing, onEdit, onChange, onSave }) => {
    // Editable fields state
    const [local, setLocal] = React.useState(client);
    React.useEffect(() => { setLocal(client); }, [client]);
    const handleField = (field: keyof Client, value: any) => {
        const updated = { ...local, [field]: value };
        setLocal(updated);
        onChange && onChange(updated);
    };
    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Review the client's personal and contact details.</CardDescription>
                </div>
                {isEditing ? (
                    <Button size="sm" onClick={onSave}>Save</Button>
                ) : (
                    <Button size="sm" variant="outline" onClick={onEdit}>Edit</Button>
                )}
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-3 border-b pb-1">Basic Details</h3>
                        {isEditing ? (
                            <div className="space-y-3">
                                <Label>First Name</Label>
                                <Input value={local.first_name || ''} onChange={e => handleField('first_name', e.target.value)} />
                                <Label>Last Name</Label>
                                <Input value={local.last_name || ''} onChange={e => handleField('last_name', e.target.value)} />
                                <Label>Date of Birth</Label>
                                <Input type="date" value={local.date_of_birth ? String(local.date_of_birth).slice(0,10) : ''} onChange={e => handleField('date_of_birth', e.target.value)} />
                            </div>
                        ) : (
                            <>
                                <DetailItemDisplay label="First Name" value={client.first_name} />
                                <DetailItemDisplay label="Last Name" value={client.last_name} />
                                <DetailItemDisplay label="Date of Birth" value={formatDate(client.date_of_birth)} />
                            </>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-3 border-b pb-1">Contact & Address</h3>
                        {isEditing ? (
                            <div className="space-y-3">
                                <Label>Email Address</Label>
                                <Input value={local.email || ''} onChange={e => handleField('email', e.target.value)} />
                                <Label>Phone Number</Label>
                                <Input value={local.phone || ''} onChange={e => handleField('phone', e.target.value)} />
                                <Label>Full Address</Label>
                                <Input value={local.address_line1 || ''} onChange={e => handleField('address_line1', e.target.value)} placeholder="Address Line 1" />
                                <Input value={local.address_line2 || ''} onChange={e => handleField('address_line2', e.target.value)} placeholder="Address Line 2" />
                                <Input value={local.city || ''} onChange={e => handleField('city', e.target.value)} placeholder="City" />
                                <Input value={local.state || ''} onChange={e => handleField('state', e.target.value)} placeholder="State" />
                                <Input value={local.zip_code || ''} onChange={e => handleField('zip_code', e.target.value)} placeholder="Zip Code" />
                                <Input value={local.country || ''} onChange={e => handleField('country', e.target.value)} placeholder="Country" />
                            </div>
                        ) : (
                            <>
                                <DetailItemDisplay label="Email Address" value={client.email} />
                                <DetailItemDisplay label="Phone Number" value={client.phone} />
                                <DetailItemDisplay label="Full Address" value={[
                                    client.address_line1,
                                    client.address_line2,
                                    client.city,
                                    client.state,
                                    client.zip_code,
                                    client.country
                                ].filter(Boolean).join(', ') || 'N/A'} />
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default PersonalInfoTab;
