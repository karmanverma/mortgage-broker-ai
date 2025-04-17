// src/components/clients/tabs/ActivityLogTab.tsx

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListFilter, FileText, Edit, MessageSquare, Activity as DefaultActivityIcon } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { formatDistanceToNow, format } from 'date-fns';

// Define type alias
type ClientActivity = Tables<"activities">;

interface ActivityLogTabProps {
    data: ClientActivity[]; // Receive activities array from parent
}

// Helper to get icon based on activity type
const getActivityIcon = (type: string | null | undefined) => {
    switch (type?.toLowerCase()) {
        case 'note_added': return <MessageSquare className="h-4 w-4 text-blue-500" />;
        case 'document_upload':
        case 'document_deleted': return <FileText className="h-4 w-4 text-green-500" />;
        case 'client_created':
        case 'client_updated': return <Edit className="h-4 w-4 text-orange-500" />;
        // Add more types as needed
        default: return <DefaultActivityIcon className="h-4 w-4 text-gray-500" />;
    }
};

const ActivityLogTab: React.FC<ActivityLogTabProps> = ({ data: activities }) => {
    const [filterType, setFilterType] = useState<string>('all');

    // Derive unique activity types from the data for the filter dropdown
    const uniqueActivityTypes = useMemo(() => {
        return Array.from(new Set(activities?.map(act => act.action_type).filter(Boolean) ?? []));
    }, [activities]);

    const filteredLog = useMemo(() => {
        return (activities || [])
            .filter(entry => filterType === 'all' || entry.action_type === filterType)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // Sort descending
    }, [activities, filterType]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Timeline of actions and events related to this client.</CardDescription>
                 {/* Filter Controls */} 
                 <div className="flex items-center space-x-2 pt-4">
                     <ListFilter className="h-5 w-5 text-muted-foreground" />
                     <Select value={filterType} onValueChange={setFilterType}>
                         <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by type..." />
                         </SelectTrigger>
                         <SelectContent>
                             <SelectItem value="all">All Activities</SelectItem>
                             {uniqueActivityTypes.map(type => (
                                <SelectItem key={type} value={type}>{type.replace(/_/g, ' ').replace(/(?:^|\s)\S/g, a => a.toUpperCase())}</SelectItem> // Format type name
                             ))}
                         </SelectContent>
                     </Select>
                 </div>
            </CardHeader>
            <CardContent>
                {/* Timeline/List View */} 
                <div className="relative pl-6 space-y-6 border-l-2 border-border">
                    {filteredLog && filteredLog.length > 0 ? (
                        filteredLog.map((entry, index) => {
                           const formattedDate = format(new Date(entry.created_at), 'PPpp');
                           const relativeDate = formatDistanceToNow(new Date(entry.created_at), { addSuffix: true });
                           return (
                            <div key={entry.id} className="relative flex items-start space-x-3">
                                {/* Timeline Dot */} 
                                <div className="absolute -left-[1.30rem] top-1 flex items-center justify-center w-6 h-6 rounded-full bg-background border-2 border-border">
                                    <div className="h-3 w-3 rounded-full bg-primary"></div>
                                </div>
                                {/* Content */} 
                                <div className="flex-1 pt-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium flex items-center">
                                            {getActivityIcon(entry.action_type)}
                                            <span className="ml-1.5">{entry.description || 'No description'}</span>
                                        </span>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap" title={formattedDate}>
                                            {relativeDate}
                                        </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground flex items-center mb-2">
                                         {/* TODO: Display user info if available (requires join or storing name) */} 
                                         {/* <UserCircle className="h-4 w-4 mr-1.5" /> By {entry.user_id} */}
                                    </div>
                                    {/* Optionally display related document/lender ID if needed */}
                                    {/* {entry.document_id && <p className="text-xs text-muted-foreground">Doc ID: {entry.document_id}</p>} */} 
                                    {/* {entry.lender_id && <p className="text-xs text-muted-foreground">Lender ID: {entry.lender_id}</p>} */} 
                                     {/* Separator */} 
                                    {index < filteredLog.length - 1 && <div className="border-b my-4"></div>}
                                </div>
                            </div>
                        )}) 
                    ) : (
                       <div className="relative flex items-start space-x-3 pl-6">
                           <p className="text-center text-muted-foreground py-4">No activities found matching the filter.</p>
                       </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default ActivityLogTab;
