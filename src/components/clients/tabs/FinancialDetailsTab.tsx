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
    if (!data) return null;
    let parsed: any;
    if (typeof data === 'string') {
        try {
            parsed = JSON.parse(data);
        } catch (error: any) {
            return <pre className="text-xs text-red-500">Invalid JSON</pre>;
        }
    } else {
        parsed = data;
    }
    if (typeof parsed === 'object' && parsed !== null) {
        return (
            <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(parsed, null, 2)}
            </pre>
        );
    }
    return <span>{String(parsed)}</span>;
}

// Helper to render assets in a readable format
function renderAssetsData(data: any) {
    if (!data) return <p className="text-muted-foreground">No asset information provided.</p>;
    let parsed = typeof data === 'string' ? (() => { try { return JSON.parse(data); } catch { return null; } })() : data;
    if (!parsed) return <pre className="text-xs text-red-500">Invalid JSON</pre>;
    return (
        <div className="space-y-3">
            {parsed.savingsAccounts && (
                <div>
                    <div className="font-medium mb-1">Savings Accounts</div>
                    <ul className="pl-4 list-disc text-sm">
                        {parsed.savingsAccounts.map((a: any, i: number) => (
                            <li key={i}>{a.institution} ({a.accountType}): <span className="font-mono">${a.balance.toLocaleString()}</span></li>
                        ))}
                    </ul>
                </div>
            )}
            {parsed.investmentAccounts && (
                <div>
                    <div className="font-medium mb-1">Investment Accounts</div>
                    <ul className="pl-4 list-disc text-sm">
                        {parsed.investmentAccounts.map((a: any, i: number) => (
                            <li key={i}>{a.institution} ({a.accountType}): <span className="font-mono">${a.balance.toLocaleString()}</span></li>
                        ))}
                    </ul>
                </div>
            )}
            {parsed.realEstate && (
                <div>
                    <div className="font-medium mb-1">Real Estate</div>
                    <ul className="pl-4 list-disc text-sm">
                        {parsed.realEstate.map((r: any, i: number) => (
                            <li key={i}>{r.propertyType} at {r.address} (Value: <span className="font-mono">${r.currentValue.toLocaleString()}</span>, Mortgage: <span className="font-mono">${r.mortgageOwed.toLocaleString()}</span>)</li>
                        ))}
                    </ul>
                </div>
            )}
            {parsed.vehicles && (
                <div>
                    <div className="font-medium mb-1">Vehicles</div>
                    <ul className="pl-4 list-disc text-sm">
                        {parsed.vehicles.map((v: any, i: number) => (
                            <li key={i}>{v.year} {v.make} {v.model} (Value: <span className="font-mono">${v.currentValue.toLocaleString()}</span>, Loan: <span className="font-mono">${v.loanOwed.toLocaleString()}</span>)</li>
                        ))}
                    </ul>
                </div>
            )}
            {parsed.otherAssets && (
                <div>
                    <div className="font-medium mb-1">Other Assets</div>
                    <ul className="pl-4 list-disc text-sm">
                        {parsed.otherAssets.map((o: any, i: number) => (
                            <li key={i}>{o.description}: <span className="font-mono">${o.estimatedValue.toLocaleString()}</span></li>
                        ))}
                    </ul>
                </div>
            )}
            {parsed.totalAssets && (
                <div className="font-semibold mt-2">Total Assets: <span className="font-mono">${parsed.totalAssets.toLocaleString()}</span></div>
            )}
        </div>
    );
}

// Helper to render liabilities in a readable format
function renderLiabilitiesData(data: any) {
    if (!data) return <p className="text-muted-foreground">No liability information provided.</p>;
    let parsed = typeof data === 'string' ? (() => { try { return JSON.parse(data); } catch { return null; } })() : data;
    if (!parsed) return <pre className="text-xs text-red-500">Invalid JSON</pre>;
    return (
        <div className="space-y-3">
            {parsed.creditCards && (
                <div>
                    <div className="font-medium mb-1">Credit Cards</div>
                    <ul className="pl-4 list-disc text-sm">
                        {parsed.creditCards.map((c: any, i: number) => (
                            <li key={i}>{c.issuer} {c.cardType} (Balance: <span className="font-mono">${c.balance.toLocaleString()}</span>, Limit: <span className="font-mono">${c.creditLimit.toLocaleString()}</span>)</li>
                        ))}
                    </ul>
                </div>
            )}
            {parsed.studentLoans && (
                <div>
                    <div className="font-medium mb-1">Student Loans</div>
                    <ul className="pl-4 list-disc text-sm">
                        {parsed.studentLoans.map((s: any, i: number) => (
                            <li key={i}>{s.lender} (Balance: <span className="font-mono">${s.currentBalance.toLocaleString()}</span>, Rate: {s.interestRate}%)</li>
                        ))}
                    </ul>
                </div>
            )}
            {parsed.autoLoans && (
                <div>
                    <div className="font-medium mb-1">Auto Loans</div>
                    <ul className="pl-4 list-disc text-sm">
                        {parsed.autoLoans.map((a: any, i: number) => (
                            <li key={i}>{a.lender} (Balance: <span className="font-mono">${a.currentBalance.toLocaleString()}</span>, Rate: {a.interestRate}%)</li>
                        ))}
                    </ul>
                </div>
            )}
            {parsed.personalLoans && (
                <div>
                    <div className="font-medium mb-1">Personal Loans</div>
                    <ul className="pl-4 list-disc text-sm">
                        {parsed.personalLoans.map((p: any, i: number) => (
                            <li key={i}>{p.lender} (Balance: <span className="font-mono">${p.currentBalance.toLocaleString()}</span>, Rate: {p.interestRate}%)</li>
                        ))}
                    </ul>
                </div>
            )}
            {parsed.otherLiabilities && (
                <div>
                    <div className="font-medium mb-1">Other Liabilities</div>
                    <ul className="pl-4 list-disc text-sm">
                        {parsed.otherLiabilities.map((o: any, i: number) => (
                            <li key={i}>{o.description}: <span className="font-mono">${o.amount.toLocaleString()}</span></li>
                        ))}
                    </ul>
                </div>
            )}
            {parsed.totalLiabilities && (
                <div className="font-semibold mt-2">Total Liabilities: <span className="font-mono">${parsed.totalLiabilities.toLocaleString()}</span></div>
            )}
            {parsed.monthlyDebtObligations && (
                <div className="font-semibold">Monthly Debt Obligations: <span className="font-mono">${parsed.monthlyDebtObligations.toLocaleString()}</span></div>
            )}
        </div>
    );
}

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
                            {renderAssetsData(client.assets)}
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
                            {renderLiabilitiesData(client.liabilities)}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default FinancialDetailsTab;
