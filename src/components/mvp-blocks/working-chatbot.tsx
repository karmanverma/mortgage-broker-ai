'use client';

import { Bot, Copy, CornerRightUp, Sparkles } from 'lucide-react';
import { useCallback, useRef, useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAutoResizeTextarea } from '@/hooks/use-auto-resize-textarea';
import { useCustomChat } from '@/hooks/useCustomChat';
import Markdown from 'react-markdown';
import { toast } from 'sonner';
import { ContextSelector } from './context-selector';
import { Client } from '@/features/clients/types';

function AiInput({
  value,
  onChange,
  onSubmit,
  onKeyDown,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 50,
    maxHeight: 200,
  });

  return (
    <div className="w-full">
      <div className="relative mx-auto flex w-full max-w-4xl flex-col items-start gap-2">
        <div className="relative mx-auto w-full max-w-4xl">
          <Textarea
            ref={textareaRef}
            id="ai-input-06"
            placeholder="Ask me anything!"
            className={cn(
              'w-full max-w-4xl resize-none text-wrap rounded-3xl border-none bg-muted/50 py-4 pl-6 pr-12 leading-[1.2] text-foreground ring-primary/20 placeholder:text-muted-foreground/70',
              'min-h-[56px] transition-all duration-200 focus:ring-2 focus:ring-primary/30',
            )}
            value={value}
            onKeyDown={onKeyDown}
            onChange={(e) => {
              onChange(e);
              adjustHeight();
            }}
          />
          <button
            onClick={onSubmit}
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-primary/10 p-2 transition-all duration-200 hover:bg-primary/20',
              value.trim() ? 'opacity-100' : 'cursor-not-allowed opacity-50',
            )}
            type="button"
            disabled={!value.trim()}
          >
            <CornerRightUp
              className={cn(
                'h-4 w-4 text-primary transition-opacity',
                value ? 'opacity-100' : 'opacity-50',
              )}
            />
          </button>
        </div>
        <p className="ml-4 text-xs text-muted-foreground">
          {value.length}/2000 characters
        </p>
      </div>
    </div>
  );
}

interface WorkingChatbotProps {
  sessionId?: string;
  onMessageSent?: (message: string) => void;
  onResponseReceived?: (response: string) => void;
  placeholder?: string;
  title?: string;
  subtitle?: string;
  // Context selection props
  selectedClientId?: string | null;
  selectedLenderIds?: string[];
  clients?: Client[];
  lenders?: any[];
  onSelectedClientChange?: (clientId: string | null) => void;
  onSelectedLendersChange?: (lenderIds: string[]) => void;
  showContextSelector?: boolean;
  // Initial messages for existing conversations
  initialMessages?: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
  }>;
  // Initial message to send automatically (for new conversations)
  initialMessageToSend?: string;
}

