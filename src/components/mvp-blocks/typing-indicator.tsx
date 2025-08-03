import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface TypingIndicatorProps {
  className?: string;
  message?: string;
}

export function TypingIndicator({ 
  className = "", 
  message = "AI is thinking..." 
}: TypingIndicatorProps) {
  return (
    <motion.div
      className={`flex items-center gap-3 rounded-full border border-border bg-background/80 px-4 py-2 shadow-lg backdrop-blur-2xl ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <div className="flex h-7 w-8 items-center justify-center rounded-full bg-primary/10 text-center">
        <Sparkles className="h-4 w-4 text-primary" />
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{message}</span>
        <TypingDots />
      </div>
    </motion.div>
  );
}

function TypingDots() {
  return (
    <div className="ml-1 flex items-center">
      {[1, 2, 3].map((dot) => (
        <motion.div
          key={dot}
          className="mx-0.5 h-1.5 w-1.5 rounded-full bg-primary"
          initial={{ opacity: 0.3 }}
          animate={{
            opacity: [0.3, 0.9, 0.3],
            scale: [0.85, 1.1, 0.85],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: dot * 0.15,
            ease: 'easeInOut',
          }}
          style={{
            boxShadow: '0 0 4px rgba(255, 255, 255, 0.3)',
          }}
        />
      ))}
    </div>
  );
}

export default TypingIndicator;