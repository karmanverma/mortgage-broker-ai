
import { useState, useRef, useEffect } from "react";
import { 
  Building, 
  ChevronDown, 
  FileText, 
  Info, 
  MessageSquare, 
  MoreHorizontal, 
  PanelRightClose, 
  PanelRightOpen, 
  Plus, 
  RefreshCw, 
  Send, 
  ThumbsDown, 
  ThumbsUp, 
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// Mock conversation history
const mockConversations = [
  {
    id: 1,
    title: "FHA loan requirements",
    preview: "What are the current FHA loan requirements?",
    date: "Today",
    time: "10:23 AM"
  },
  {
    id: 2,
    title: "Jumbo loan rates",
    preview: "Compare jumbo loan rates between lenders",
    date: "Yesterday",
    time: "3:45 PM"
  },
  {
    id: 3,
    title: "First National Bank products",
    preview: "Tell me about First National Bank's mortgage products",
    date: "May 15",
    time: "11:30 AM"
  },
  {
    id: 4,
    title: "VA loan eligibility",
    preview: "How do I determine VA loan eligibility?",
    date: "May 12",
    time: "2:15 PM"
  },
  {
    id: 5,
    title: "Refinance options",
    preview: "What refinance options are available for clients?",
    date: "May 10",
    time: "9:05 AM"
  }
];

// Mock message history for the current conversation
const mockMessages = [
  {
    id: 1,
    role: "user",
    content: "What are the current FHA loan requirements?",
    timestamp: "10:23 AM"
  },
  {
    id: 2,
    role: "assistant",
    content: `Here are the current FHA loan requirements:

1. **Credit Score**: Minimum 580 for 3.5% down payment, 500-579 for 10% down.
2. **Debt-to-Income Ratio**: Typically 43%, but can go higher with compensating factors.
3. **Down Payment**: At least 3.5% of the purchase price.
4. **Mortgage Insurance**: Upfront premium of 1.75% of loan amount, plus annual MIP.
5. **Property Requirements**: Must be your primary residence and meet HUD's minimum property standards.
6. **Loan Limits**: Vary by county. For 2023, the FHA limit for low-cost areas is $472,030 for a single-family home.

Would you like specific information about any of these requirements?`,
    timestamp: "10:24 AM"
  },
  {
    id: 3,
    role: "user",
    content: "What are typical interest rates for FHA loans compared to conventional loans?",
    timestamp: "10:26 AM"
  },
  {
    id: 4,
    role: "assistant",
    content: `Currently, FHA loans typically have slightly lower interest rates compared to conventional loans, especially for borrowers with lower credit scores. Here's a comparison:

For a borrower with a credit score of 680:
- **FHA loan**: ~5.25% - 5.75%
- **Conventional loan**: ~5.50% - 6.00%

For a borrower with a credit score of 620:
- **FHA loan**: ~5.50% - 6.00%
- **Conventional loan**: ~6.00% - 6.50%

However, it's important to note that:

1. FHA loans have mandatory mortgage insurance premiums (MIP) that add to the overall cost.
2. Conventional loans only require private mortgage insurance (PMI) if the down payment is less than 20%, and PMI can be removed once 20% equity is reached.
3. FHA MIP is required for the life of the loan if the down payment is less than 10%.

Based on your lender database, First National Bank and Liberty Mortgage currently offer competitive FHA rates at 5.25% and 5.35% respectively.

Would you like me to provide more specific rate information from your lender network?`,
    timestamp: "10:27 AM"
  }
];

// Mock suggested questions
const mockSuggestions = [
  "What documents do clients need for an FHA application?",
  "How long does FHA approval typically take?",
  "Are there FHA condo approval requirements?",
  "What are First National Bank's current FHA rates?"
];

// Mock lender information
const lenderInfo = {
  name: "First National Bank",
  fhaInfo: {
    minCreditScore: 620,
    currentRate: "5.25%",
    downPayment: "3.5% minimum",
    processingTime: "15-20 business days"
  }
};

const AIAssistant = () => {
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState(mockConversations);
  const [activeConversation, setActiveConversation] = useState(mockConversations[0]);
  const [loading, setLoading] = useState(false);
  const [contextPanelOpen, setContextPanelOpen] = useState(true);
  const [suggestions, setSuggestions] = useState(mockSuggestions);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = {
      id: messages.length + 1,
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, userMessage]);
    setInput("");
    setLoading(true);
    
    // Simulate AI response after a delay
    setTimeout(() => {
      const aiMessage = {
        id: messages.length + 2,
        role: "assistant",
        content: `I'm simulating an AI response to your question about "${input}". In a real implementation, this would be connected to an actual AI service that would provide a meaningful response based on your lender database and mortgage industry knowledge.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setLoading(false);
      
      // Generate new suggestions
      setSuggestions([
        "How does this compare to conventional loans?",
        "What documentation would be needed for this?",
        "Are there any special programs available?",
        "What lenders offer the best rates for this?"
      ]);
    }, 2000);
  };

  // Handle starting a new conversation
  const handleNewConversation = () => {
    const newConversation = {
      id: conversations.length + 1,
      title: "New conversation",
      preview: "",
      date: "Today",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setConversations([newConversation, ...conversations]);
    setActiveConversation(newConversation);
    setMessages([]);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    const userMessage = {
      id: messages.length + 1,
      role: "user",
      content: suggestion,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, userMessage]);
    setLoading(true);
    
    // Simulate AI response after a delay
    setTimeout(() => {
      const aiMessage = {
        id: messages.length + 2,
        role: "assistant",
        content: `I'm simulating an AI response to your question about "${suggestion}". In a real implementation, this would be connected to an actual AI service that would provide a meaningful response based on your lender database and mortgage industry knowledge.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setLoading(false);
      
      // Generate new suggestions
      setSuggestions([
        "Can you explain this in more detail?",
        "How does this affect my client's application?",
        "What documentation supports this?",
        "Are there exceptions to these rules?"
      ]);
    }, 2000);
  };

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))]">
      {/* Conversation list sidebar */}
      <div className="w-72 border-r border-gray-200 hidden md:block">
        <div className="p-4">
          <Button onClick={handleNewConversation} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            New Conversation
          </Button>
        </div>
        <div className="px-3 py-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Conversations</h2>
        </div>
        <ScrollArea className="h-[calc(100%-90px)]">
          {conversations.map((convo) => (
            <div
              key={convo.id}
              className={`
                px-3 py-2 cursor-pointer hover:bg-gray-100
                ${activeConversation.id === convo.id ? 'bg-gray-100' : ''}
              `}
              onClick={() => setActiveConversation(convo)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-sm truncate max-w-[140px]">
                    {convo.title}
                  </span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Rename</DropdownMenuItem>
                    <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="pl-6 text-xs text-gray-500 truncate max-w-[180px]">
                {convo.preview}
              </div>
              <div className="pl-6 text-xs text-gray-400 mt-1">
                {convo.date} at {convo.time}
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="py-3 px-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <h2 className="font-semibold">{activeConversation.title}</h2>
            <Badge variant="outline" className="ml-2 text-xs bg-brand-50 text-brand-700 border-brand-200">AI Assistant</Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setContextPanelOpen(!contextPanelOpen)}
              className="md:hidden"
            >
              {contextPanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleNewConversation}>
                  <Plus className="h-4 w-4 mr-2" />
                  New conversation
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <FileText className="h-4 w-4 mr-2" />
                  Export conversation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Chat messages container */}
        <div className="flex-1 overflow-y-auto p-4 pb-2">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-brand-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Mortgage AI Assistant</h3>
              <p className="text-gray-500 max-w-md mb-6">
                Ask me about mortgage products, lender requirements, rates, or any other mortgage-related questions.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                <Button variant="outline" onClick={() => handleSuggestionClick("What are today's best mortgage rates?")}>
                  What are today's best rates?
                </Button>
                <Button variant="outline" onClick={() => handleSuggestionClick("Find lenders for self-employed borrowers")}>
                  Lenders for self-employed
                </Button>
                <Button variant="outline" onClick={() => handleSuggestionClick("Compare FHA vs Conventional loans")}>
                  FHA vs Conventional loans
                </Button>
                <Button variant="outline" onClick={() => handleSuggestionClick("What documents are needed for pre-approval?")}>
                  Pre-approval documents
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`
                    flex max-w-[85%] md:max-w-[70%]
                    ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}
                  `}>
                    <div className="flex-shrink-0 mt-1">
                      {message.role === 'assistant' ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/placeholder.svg" />
                          <AvatarFallback className="bg-brand-600 text-white">AI</AvatarFallback>
                        </Avatar>
                      ) : (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="https://github.com/shadcn.png" />
                          <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                    <div className={`
                      mx-2 px-4 py-3 rounded-lg
                      ${message.role === 'user' 
                        ? 'bg-brand-600 text-white' 
                        : 'bg-gray-100 text-gray-900'}
                    `}>
                      <div className="whitespace-pre-line">{message.content}</div>
                      <div className={`
                        text-xs mt-1
                        ${message.role === 'user' ? 'text-brand-200' : 'text-gray-500'}
                      `}>
                        {message.timestamp}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="flex flex-row">
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback className="bg-brand-600 text-white">AI</AvatarFallback>
                    </Avatar>
                    <div className="mx-2 px-4 py-3 rounded-lg bg-gray-100 text-gray-900">
                      <div className="flex space-x-2">
                        <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce"></div>
                        <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Message feedback (only show for the last AI message) */}
        {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && !loading && (
          <div className="px-4 py-2 flex justify-center">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <div>Was this response helpful?</div>
              <Button variant="outline" size="icon" className="h-7 w-7">
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7">
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Suggestions */}
        {messages.length > 0 && suggestions.length > 0 && !loading && (
          <div className="px-4 py-2 flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <Button 
                key={index} 
                variant="outline" 
                size="sm" 
                className="text-xs h-7"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}

        {/* Message input */}
        <div className="px-4 pb-4 pt-2">
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="resize-none pr-12"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              className="absolute right-2 bottom-1.5"
              size="icon"
              onClick={handleSendMessage}
              disabled={!input.trim() || loading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-gray-500 mt-1 text-center">
            The AI Assistant analyzes your lender database to provide accurate, tailored information.
          </div>
        </div>
      </div>

      {/* Context panel */}
      {contextPanelOpen && (
        <div className="w-80 border-l border-gray-200 hidden lg:block">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-medium">Context Panel</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setContextPanelOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="p-4">
            <Tabs defaultValue="context">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="context">Context</TabsTrigger>
                <TabsTrigger value="lenders">Lenders</TabsTrigger>
              </TabsList>
              <TabsContent value="context" className="space-y-4 mt-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Current Topic</h4>
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">FHA Loan Requirements</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="text-xs text-gray-500">
                        This conversation is about FHA loan requirements, interest rates, and documentation.
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Key Information</h4>
                  <div className="space-y-2">
                    <div className="p-2 bg-blue-50 rounded-md text-sm flex items-start">
                      <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                      <div>
                        <span className="font-medium text-blue-700">Minimum Credit Score:</span>
                        <span className="text-blue-700"> 580 for 3.5% down payment</span>
                      </div>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-md text-sm flex items-start">
                      <Info className="h-4 w-4 text-emerald-500 mr-2 mt-0.5" />
                      <div>
                        <span className="font-medium text-emerald-700">Current Rate Range:</span>
                        <span className="text-emerald-700"> 5.25% - 5.75%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="lenders" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Referenced Lenders</h4>
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm flex items-center">
                          <Building className="h-4 w-4 mr-2" />
                          {lenderInfo.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">FHA Min Credit Score</span>
                            <span className="font-medium">{lenderInfo.fhaInfo.minCreditScore}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Current FHA Rate</span>
                            <span className="font-medium">{lenderInfo.fhaInfo.currentRate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Down Payment</span>
                            <span className="font-medium">{lenderInfo.fhaInfo.downPayment}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Processing Time</span>
                            <span className="font-medium">{lenderInfo.fhaInfo.processingTime}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="py-2">
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          View Full Details
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Other Lenders with FHA Products</h4>
                    <div className="space-y-2">
                      <div className="p-2 bg-gray-50 rounded-md flex items-center justify-between">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm">Liberty Mortgage</span>
                        </div>
                        <Badge variant="outline" className="text-xs">5.35%</Badge>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-md flex items-center justify-between">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm">Community First CU</span>
                        </div>
                        <Badge variant="outline" className="text-xs">5.30%</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="absolute bottom-4 w-full px-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full text-xs">
                  <Info className="h-4 w-4 mr-2" />
                  How does the AI Assistant work?
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="center">
                <div className="space-y-2 text-sm">
                  <div className="font-medium">The AI Assistant:</div>
                  <ul className="list-disc pl-5 text-xs space-y-1 text-gray-600">
                    <li>Accesses your lender database to provide accurate information</li>
                    <li>Provides real-time mortgage product recommendations</li>
                    <li>Helps you quickly compare rates and requirements</li>
                    <li>Gives you instant answers to complex mortgage questions</li>
                  </ul>
                  <div className="text-xs text-gray-500 mt-2">
                    All information is kept secure and private according to our data policies.
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
