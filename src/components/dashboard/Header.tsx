import { Link } from "react-router-dom";
import { Bell, Menu, Search, PanelLeftClose, PanelRightClose } from "lucide-react"; // Added Panel icons
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface HeaderProps {
  toggleSidebar: () => void;
  sidebarOpen: boolean;
  toggleMobileMenu: () => void;
}

const Header = ({ toggleSidebar, sidebarOpen, toggleMobileMenu }: HeaderProps) => {
  return (
    // Remains sticky
    <header className={cn(
      "sticky top-0 z-10 h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6"
    )}>
        {/* Mobile Menu Toggle (burger icon) - only on small screens */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden mr-2 text-gray-500 hover:text-gray-700"
          onClick={toggleMobileMenu}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </Button>

        {/* Desktop Sidebar Toggle (panel icon) - only on large screens */}
         <Button
           variant="ghost"
           size="icon"
           className="hidden lg:inline-flex mr-2 text-gray-500 hover:text-gray-700"
           onClick={toggleSidebar}
           aria-label="Toggle sidebar"
         >
           {/* Optionally change icon based on state */}
           {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelRightClose size={20} />}
         </Button>

        {/* Breadcrumbs Placeholder */}
        <div className="text-sm font-medium text-gray-600 hidden md:flex items-center space-x-2 whitespace-nowrap">
           {/* Example breadcrumb structure */}
           <Link to="/app" className="hover:text-gray-900">Dashboard</Link>
           {/* In a real app, generate this dynamically based on route */}
           {/* <span className="text-gray-400">/</span> */}
           {/* <span className="text-gray-900">Current Page</span> */}
        </div>


        {/* Spacer to push search/notifications right */}
        <div className="flex-1"></div>

        {/* Search bar - adjust width/placement as needed */}
        <div className="w-full max-w-xs sm:max-w-sm lg:max-w-md mx-4 hidden sm:block"> {/* Adjusted width and margin */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="search"
              placeholder="Search..." // Simplified placeholder
              className="pl-10 py-2 h-9 bg-gray-50 border-0" // Adjusted height
            />
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-2 lg:space-x-4"> {/* Reduced spacing */}
          {/* Notification bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-gray-700">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              {/* Notification items... */}
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
           {/* User profile dropdown is in the Sidebar */}
        </div>
    </header>
  );
};

export default Header;
