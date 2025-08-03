import React from 'react';
import AnimatedAIChat from './animated-ai-chat';
import WorkingChatbot from './working-chatbot';
import { Client } from '@/features/clients/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface EnhancedChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  placeholder: string;
  title: string;
  subtitle: string;
  selectedClientId: string | null;
  selectedLenderIds: string[];
  clients: Client[];
  lenders: any[];
  onSelectedClientChange: (clientId: string | null) => void;
  onSelectedLendersChange: (lenderIds: string[]) => void;
  showContextSelector: boolean;
  mode: 'new' | 'existing';
}

export default function EnhancedChatInterface({
  messages,
  onSendMessage,
  isLoading,
  placeholder,
  title,
  subtitle,
  selectedClientId,
  selectedLenderIds,
  clients,
  lenders,
  onSelectedClientChange,
  onSelectedLendersChange,
  showContextSelector,
  mode
}: EnhancedChatInterfaceProps) {
  
  // If it's a new conversation or no messages, show the animated welcome screen
  if (mode === 'new' || messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-full max-w-4xl">
          <AnimatedAIChat
            onSendMessage={onSendMessage}
            isLoading={isLoading}
            placeholder={placeholder}
            title={title}
            subtitle={subtitle}
            selectedClientId={selectedClientId}
            selectedLenderIds={selectedLenderIds}
            clients={clients}
            lenders={lenders}
            onSelectedClientChange={onSelectedClientChange}
            onSelectedLendersChange={onSelectedLendersChange}
            showContextSelector={showContextSelector}
          />
        </div>
      </div>
    );
  }

  // If there are existing messages, show the working chatbot
  return (
    <div className="h-full">
      <WorkingChatbot
        apiEndpoint="/api/chat"
        onMessageSent={onSendMessage}
        placeholder={placeholder}
        title="Mortgage"
        subtitle=" Assistant"
        selectedClientId={selectedClientId}
        selectedLenderIds={selectedLenderIds}
        clients={clients}
        lenders={lenders}
        onSelectedClientChange={onSelectedClientChange}
        onSelectedLendersChange={onSelectedLendersChange}
        showContextSelector={showContextSelector}
      />
    </div>
  );
}