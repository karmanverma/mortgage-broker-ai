
import { Link } from "react-router-dom";
import { 
  Bell, 
  ChevronDown, 
  Menu, 
  Search, 
  User 
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  toggleSidebar: () => void;
  sidebarOpen: boolean;
  toggleMobileMenu: () => void;
}

const Header = ({ toggleSidebar, sidebarOpen, toggleMobileMenu }: HeaderProps) => {
  return (
    <header className="fixed top-0 right-0 left-0 lg:left-auto z-30 h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6">
      {/* Mobile menu button */}
      <button
        className="lg:hidden mr-4 text-gray-500 hover:text-gray-700"
        onClick={toggleMobileMenu}
      >
        <Menu size={24} />
      </button>

      {/* Toggle sidebar button (visible on larger screens) */}
      <button
        className="hidden lg:block mr-4 text-gray-500 hover:text-gray-700"
        onClick={toggleSidebar}
      >
        <Menu size={24} />
      </button>

      {/* Search bar */}
      <div className="flex-1 lg:max-w-xl mx-auto hidden sm:block">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="search"
            placeholder="Search for lenders, rates, documents..."
            className="pl-10 py-2 bg-gray-50 border-0"
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-3 lg:space-x-6 ml-auto">
        {/* Notification bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              <div className="py-2 px-3 hover:bg-gray-50 cursor-pointer">
                <div className="font-medium text-sm">New rate update</div>
                <div className="text-xs text-gray-500">2 minutes ago</div>
              </div>
              <div className="py-2 px-3 hover:bg-gray-50 cursor-pointer">
                <div className="font-medium text-sm">Document uploaded</div>
                <div className="text-xs text-gray-500">1 hour ago</div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center">
              <Link to="#" className="text-sm text-brand-600 font-medium">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-0 h-8 hover:bg-transparent">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 text-gray-500 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link to="/app/account" className="w-full">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link to="/app/account?tab=subscription" className="w-full">Subscription</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link to="/" className="w-full">Log out</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
