
import { useState, useRef, useEffect } from "react";
import { 
  Building, 
  FileText, 
  Info, 
  MessageSquare, 
  MoreHorizontal, 
  PanelLeftOpen, 
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// --- Mock Data --- 
const mockConversations = [
  { id: 1, title: "FHA loan requirements", preview: "What are the current FHA loan requirements?", date: "Today", time: "10:23 AM" },
  { id: 2, title: "Jumbo loan rates", preview: "Compare jumbo loan rates between lenders", date: "Yesterday", time: "3:45 PM" },
  { id: 3, title: "First National Bank products", preview: "Tell me about First National Bank's mortgage products", date: "May 15", time: "11:30 AM" },
];
const mockMessages = [
  { id: 1, role: "user", content: "What are the current FHA loan requirements?", timestamp: "10:23 AM" },
  { id: 2, role: "assistant", content: `Here are the current FHA loan requirements:

1. **Credit Score**: Minimum 580 for 3.5% down payment, 500-579 for 10% down.
2. **Debt-to-Income Ratio**: Typically 43%, but can go higher with compensating factors.
3. **Down Payment**: At least 3.5% of the purchase price.
4. **Mortgage Insurance**: Upfront premium of 1.75% of loan amount, plus annual MIP.
5. **Property Requirements**: Must be your primary residence and meet HUD's minimum property standards.
6. **Loan Limits**: Vary by county. For 2023, the FHA limit for low-cost areas is $472,030 for a single-family home.

Would you like specific information about any of these requirements?`, timestamp: "10:24 AM" },
  { id: 3, role: "user", content: "What are typical interest rates for FHA loans compared to conventional loans?", timestamp: "10:26 AM" },
  { id: 4, role: "assistant", content: `Currently, FHA loans typically have slightly lower interest rates compared to conventional loans, especially for borrowers with lower credit scores. Here's a comparison:

For a borrower with a credit score of 680:
- **FHA loan**: ~5.25% - 5.75%
- **Conventional loan**: ~5.50% - 6.00%

Based on your lender database, First National Bank and Liberty Mortgage currently offer competitive FHA rates at 5.25% and 5.35% respectively.

Would you like me to provide more specific rate information from your lender network?`, timestamp: "10:27 AM" }
];
const mockSuggestions = [
  "What documents do clients need for an FHA application?",
  "How long does FHA approval typically take?",
  "Are there FHA condo approval requirements?",
  "What are First National Bank's current FHA rates?"
];
const lenderInfo = {
  name: "First National Bank",
  fhaInfo: { minCreditScore: 620, currentRate: "5.25%", downPayment: "3.5% minimum", processingTime: "15-20 business days" }
};
// --- End Mock Data --- 

const AIAssistant = () => {
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState(mockConversations);
  const [activeConversation, setActiveConversation] = useState(mockConversations[0]);
  const [loading, setLoading] = useState(false);
  const [contextPanelOpen, setContextPanelOpen] = useState(false);
  const [conversationSidebarOpen, setConversationSidebarOpen] = useState(false);
  const [suggestions, setSuggestions] = useState(mockSuggestions);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Handlers (Keep existing handlers) --- 
    const handleSendMessage = () => {
    if (!input.trim()) return;
    const userMessage = { id: messages.length + 1, role: "user", content: input, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages([...messages, userMessage]);
    setInput(""); setLoading(true);
    setTimeout(() => {
      const aiMessage = { id: messages.length + 2, role: "assistant", content: `Simulated response to "${input}".`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages(prev => [...prev, aiMessage]); setLoading(false);
      setSuggestions(["Compare X and Y", "Explain Z", "Find relevant lenders"]);
    }, 1500);
  };
  const handleNewConversation = () => {
    const newConversation = { id: Date.now(), title: "New conversation", preview: "", date: "Today", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setConversations([newConversation, ...conversations]); setActiveConversation(newConversation); setMessages([]);
    setConversationSidebarOpen(false);
  };
  const handleSuggestionClick = (suggestion: string) => {
    const userMessage = { id: messages.length + 1, role: "user", content: suggestion, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages([...messages, userMessage]); setLoading(true);
    setTimeout(() => {
      const aiMessage = { id: messages.length + 2, role: "assistant", content: `Simulated response to "${suggestion}".`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages(prev => [...prev, aiMessage]); setLoading(false);
      setSuggestions(["Next steps?", "Summarize.", "Alternatives?"]);
    }, 1500);
  };

  // --- Helper: ConversationItem --- 
  const ConversationItem = ({ convo, onClick } : { convo: typeof mockConversations[0], onClick: () => void}) => (
     <div key={convo.id} className={cn(`px-3 py-2 cursor-pointer hover:bg-gray-100 group`, activeConversation.id === convo.id ? 'bg-gray-100' : '')} onClick={onClick}>
         <div className="flex items-center justify-between">
             <div className="flex items-center space-x-2 min-w-0">
                 <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                 <span className="font-medium text-sm truncate" >{convo.title}</span>
             </div>
             <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem>Rename</DropdownMenuItem><DropdownMenuItem>Export</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
         </div>
         <div className="pl-6 text-xs text-gray-500 truncate">{convo.preview}</div>
         <div className="pl-6 text-xs text-gray-400 mt-1">{convo.date} at {convo.time}</div>
     </div>
  );

  return (
    <div className="flex h-full bg-white overflow-hidden">
      
      {/* --- Mobile Conversation Sidebar --- */}
      <div className={cn(`fixed inset-y-0 left-0 z-40 w-72 border-r bg-white transform transition-transform md:hidden`, conversationSidebarOpen ? "translate-x-0" : "-translate-x-full")}>
         <div className="flex flex-col h-full"><div className="p-4 flex items-center justify-between shrink-0 border-b"><Button onClick={handleNewConversation} className="w-full mr-2"><Plus className="h-4 w-4 mr-2" />New</Button><Button variant="ghost" size="icon" onClick={() => setConversationSidebarOpen(false)}><X className="h-5 w-5" /></Button></div><div className="px-3 py-2 shrink-0"><h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent</h2></div><ScrollArea className="flex-1">{conversations.map((convo) => (<ConversationItem key={convo.id} convo={convo} onClick={() => { setActiveConversation(convo); setConversationSidebarOpen(false); }} />))}</ScrollArea></div>
      </div>
      {conversationSidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setConversationSidebarOpen(false)} />} 
      {/* --- End Mobile Sidebar --- */}

      {/* --- Desktop Conversation Sidebar --- */}
      <div className="w-72 border-r border-gray-200 hidden md:flex flex-col flex-shrink-0">
        <div className="p-4 shrink-0 border-b"><Button onClick={handleNewConversation} className="w-full"><Plus className="h-4 w-4 mr-2" />New Conversation</Button></div>
        <div className="px-3 py-2 shrink-0"><h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Conversations</h2></div>
        <ScrollArea className="flex-1">{conversations.map((convo) => (<ConversationItem key={convo.id} convo={convo} onClick={() => setActiveConversation(convo)} />))}</ScrollArea>
      </div>
      {/* --- End Desktop Sidebar --- */}

       {/* --- Main Content Area --- */} 
      <div className="flex-1 flex min-w-0 overflow-hidden">
          {/* --- Main Chat Area --- */} 
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Header */} 
              <div className="py-3 px-4 border-b flex items-center justify-between shrink-0">
                  <div className="flex items-center min-w-0"><Button variant="ghost" size="icon" onClick={() => setConversationSidebarOpen(true)} className="md:hidden mr-2"><PanelLeftOpen className="h-5 w-5" /></Button><h2 className="font-semibold truncate mr-2 flex-shrink min-w-0" title={activeConversation.title}>{activeConversation.title}</h2><Badge variant="outline" className="ml-auto md:ml-2 text-xs bg-brand-50 text-brand-700 border-brand-200 whitespace-nowrap flex-shrink-0">AI Assistant</Badge></div>
                  <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0"><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-5 w-5" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Actions</DropdownMenuLabel><DropdownMenuItem onClick={handleNewConversation}><Plus className="h-4 w-4 mr-2" />New</DropdownMenuItem><DropdownMenuItem><RefreshCw className="h-4 w-4 mr-2" />Refresh</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem><FileText className="h-4 w-4 mr-2" />Export</DropdownMenuItem></DropdownMenuContent></DropdownMenu><Button variant="ghost" size="icon" onClick={() => setContextPanelOpen(!contextPanelOpen)} className="inline-flex">{contextPanelOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}</Button></div>
              </div>
              {/* Messages */} 
              <ScrollArea className="flex-1 p-4 pb-2">
                  {messages.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-center p-4"><div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mb-4"><MessageSquare className="h-8 w-8 text-brand-600" /></div><h3 className="text-lg font-medium text-gray-900 mb-2">Mortgage AI Assistant</h3><p className="text-gray-500 max-w-md mb-6">Ask about products, lenders, rates...</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg"><Button variant="outline" onClick={() => handleSuggestionClick("Best rates?")}>Best rates?</Button><Button variant="outline" onClick={() => handleSuggestionClick("Lenders for self-employed?")}>Self-employed</Button><Button variant="outline" onClick={() => handleSuggestionClick("FHA vs Conv?")}>FHA vs Conv</Button><Button variant="outline" onClick={() => handleSuggestionClick("Pre-approval docs?")}>Pre-approval docs</Button></div></div>
                  ) : (
                     <div className="space-y-4">{messages.map((message) => (<div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`flex max-w-[85%] md:max-w-[70%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}><Avatar className={`h-8 w-8 shrink-0 mt-1 ${message.role === 'user' ? 'ml-2' : 'mr-2'}`}><AvatarImage src={message.role === 'user' ? 'https://github.com/shadcn.png' : '/placeholder.svg'} /><AvatarFallback className={message.role === 'user' ? '' : 'bg-brand-600 text-white'}>{message.role === 'user' ? 'JD' : 'AI'}</AvatarFallback></Avatar><div className={`px-4 py-3 rounded-lg ${message.role === 'user' ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-900'}`}><div className="whitespace-pre-line text-sm">{message.content}</div><div className={`text-xs mt-1 ${message.role === 'user' ? 'text-brand-200' : 'text-gray-500'}`}>{message.timestamp}</div></div></div></div>))}
                     {loading && <div className="flex justify-start"><div className="flex flex-row"><Avatar className="h-8 w-8 shrink-0 mt-1 mr-2"><AvatarFallback className="bg-brand-600 text-white">AI</AvatarFallback></Avatar><div className="mx-2 px-4 py-3 rounded-lg bg-gray-100"><div className="flex space-x-1.5"><div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce"></div><div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce delay-75"></div><div className="h-2 w-2 bg-gray-300 rounded-full animate-bounce delay-150"></div></div></div></div></div>}</div>
                  )}
                  <div ref={messagesEndRef} />
              </ScrollArea>
              {/* Input Area */} 
              <div className="shrink-0 border-t"><div className="p-4"><div className="relative"><Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about lenders, rates..." className="resize-none pr-12" rows={1} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} /><Button className="absolute right-2 bottom-1.5" size="icon" onClick={handleSendMessage} disabled={!input.trim() || loading}><Send className="h-4 w-4" /></Button></div><div className="text-xs text-gray-500 mt-1.5 text-center">AI Assistant uses your lender data.</div></div></div>
          </div>
          {/* --- End Main Chat Area --- */}

           {/* --- Unified Context Panel --- */} 
           {/* Backdrop for Mobile Overlay */} 
           {contextPanelOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setContextPanelOpen(false)} />} 
          {/* Panel Container: Uses responsive classes for positioning */} 
           <div className={cn(
               // Base styles for flex content & transition
               "bg-white border-gray-200 flex flex-col transition-transform duration-300 ease-in-out flex-shrink-0",
               // Mobile (<lg) Overlay styles
               "fixed inset-y-0 right-0 z-40 w-72 border-l",
               // Desktop (lg+) Flex item styles
               "lg:static lg:z-auto lg:w-80 lg:border-l lg:translate-x-0", 
               // Open/Close state via transform
               contextPanelOpen ? "translate-x-0" : "translate-x-full lg:hidden" // Hide on desktop when closed
           )}>
                {/* Header */} 
                <div className="p-4 border-b flex items-center justify-between shrink-0">
                    <h3 className="font-medium">Context Panel</h3>
                    <Button variant="ghost" size="icon" onClick={() => setContextPanelOpen(false)}><X className="h-4 w-4" /></Button>
                </div>
                {/* Scrollable Content */} 
                <ScrollArea className="flex-1 p-4">
                    <Tabs defaultValue="context">
                        <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="context">Context</TabsTrigger><TabsTrigger value="lenders">Lenders</TabsTrigger></TabsList>
                        {/* Context Tab Content */} 
                        <TabsContent value="context" className="space-y-4 mt-4">
                            <div><h4 className="text-sm font-medium mb-2">Current Topic</h4><Card><CardHeader className="py-3"><CardTitle className="text-sm">FHA Loan Req.</CardTitle></CardHeader><CardContent className="py-2"><div className="text-xs text-gray-500">About FHA reqs, rates, docs.</div></CardContent></Card></div>
                            <div><h4 className="text-sm font-medium mb-2">Key Info</h4><div className="space-y-2"><div className="p-2 bg-blue-50 rounded-md text-sm flex items-start"><Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5 shrink-0" /><div><span className="font-medium text-blue-700">Min Credit:</span> 580</div></div><div className="p-2 bg-emerald-50 rounded-md text-sm flex items-start"><Info className="h-4 w-4 text-emerald-500 mr-2 mt-0.5 shrink-0" /><div><span className="font-medium text-emerald-700">Rate Range:</span> 5.25%-5.75%</div></div></div></div>
                        </TabsContent>
                        {/* Lenders Tab Content */} 
                        <TabsContent value="lenders" className="mt-4 space-y-4">
                            <div><h4 className="text-sm font-medium mb-2">Referenced</h4><Card><CardHeader className="py-3"><CardTitle className="text-sm flex items-center"><Building className="h-4 w-4 mr-2" />{lenderInfo.name}</CardTitle></CardHeader><CardContent className="py-2 space-y-1.5 text-xs"><div className="flex justify-between"><span className="text-gray-500">Min Credit</span><span className="font-medium">{lenderInfo.fhaInfo.minCreditScore}</span></div><div className="flex justify-between"><span className="text-gray-500">Rate</span><span className="font-medium">{lenderInfo.fhaInfo.currentRate}</span></div></CardContent></Card></div>
                            <div><h4 className="text-sm font-medium mb-2">Other Lenders</h4><div className="space-y-2"><div className="p-2 bg-gray-50 rounded-md flex items-center justify-between"><div className="flex items-center"><Building className="h-4 w-4 text-gray-400 mr-2" /><span className="text-sm">Liberty Mtg</span></div><Badge variant="outline" className="text-xs">5.35%</Badge></div><div className="p-2 bg-gray-50 rounded-md flex items-center justify-between"><div className="flex items-center"><Building className="h-4 w-4 text-gray-400 mr-2" /><span className="text-sm">Community CU</span></div><Badge variant="outline" className="text-xs">5.30%</Badge></div></div></div>
                        </TabsContent>
                    </Tabs>
                </ScrollArea>
                {/* Footer */} 
                <div className="p-4 border-t shrink-0">
                    <Popover>
                        <PopoverTrigger asChild><Button variant="outline" size="sm" className="w-full text-xs"><Info className="h-4 w-4 mr-2" />How does AI work?</Button></PopoverTrigger>
                        <PopoverContent className="w-80 mx-2" align="start" side="top">
                            <div className="space-y-2 text-sm"><div className="font-medium">The AI Assistant:</div><ul className="list-disc pl-5 text-xs space-y-1 text-gray-600"><li>Accesses lender data</li><li>Provides recommendations</li><li>Compares rates & reqs</li><li>Answers questions</li></ul><div className="text-xs text-gray-500 mt-2">Data is secure.</div></div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
           {/* --- End Unified Context Panel --- */} 

      </div>
       {/* --- End Main Content Area --- */}
    </div>
  );
};

export default AIAssistant;
