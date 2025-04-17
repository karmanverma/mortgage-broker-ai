// src/components/clients/tabs/PersonalInfoTab.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ data: client }) => {
    // Display data from the passed client object
    const fullAddress = [
        client.address_line1,
        client.address_line2,
        client.city,
        client.state,
        client.zip_code,
        client.country
    ].filter(Boolean).join(', ');

    return (
        <Card>
            <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Review the client's personal and contact details.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {/* Basic Info Column */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 border-b pb-1">Basic Details</h3>
                        <DetailItemDisplay label="First Name" value={client.first_name} />
                        <DetailItemDisplay label="Last Name" value={client.last_name} />
                        <DetailItemDisplay label="Date of Birth" value={formatDate(client.date_of_birth)} />
                        {/* Add SSN display if needed, consider masking */}
                        {/* <DetailItemDisplay label="SSN" value={"***-**-" + (client.ssnLastFour || '****')} /> */} 
                    </div>

                    {/* Contact & Address Column */}
                    <div>
                         <h3 className="text-lg font-semibold mb-3 border-b pb-1">Contact & Address</h3>
                        <DetailItemDisplay label="Email Address" value={client.email} />
                        <DetailItemDisplay label="Phone Number" value={client.phone} />
                        <DetailItemDisplay label="Full Address" value={fullAddress || 'N/A'} />
                        {/* Display individual address parts if preferred */}
                        {/* <DetailItemDisplay label="Address Line 1" value={client.address_line1} /> */} 
                        {/* <DetailItemDisplay label="Address Line 2" value={client.address_line2} /> */} 
                        {/* <DetailItemDisplay label="City" value={client.city} /> */} 
                        {/* <DetailItemDisplay label="State" value={client.state} /> */} 
                        {/* <DetailItemDisplay label="Zip Code" value={client.zip_code} /> */} 
                        {/* <DetailItemDisplay label="Country" value={client.country} /> */} 
                    </div>
                </div>
                {/* Add Edit button or functionality later */}
            </CardContent>
        </Card>
    );
};

export default PersonalInfoTab;
