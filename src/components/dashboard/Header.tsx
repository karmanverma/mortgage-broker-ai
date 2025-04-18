import { Link, useLocation } from "react-router-dom";
import { Bell, Menu } from "lucide-react"; // Removed Search icon
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
// Removed Input import
import { cn } from "@/lib/utils";

interface HeaderProps {
  toggleMobileMenu: () => void;
}

// Helper function to get page title from path
const getPageTitle = (path: string): string => {
  // Handle potential client detail pages (e.g., /app/clients/123)
  if (path.startsWith("/app/clients/") && path !== '/app/clients') {
    return "Client Details"; // Or fetch client name if possible/needed
  }

  switch (path) {
    case '/app':
      return 'Dashboard';
    case '/app/lenders':
      return 'Lenders';
    case '/app/clients':
      return 'Clients';
    case '/app/assistant':
      return 'AI Assistant';
    case '/app/account':
      return 'Account Settings';
    default:
      return 'Dashboard'; // Fallback title
  }
};

const Header = ({ toggleMobileMenu }: HeaderProps) => {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    // Removed border-b and border-gray-200
    <header className={cn(
      "sticky top-0 z-10 h-16 bg-white flex items-center px-4 lg:px-6"
    )}>
        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden mr-2 text-gray-500 hover:text-gray-700"
          onClick={toggleMobileMenu}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </Button>

        {/* Dynamic Page Title */}
        <div className="text-lg font-semibold text-gray-800 hidden md:flex items-center whitespace-nowrap">
           {pageTitle}
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Search bar - REMOVED */}

        {/* Right side actions */}
        <div className="flex items-center space-x-2 lg:space-x-4"> 
          {/* Notification bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-gray-700">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto p-2 space-y-2">
                 {/* Example notifications */}
                <div className="p-2 hover:bg-gray-50 rounded cursor-pointer text-sm">
                  <div className="font-medium">New rate update</div>
                  <div className="text-xs text-gray-500">2 minutes ago</div>
                </div>
                <div className="p-2 hover:bg-gray-50 rounded cursor-pointer text-sm">
                  <div className="font-medium">Document uploaded</div>
                  <div className="text-xs text-gray-500">1 hour ago</div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center p-2">
                <Link to="#" className="text-sm text-brand-600 font-medium">
                  View all notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
    </header>
  );
};

export default Header;
