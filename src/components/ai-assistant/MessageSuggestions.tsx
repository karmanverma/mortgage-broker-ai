import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react'; // Import X icon

interface MessageSuggestionsProps {
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

const MessageSuggestions: React.FC<MessageSuggestionsProps> = ({
  suggestions,
  onSelectSuggestion,
  isVisible,
  onClose
}) => {
  // If not visible or no suggestions, return null
  if (!isVisible || !suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    // Reduced padding (p-1.5), removed bg-gray-50, kept border and rounded
    <div className="mb-2 p-1.5 border rounded-lg relative">
      {/* Close button positioned top-right */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        // Adjusted positioning slightly due to reduced padding
        className="absolute top-0.5 right-0.5 h-6 w-6 text-muted-foreground hover:text-foreground"
        aria-label="Hide suggestions"
      >
        <X className="h-4 w-4" />
      </Button>
      {/* Suggestion buttons */}
      <div className="flex flex-wrap gap-2 pt-1"> 
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            // Changed rounded-full to rounded-md
            className="text-xs font-normal rounded-md h-7 px-2.5" 
            onClick={() => onSelectSuggestion(suggestion)}
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default MessageSuggestions;
