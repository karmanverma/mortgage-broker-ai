
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart, 
  Building, 
  ChevronRight, 
  Home, 
  MessageSquare, 
  Settings, 
  User, 
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const navigation = [
    { name: 'Dashboard', href: '/app', icon: Home },
    { name: 'Lenders', href: '/app/lenders', icon: Building },
    { name: 'AI Assistant', href: '/app/assistant', icon: MessageSquare },
    { name: 'My Account', href: '/app/account', icon: User },
  ];

  return (
    <div className={`flex flex-col h-full w-64 bg-white border-r border-gray-200 shadow-sm`}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
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
      
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = currentPath === item.href || 
              (item.href !== '/app' && currentPath.startsWith(item.href));
            
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
                {isActive && <ChevronRight className="h-4 w-4 text-brand-600" />}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center mb-3">
            <div className="h-8 w-8 bg-brand-100 rounded-full flex items-center justify-center mr-3">
              <BarChart className="h-4 w-4 text-brand-600" />
            </div>
            <div>
              <div className="text-sm font-medium">Pro Plan</div>
              <div className="text-xs text-gray-500">Active until Dec 2024</div>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-xs"
          >
            Manage Subscription
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
