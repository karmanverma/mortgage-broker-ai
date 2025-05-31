// src/components/clients/tabs/FinancialDetailsTab.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tables } from '@/integrations/supabase/types';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    isEditing?: boolean;
    onEdit?: () => void;
    onChange?: (data: Client) => void;
    onSave?: () => void;
}

const FinancialDetailsTab: React.FC<FinancialDetailsTabProps> = ({ data: client, isEditing, onEdit, onChange, onSave }) => {
    const [local, setLocal] = React.useState(client);
    React.useEffect(() => { setLocal(client); }, [client]);
    const handleField = (field: keyof Client, value: any) => {
        const updated = { ...local, [field]: value };
        setLocal(updated);
        onChange && onChange(updated);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle>Employment & Income</CardTitle>
                        <CardDescription>Client's employment status and income details.</CardDescription>
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
                            {isEditing ? (
                                <div className="space-y-3">
                                    <Label>Employment Status</Label>
                                    <Input value={local.employment_status || ''} onChange={e => handleField('employment_status', e.target.value)} />
                                    <Label>Employer Name</Label>
                                    <Input value={local.employer_name || ''} onChange={e => handleField('employer_name', e.target.value)} />
                                    <Label>Job Title</Label>
                                    <Input value={local.job_title || ''} onChange={e => handleField('job_title', e.target.value)} />
                                </div>
                            ) : (
                                <>
                                    <DetailItemDisplay label="Employment Status" value={client.employment_status} />
                                    <DetailItemDisplay label="Employer Name" value={client.employer_name} />
                                    <DetailItemDisplay label="Job Title" value={client.job_title} />
                                </>
                            )}
                        </div>
                        <div>
                            {isEditing ? (
                                <div className="space-y-3">
                                    <Label>Annual Income</Label>
                                    <Input value={local.annual_income || ''} onChange={e => handleField('annual_income', e.target.value)} />
                                    <Label>Credit Score</Label>
                                    <Input value={local.credit_score || ''} onChange={e => handleField('credit_score', e.target.value)} />
                                </div>
                            ) : (
                                <>
                                    <DetailItemDisplay label="Annual Income" value={formatCurrency(client.annual_income)} />
                                    <DetailItemDisplay label="Credit Score" value={client.credit_score ?? 'N/A'} />
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Assets</CardTitle>
                    <CardDescription>Overview of client's assets.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isEditing ? (
                        <div className="space-y-3">
                            <Label>Assets (JSON)</Label>
                            <Input value={typeof local.assets === 'string' ? local.assets : JSON.stringify(local.assets || {})} onChange={e => handleField('assets', e.target.value)} />
                        </div>
                    ) : (
                        <>
                            {renderJsonData(client.assets)}
                            {!client.assets && <p className="text-muted-foreground">No asset information provided.</p>}
                        </>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Liabilities</CardTitle>
                    <CardDescription>Overview of client's liabilities.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isEditing ? (
                        <div className="space-y-3">
                            <Label>Liabilities (JSON)</Label>
                            <Input value={typeof local.liabilities === 'string' ? local.liabilities : JSON.stringify(local.liabilities || {})} onChange={e => handleField('liabilities', e.target.value)} />
                        </div>
                    ) : (
                        <>
                            {renderJsonData(client.liabilities)}
                            {!client.liabilities && <p className="text-muted-foreground">No liability information provided.</p>}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default FinancialDetailsTab;
