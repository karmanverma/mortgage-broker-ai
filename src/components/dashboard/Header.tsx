import { Link, useLocation } from "react-router-dom";
import { Bell, Check, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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
    case '/app/library':
      return 'Library';
    default:
      return 'Dashboard'; // Fallback title
  }
};

const Header = ({ toggleMobileMenu }: HeaderProps) => {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        
        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.read).length || 0);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
    
    // Set up real-time subscription for new notifications
    const subscription = supabase
      .channel('notifications-channel')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, payload => {
        setNotifications(prev => [payload.new, ...prev.slice(0, 9)]);
        setUnreadCount(count => count + 1);
      })
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [user]);
  
  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(count => Math.max(0, count - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const markAllAsRead = async () => {
    if (notifications.length === 0) return;
    try {
      const unreadIds = notifications
        .filter(n => !n.read)
        .map(n => n.id);
      
      if (unreadIds.length === 0) return;
      
      await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    // Updated bg color to baby-powder
    <header className={cn(
      "sticky top-0 z-10 h-16 bg-background flex items-center px-4 lg:px-6"
    )}>
        {/* Mobile Menu Toggle - Updated color classes */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden mr-2 text-muted-foreground hover:text-foreground"
          onClick={toggleMobileMenu}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </Button>

        {/* Dynamic Page Title - Updated text color */}
        <div className="text-lg font-semibold text-foreground hidden md:flex items-center whitespace-nowrap">
           {pageTitle}
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Search bar - REMOVED */}

        {/* Right side actions - Updated colors */}
        <div className="flex items-center space-x-2 lg:space-x-4"> 
          {/* Notification bell - Updated colors */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between p-2">
                <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs">
                    Mark all as read
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto p-2 space-y-2">
                {loading ? (
                  <div className="flex justify-center p-4">
                    <LoadingSpinner size="md" />
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={cn(
                        "p-2 hover:bg-secondary rounded cursor-pointer text-sm relative",
                        !notification.read && "bg-muted/40"
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="font-medium">{notification.message}</div>
                      <div className="text-xs text-muted-foreground flex justify-between items-center mt-1">
                        <span>
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        {!notification.read && (
                          <Badge variant="outline" className="ml-2 px-1 py-0 h-5 bg-primary/10">
                            New
                          </Badge>
                        )}
                      </div>
                      {!notification.read && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                )}
              </div>

            </DropdownMenuContent>
          </DropdownMenu>
        </div>
    </header>
  );
};

export default Header;
