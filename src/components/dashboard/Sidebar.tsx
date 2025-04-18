import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Avatar,
  AvatarFallback,
  AvatarImage
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
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

  const navigation = [
    { name: 'Dashboard', href: '/app', icon: Home },
    { name: 'Lenders', href: '/app/lenders', icon: Building },
    { name: 'Clients', href: '/app/clients', icon: Users },
    { name: 'AI Assistant', href: '/app/assistant', icon: MessageSquare },
    // Removed AI Assist link
    { name: 'Library', href: '/app/library', icon: Library },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn(
        `flex flex-col h-full bg-white border-r border-gray-200 shadow-sm`,
        isMobile ? "w-64" : "transition-all duration-300 ease-in-out",
        !isMobile && (isOpen ? "w-64" : "w-16")
      )}>
        {/* Header Section */} 
        <div className={cn(
          "flex items-center h-16 px-4 border-b border-gray-200 shrink-0",
          !isOpen && !isMobile && "justify-center"
        )}>
          <Link to="/" className="flex items-center space-x-2">
             <div className={cn("h-8 w-8 bg-brand-600 rounded-md flex items-center justify-center flex-shrink-0", !isOpen && !isMobile && "mr-0")}>
               <span className="text-white font-bold">MB</span>
             </div>
            {(isOpen || isMobile) && (
              <span className="text-lg font-semibold text-gray-900 truncate">MortgagePro</span>
            )}
          </Link>
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

        {/* Add (+) Button */} 
        <div className={cn("px-3 mt-4", !isOpen && !isMobile && "px-0 flex justify-center")}> 
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size={!isMobile && !isOpen ? "icon" : "default"} 
                className={cn(
                  "w-full flex items-center",
                  !isMobile && !isOpen ? "justify-center w-10 h-10" : "justify-center", 
                   (isMobile || isOpen) && "justify-start" 
                )}
                aria-label="Add New"
              >
                <PlusCircle className={cn("h-5 w-5", (isOpen || isMobile) && "mr-2")} /> 
                {(isOpen || isMobile) && <span className="truncate">Add New</span>} 
              </Button>
            </TooltipTrigger>
             {(!isOpen && !isMobile) && (
              <TooltipContent side="right" sideOffset={5}>
                Add New
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Main Navigation */} 
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = currentPath === item.href ||
                (item.href !== '/app' && currentPath.startsWith(item.href)) ||
                (item.href === '/app' && currentPath === '/app');

              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-md text-sm font-medium group",
                        !isOpen && !isMobile && "justify-center",
                        isActive
                          ? "bg-brand-50 text-brand-600"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 flex-shrink-0",
                          (isOpen || isMobile) ? "mr-3" : "mr-0",
                          isActive ? "text-brand-600" : "text-gray-400 group-hover:text-gray-500"
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

        {/* Bottom Section: Toggle Button and User Profile */} 
        <div className="border-t border-gray-200 shrink-0">
           {/* Desktop Toggle Button */} 
           {!isMobile && (
            <div className={cn("p-3 flex", isOpen ? "justify-end" : "justify-center")}> 
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {isOpen ? <PanelLeftClose size={20} /> : <PanelRightClose size={20} />}
                  </Button>
                </TooltipTrigger>
                 <TooltipContent side="right" sideOffset={5}>
                  {isOpen ? "Collapse" : "Expand"}
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* User Profile Dropdown - Refactored */} 
          <div className={cn("p-3", !isOpen && !isMobile && "px-0 py-3 flex justify-center")}> 
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* Conditionally render Tooltip wrapper only when collapsed */} 
                {(!isOpen && !isMobile) ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* Collapsed Icon Button - This is the single child for TooltipTrigger */} 
                      <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 hover:bg-gray-100">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.user_metadata?.avatar_url || "https://github.com/shadcn.png"} />
                          <AvatarFallback>{user?.email ? user.email.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={5}>
                      {user?.user_metadata?.full_name || user?.email || "My Account"}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  /* Expanded Button View - This is the single child for DropdownMenuTrigger */ 
                  <Button variant="ghost" className="w-full justify-start px-2 py-1.5 h-auto hover:bg-gray-100">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={user?.user_metadata?.avatar_url || "https://github.com/shadcn.png"} />
                      <AvatarFallback>{user?.email ? user.email.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left overflow-hidden">
                      <div className="text-sm font-medium text-gray-800 truncate">{user?.user_metadata?.full_name || user?.email || "User Name"}</div>
                    </div>
                  </Button>
                )}
              </DropdownMenuTrigger>

              {/* Dropdown content remains the same */} 
              <DropdownMenuContent align="start" side="top" className="w-56 mb-1 ml-2">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                {(user?.user_metadata?.full_name || user?.email) && (
                    <div className="px-2 text-xs text-gray-500 -mt-1 mb-1 truncate"> 
                      {user?.user_metadata?.full_name && <div className="truncate">{user.user_metadata.full_name}</div>}
                      {user?.email && <div className="truncate">{user.email}</div>}
                    </div>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <div className="px-2 py-1.5 text-sm">
                    <span className="font-medium">Pro Plan</span>
                    <span className="text-gray-500 text-xs block">Active until Dec 2024</span>
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
    </TooltipProvider>
  );
};

export default Sidebar;
