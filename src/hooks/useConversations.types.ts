// Define Conversation type based on your actual Supabase table schema

export interface Conversation {
    id: string; // The unique ID of a specific conversation *message* or row
    user_id: string;
    created_at: string;
    session_id: string; // The ID grouping messages into a single conversation thread
    // Add other relevant fields from your 'conversations' table that identify a conversation thread
    // For example, if you store the first message or a title (ensure it exists in DB):
    // title?: string; 
    message?: string; // Example: If each row is a message
    sender?: 'user' | 'ai'; // Example
}

// You might also want a type for the list item displayed in the sidebar,
// which might only need session_id and maybe the timestamp of the latest message.
export interface ConversationListItem {
    session_id: string;
    last_updated: string; // Or created_at of the conversation start
    // Potentially a display title generated from the first message or date
    displayTitle: string;
}
