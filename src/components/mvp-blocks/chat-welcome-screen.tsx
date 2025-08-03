import React from 'react';
import { motion } from 'framer-motion';
import { Bot, MessageSquare, Sparkles, TrendingUp, Users, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ChatWelcomeScreenProps {
  title?: string;
  subtitle?: string;
  onQuickAction?: (action: string) => void;
  className?: string;
}

const quickActions = [
  {
    icon: <Users className="h-5 w-5" />,
    title: "Client Analysis",
    description: "Get insights about your clients",
    action: "analyze-clients"
  },
  {
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Market Rates",
    description: "Check current mortgage rates",
    action: "check-rates"
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "Document Review",
    description: "Upload and analyze documents",
    action: "review-documents"
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: "Ask Anything",
    description: "General mortgage questions",
    action: "general-question"
  }
];

export function ChatWelcomeScreen({
  title = "Welcome to Your AI Mortgage Assistant",
  subtitle = "How can I help you today?",
  onQuickAction,
  className = ""
}: ChatWelcomeScreenProps) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[60vh] p-8 ${className}`}>
      <motion.div
        className="text-center space-y-6 max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* AI Avatar */}
        <motion.div
          className="relative mx-auto w-24 h-24 mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 animate-pulse" />
          <div className="relative flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
            <Bot className="h-12 w-12 text-primary" />
          </div>
          <motion.div
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="h-3 w-3 text-primary-foreground" />
          </motion.div>
        </motion.div>

        {/* Title and Subtitle */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-lg text-muted-foreground">
            {subtitle}
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 w-full max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {quickActions.map((action, index) => (
            <motion.div
              key={action.action}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
            >
              <Card 
                className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 border-primary/10 hover:border-primary/30"
                onClick={() => onQuickAction?.(action.action)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <p className="text-sm text-muted-foreground mb-4">
            Or start typing your question below
          </p>
          <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>AI Assistant Online</span>
            </div>
            <span>•</span>
            <span>Powered by Advanced AI</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default ChatWelcomeScreen;