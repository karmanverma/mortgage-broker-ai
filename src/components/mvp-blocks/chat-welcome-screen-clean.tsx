import React, { useState } from 'react';
import { Bot, CornerRightUp, Brain } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAutoResizeTextarea } from '@/hooks/use-auto-resize-textarea';
import { ContextSelector } from './context-selector';
import { Client } from '@/features/clients/types';

interface ChatWelcomeScreenCleanProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  title?: string;
  subtitle?: string;
  selectedClientId?: string | null;
  selectedLenderIds?: string[];
  clients?: Client[];
  lenders?: any[];
  onSelectedClientChange?: (clientId: string | null) => void;
  onSelectedLendersChange?: (lenderIds: string[]) => void;
  showContextSelector?: boolean;
  onContextToggle?: () => void;
}

export default function ChatWelcomeScreenClean({
  onSendMessage,
  isLoading = false,
  placeholder = "Ask about clients, lenders, rates, or get personalized recommendations...",
  title = "How can I help with your mortgage needs today?",
  subtitle = "Ask about clients, lenders, rates, or get personalized recommendations",
  selectedClientId = null,
  selectedLenderIds = [],
  clients = [],
  lenders = [],
  onSelectedClientChange,
  onSelectedLendersChange,
  showContextSelector = true,
  onContextToggle
}: ChatWelcomeScreenCleanProps) {
  const [input, setInput] = useState('');
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!input.trim() || isLoading) return;
    
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-4">
          {/* Animated Bot Icon */}
          <div className="group relative mx-auto mb-8">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary/30 to-primary/10 opacity-75 blur-md transition-opacity duration-500 group-hover:opacity-100"></div>
            <div className="relative flex h-[200px] w-[200px] items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 transition-all duration-500 hover:scale-105 active:scale-95">
              <Bot className="h-20 w-20 text-primary" />
            </div>
          </div>

          {/* Title and Subtitle */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              {title}
            </h1>
            <p className="text-muted-foreground text-lg">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Context Selector */}
        {showContextSelector && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Context Selection</h3>
              {onContextToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onContextToggle}
                  className="flex items-center gap-2"
                >
                  <Brain className="h-4 w-4" />
                  Manage Context
                </Button>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-card/80 p-4 backdrop-blur-sm">
              <ContextSelector
                selectedClientId={selectedClientId}
                selectedLenderIds={selectedLenderIds}
                clients={clients}
                lenders={lenders}
                onSelectedClientChange={onSelectedClientChange}
                onSelectedLendersChange={onSelectedLendersChange}
                className="flex-wrap"
              />
            </div>
          </div>
        )}

        {/* Chat Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder={placeholder}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                adjustHeight();
              }}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className={cn(
                'w-full resize-none rounded-3xl border-2 border-primary/20 bg-background/50 py-4 pl-6 pr-16 text-base leading-relaxed transition-all duration-200',
                'focus:border-primary/40 focus:ring-2 focus:ring-primary/20',
                'placeholder:text-muted-foreground/70',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isLoading}
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 transition-all duration-200',
                input.trim() && !isLoading ? 'opacity-100' : 'opacity-50 cursor-not-allowed'
              )}
            >
              <CornerRightUp className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{input.length}/2000 characters</span>
            <span>Press Enter to send, Shift+Enter for new line</span>
          </div>
        </form>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="h-auto p-4 text-left justify-start"
            onClick={() => setInput("What are the current mortgage rates?")}
          >
            <div>
              <div className="font-medium">Current Rates</div>
              <div className="text-xs text-muted-foreground">Check latest mortgage rates</div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-auto p-4 text-left justify-start"
            onClick={() => setInput("Help me find the best lender for my client")}
          >
            <div>
              <div className="font-medium">Find Lenders</div>
              <div className="text-xs text-muted-foreground">Get lender recommendations</div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-auto p-4 text-left justify-start"
            onClick={() => setInput("What documents does my client need?")}
          >
            <div>
              <div className="font-medium">Required Documents</div>
              <div className="text-xs text-muted-foreground">Check documentation needs</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
