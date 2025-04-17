// src/components/clients/tabs/FinancialDetailsTab.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tables } from '@/integrations/supabase/types';
import { Separator } from '@/components/ui/separator';

// Define type alias
type Client = Tables<"clients">;

// Helper component for consistent display
const DetailItemDisplay = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="mb-3">
        <Label className="text-sm text-muted-foreground">{label}</Label>
        <p className="text-base font-medium mt-1">{value || 'N/A'}</p>
    </div>
);

// Helper function to format currency (handle null/undefined)
const formatCurrency = (amount: number | null | undefined) => {
  if (amount == null) return 'N/A';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// Helper function to render JSONB data nicely
const renderJsonData = (data: unknown | null | undefined) => {
    if (!data) return <p>N/A</p>;
    try {
        // Check if it's an object (and not null/array)
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            return (
                <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
                    {Object.entries(data).map(([key, value]) => (
                        <li key={key}>
                            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span> {JSON.stringify(value)}
                        </li>
                    ))}
                </ul>
            );
        } else {
             // If it's a simple value or array, just stringify
             return <p>{JSON.stringify(data)}</p>;
        }
    } catch (error) {
        console.error("Error rendering JSON data:", error);
        return <p>Error displaying data</p>;
    }
};

interface FinancialDetailsTabProps {
    data: Client;
}

const FinancialDetailsTab: React.FC<FinancialDetailsTabProps> = ({ data: client }) => {

    return (
        <div className="space-y-6">
            {/* Section 1: Employment & Income */}
            <Card>
                <CardHeader>
                    <CardTitle>Employment & Income</CardTitle>
                    <CardDescription>Client's employment status and income details.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div>
                            <DetailItemDisplay label="Employment Status" value={client.employment_status} />
                            <DetailItemDisplay label="Employer Name" value={client.employer_name} />
                            <DetailItemDisplay label="Job Title" value={client.job_title} />
                        </div>
                        <div>
                            <DetailItemDisplay label="Annual Income" value={formatCurrency(client.annual_income)} />
                            <DetailItemDisplay label="Credit Score" value={client.credit_score ?? 'N/A'} />
                            {/* Add other income related fields if they exist */}
                        </div>
                     </div>
                </CardContent>
            </Card>

            {/* Section 2: Assets */}
             <Card>
                <CardHeader>
                    <CardTitle>Assets</CardTitle>
                    <CardDescription>Overview of client's assets.</CardDescription>
                </CardHeader>
                <CardContent>
                    {renderJsonData(client.assets)}
                    {/* Provide a message if no asset data exists */} 
                    {!client.assets && <p className="text-muted-foreground">No asset information provided.</p>}
                </CardContent>
            </Card>

             {/* Section 3: Liabilities */}
             <Card>
                <CardHeader>
                    <CardTitle>Liabilities</CardTitle>
                    <CardDescription>Overview of client's liabilities.</CardDescription>
                </CardHeader>
                <CardContent>
                     {renderJsonData(client.liabilities)}
                     {/* Provide a message if no liability data exists */}
                    {!client.liabilities && <p className="text-muted-foreground">No liability information provided.</p>}
                </CardContent>
            </Card>

            {/* Add Edit button or functionality later */}
        </div>
    );
};

export default FinancialDetailsTab;
