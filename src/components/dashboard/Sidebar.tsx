import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  EnhancedAvatar
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import {
  Building,
  Home,
  Library,
  LogOut,
  MessageSquare,
  PanelLeftClose,
  PanelRightClose,
  PlusCircle,
  Settings, // Placeholder for potential future use
  // Removed Sparkles import
  User,
  Users,
  Contact,
  Target,
  DollarSign,
  MapPin,
  FileText,
  CheckSquare,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useImprovedConversations } from '@/hooks/useImprovedConversations';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  onClose: () => void; // For mobile overlay close
  isMobile: boolean;
}

const Sidebar = ({ isOpen, toggleSidebar, onClose, isMobile }: SidebarProps) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const {
    conversations,
    loading: conversationsLoading,
    setActiveConversation,
  } = useImprovedConversations();

  const navigation = [
    { name: 'Dashboard', href: '/app', icon: Home },
    { name: 'People', href: '/app/people', icon: Contact },
    { name: 'Opportunities', href: '/app/opportunities', icon: Target },
    { name: 'Clients', href: '/app/clients', icon: Users },
    { name: 'Loans', href: '/app/loans', icon: DollarSign },
    { name: 'Lenders', href: '/app/lenders', icon: Building },
    { name: 'Realtors', href: '/app/realtors', icon: MapPin },
    { name: 'Notes', href: '/app/notes', icon: FileText },
    { name: 'To-dos', href: '/app/todos', icon: CheckSquare },
    { name: 'AI Assistant', href: '/app/assistant', icon: MessageSquare },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Handle logo click: open sidebar if closed, else navigate to /app
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isOpen && !isMobile) {
      toggleSidebar();
    } else {
      navigate('/app');
    }
  };

  // Helper: truncate message for preview
  const truncateMessage = (msg: string, maxLen = 30) => {
    if (!msg) return '';
    return msg.length > maxLen ? msg.slice(0, maxLen) + '…' : msg;
  };

  // Render AI Assistant menu item with last 4 conversations + View All
  const renderAIAssistantMenu = () => {
    // Sort conversations by created_at descending (updated_at may not be available)
    const sorted = (conversations || []).slice().sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return bTime - aTime;
    });
    const lastFour = sorted.slice(0, 4);
    
    return (
      <div>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'flex items-center px-3 py-2 rounded-md text-sm font-medium group cursor-pointer',
                !isOpen && !isMobile && 'justify-center',
                currentPath.startsWith('/app/assistant')
                  ? 'bg-secondary text-primary'
                  : 'text-foreground hover:bg-secondary hover:text-foreground'
              )}
              onClick={() => navigate('/app/assistant')}
            >
              <MessageSquare
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  (isOpen || isMobile) ? 'mr-3' : 'mr-0',
                  currentPath.startsWith('/app/assistant') ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              {(isOpen || isMobile) && <span className="flex-1 truncate">AI Assistant</span>}
            </div>
          </TooltipTrigger>
          {(!isOpen && !isMobile) && (
            <TooltipContent side="right" sideOffset={5}>
              AI Assistant
            </TooltipContent>
          )}
        </Tooltip>
        
        {/* Show last 4 conversations + View All */}
        {(isOpen || isMobile) && (
          <div className="ml-8 mt-2 space-y-1">
            {lastFour.map((conv) => (
              <div
                key={conv.session_id}
                className="cursor-pointer text-xs text-muted-foreground hover:text-primary truncate py-1 px-2 rounded hover:bg-secondary/50"
                title={conv.message}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveConversation(conv.session_id);
                  navigate(`/app/assistant?mode=chat&session=${conv.session_id}`);
                }}
              >
                {truncateMessage(conv.message)}
              </div>
            ))}
            {/* View All link */}
            <div
              className="cursor-pointer text-xs text-primary hover:text-primary/80 py-1 px-2 rounded hover:bg-secondary/50 font-medium"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/app/assistant?mode=library');
              }}
            >
              View all conversations →
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn(
        `flex flex-col h-full bg-sidebar border-r border-sidebar-border shadow-sm`,
        isMobile ? 'w-64' : 'transition-all duration-300 ease-in-out',
        !isMobile && (isOpen ? 'w-64' : 'w-16')
      )}>
        {/* Header Section */}
        <div className={cn(
          'flex items-center h-16 px-4 border-b border-sidebar-border shrink-0',
          !isOpen && !isMobile && 'justify-center'
        )}>
          <a href="/app" onClick={handleLogoClick} className="flex items-center space-x-2 cursor-pointer">
            <div className={cn('h-8 w-8 bg-primary rounded-md flex items-center justify-center flex-shrink-0', !isOpen && !isMobile && 'mr-0')}>
              <span className="text-primary-foreground font-bold">MB</span>
            </div>
            {(isOpen || isMobile) && (
              <span className="text-lg font-semibold text-foreground truncate">MortgagePro</span>
            )}
          </a>
          {/* Toggle Button: only show in open state, aligned right */}
          {!isMobile && isOpen && (
            <div className="ml-auto flex justify-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    aria-label="Collapse sidebar"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <PanelLeftClose size={20} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={5}>
                  Collapse
                </TooltipContent>
              </Tooltip>
            </div>
          )}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden ml-auto"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <nav className="space-y-1">
            {navigation.map((item) => {
              if (item.name === 'AI Assistant') {
                return <div key="AI Assistant">{renderAIAssistantMenu()}</div>;
              }
              const isActive = currentPath === item.href ||
                (item.href !== '/app' && currentPath.startsWith(item.href)) ||
                (item.href === '/app' && currentPath === '/app');
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.href}
                      className={cn(
                        'flex items-center px-3 py-2 rounded-md text-sm font-medium group',
                        !isOpen && !isMobile && 'justify-center',
                        isActive
                          ? 'bg-secondary text-primary'
                          : 'text-foreground hover:bg-secondary hover:text-foreground'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-5 w-5 flex-shrink-0',
                          (isOpen || isMobile) ? 'mr-3' : 'mr-0',
                          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                        )}
                      />
                      {(isOpen || isMobile) && (
                        <span className="flex-1 truncate">{item.name}</span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  {(!isOpen && !isMobile) && (
                    <TooltipContent side="right" sideOffset={5}>
                      {item.name}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </nav>
        </div>
        {/* Bottom Section: User Profile and Toggle Button (when closed) */}
        <div>
          {!isMobile && !isOpen && (
            <div className="w-full flex justify-center z-10 pt-2 pb-3 bg-sidebar">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    aria-label="Expand sidebar"
                    className="text-muted-foreground hover:text-foreground shadow"
                  >
                    <PanelRightClose size={20} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={5}>
                  Expand
                </TooltipContent>
              </Tooltip>
            </div>
          )}
          <div className="border-t border-sidebar-border shrink-0">
            {/* User Profile Dropdown - Refactored */}
            <div className={cn('p-3', !isOpen && !isMobile && 'px-0 py-3 flex justify-center')}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      'flex items-center w-full px-2 py-1.5',
                      isOpen ? 'justify-start' : 'justify-center'
                    )}
                    data-testid="sidebar-user-profile"
                  >
                    <EnhancedAvatar
                      size="md"
                      showHoverEffect={true}
                      data={{
                        avatar_url: user?.user_metadata?.avatar_url,
                        email: user?.email,
                        name: user?.user_metadata?.full_name,
                        display_name: user?.user_metadata?.full_name || user?.email
                      }}
                    />
                    {isOpen && (
                      <span className="ml-3 font-medium text-foreground truncate" data-testid="sidebar-user-fullname">
                        {user?.user_metadata?.full_name || user?.email || 'No Name'}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                {/* Dropdown content remains the same */}
                <DropdownMenuContent align="start" side="top" className="w-56 mb-1 ml-2">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  {(user?.user_metadata?.full_name || user?.email) && (
                    <div className="px-2 text-xs text-muted-foreground -mt-1 mb-1 truncate">
                      {user?.user_metadata?.full_name && <div className="truncate">{user.user_metadata.full_name}</div>}
                      {user?.email && <div className="truncate">{user.email}</div>}
                    </div>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <div className="px-2 py-1.5 text-sm">
                      <span className="font-medium">Pro Plan</span>
                      <span className="text-muted-foreground text-xs block">Active until Dec 2024</span>
                    </div>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/app/account" className="w-full flex items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" /> Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Sidebar;
