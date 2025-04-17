
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
  ChevronDown,
  ChevronRight,
  Home,
  LogOut,
  MessageSquare,
  User,
  Users, // Added Users icon
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  onClose: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, signOut } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/app', icon: Home },
    { name: 'Lenders', href: '/app/lenders', icon: Building },
    { name: 'Clients', href: '/app/clients', icon: Users }, // Added Clients link
    { name: 'AI Assistant', href: '/app/assistant', icon: MessageSquare },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className={`flex flex-col h-full w-64 bg-white border-r border-gray-200 shadow-sm`}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 shrink-0">
        <Link to="/" className="flex items-center">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-brand-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold">MB</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">MortgagePro</span>
          </div>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = currentPath === item.href ||
             // Check if the current path starts with the item href, but isn't just /app
             (item.href !== '/app' && currentPath.startsWith(item.href)) ||
             // Special case for /app to only be active when it's exactly /app
             (item.href === '/app' && currentPath === '/app');

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium group",
                  isActive
                    ? "bg-brand-50 text-brand-600"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-brand-600" : "text-gray-400 group-hover:text-gray-500"
                  )}
                />
                <span className="flex-1">{item.name}</span>
                {/* Optionally show chevron only if active AND has sub-items (not applicable here) */}
                {/* <ChevronRight className={cn("h-4 w-4", isActive ? "text-brand-600" : "text-gray-400 opacity-0 group-hover:opacity-100")} /> */}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile Dropdown */}
      <div className="p-3 border-t border-gray-200 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start px-2 py-1.5 h-auto hover:bg-gray-100">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={user?.user_metadata?.avatar_url || "https://github.com/shadcn.png"} />
                <AvatarFallback>{user?.email ? user.email.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left overflow-hidden">
                 <div className="text-sm font-medium text-gray-800 truncate">{user?.user_metadata?.full_name || user?.email || "User Name"}</div>
                 <div className="text-xs text-gray-500 truncate">{user?.email || "user@example.com"}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500 ml-1 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56 mb-1 ml-2">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
  );
};

export default Sidebar;