export default function WorkingChatbot({
  sessionId,
  onMessageSent,
  onResponseReceived,
  placeholder = "Ask me anything!",
  title = "MVPBlocks",
  subtitle = ".AI",
  selectedClientId = null,
  selectedLenderIds = [],
  clients = [],
  lenders = [],
  onSelectedClientChange,
  onSelectedLendersChange,
  showContextSelector = true,
  initialMessages = [],
  initialMessageToSend
}: WorkingChatbotProps) {
  const [responseTimes, setResponseTimes] = useState<Record<string, number>>({});
  const [hasAutoSent, setHasAutoSent] = useState(false);
  const startTimeRef = useRef<number>(0);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    setInput,
    isLoading,
    error,
  } = useCustomChat({
    sessionId,
    context: {
      selectedClientId: selectedClientId || undefined,
      selectedLenderIds,
    },
    initialMessages,
    onFinish: (message) => {
      const endTime = Date.now();
      const duration = (endTime - startTimeRef.current) / 1000;
      setResponseTimes((prev) => ({
        ...prev,
        [message.id]: duration,
      }));
      if (onResponseReceived) {
        onResponseReceived(message.content);
      }
    },
  });

  // Auto-send initial message if provided
  useEffect(() => {
    if (initialMessageToSend && !hasAutoSent && sessionId && !isLoading && messages.length === 0) {
      console.log('🟡 WorkingChatbot: Auto-sending initial message:', initialMessageToSend.substring(0, 50) + '...');
      setInput(initialMessageToSend);
      // Use setTimeout to ensure the input is set before submitting
      setTimeout(() => {
        originalHandleSubmit();
        setHasAutoSent(true);
      }, 100);
    }
  }, [initialMessageToSend, hasAutoSent, sessionId, isLoading, messages.length, setInput, originalHandleSubmit]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (!input.trim()) return;
      startTimeRef.current = Date.now();
      if (onMessageSent) {
        onMessageSent(input);
      }
      originalHandleSubmit(e);
    },
    [originalHandleSubmit, input, onMessageSent],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className="relative flex h-full w-full flex-col">
      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="mx-auto max-w-4xl">
          {messages.length > 0 ? (
            messages.map((m) => {
              return (
                <div key={m.id} className="mb-4 whitespace-pre-wrap">
                  {m.role === 'user' ? (
                    <div className="flex flex-row px-2 py-4 sm:px-4">
                      <div className="mr-2 flex size-6 rounded-full bg-primary/10 items-center justify-center sm:mr-4 md:size-8">
                        <span className="text-xs font-medium text-primary">U</span>
                      </div>
                      <div className="flex max-w-3xl items-center">
                        <p>{m.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative mb-4 flex rounded-xl bg-neutral-50 px-2 py-6 dark:bg-neutral-900 sm:px-4">
                      <Bot className="mr-2 flex size-8 rounded-full bg-secondary p-1 text-primary sm:mr-4" />{' '}
                      <div className="markdown-body w-full max-w-3xl overflow-x-auto rounded-xl">
                        <Markdown>{m.content}</Markdown>
                        {responseTimes[m.id] && (
                          <div className="mt-2 text-xs text-neutral-500">
                            Response time: {responseTimes[m.id].toFixed(3)}s
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        title="copy"
                        className="absolute right-2 top-2 rounded-full bg-rose-500 p-1 opacity-50 transition-all hover:opacity-75 active:scale-95 dark:bg-neutral-800"
                        onClick={() => {
                          navigator.clipboard.writeText(m.content);
                          toast.success('Copied to clipboard');
                        }}
                      >
                        <Copy className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex h-full flex-col items-center justify-center">
              <p className="mx-auto px-2 text-center text-xl font-semibold tracking-wide text-muted-foreground md:text-2xl">
                Start Chatting with
                <br />
                <span className="text-2xl font-bold text-primary md:text-4xl">
                  {title}
                </span>
                <span className="text-primary">{subtitle}</span>
              </p>
              <div className="group relative mt-6">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary/30 to-primary/10 opacity-75 blur-md transition-opacity duration-500 group-hover:opacity-100"></div>
                <div className="relative flex h-[200px] w-[200px] items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 transition-all duration-500 hover:scale-105 active:scale-95">
                  <Bot className="h-16 w-16 text-primary" />
                </div>
              </div>
            </div>
          )}
          {isLoading && (
            <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-primary/5 px-4 py-2">
              <Sparkles className="h-4 w-4 animate-pulse text-primary" />
              <span className="animate-pulse bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-sm font-medium text-transparent">
                Generating response...
              </span>
            </div>
          )}
          {error && (
            <div className="mx-auto w-fit rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-destructive">
              Something went wrong! Please try again.
            </div>
          )}
        </div>
      </div>

      {/* Floating Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="mx-auto max-w-4xl p-4">
          <form onSubmit={handleSubmit}>
            <div className="relative space-y-3">
              {/* Context Selector */}
              {showContextSelector && (selectedClientId || selectedLenderIds.length > 0 || (clients && clients.length > 0)) && (
                <div className="rounded-2xl border border-border bg-card/80 p-3 backdrop-blur-sm">
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
              )}
              
              <AiInput
                value={input}
                onChange={handleInputChange}
                onSubmit={handleSubmit}
                onKeyDown={handleKeyDown}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}