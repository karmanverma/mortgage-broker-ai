import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Check, Menu, Settings, User, LogOut } from "lucide-react";
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
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface HeaderProps {
  toggleMobileMenu: () => void;
}

// Helper function to generate breadcrumbs from path
const getBreadcrumbs = (path: string) => {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs = [];
  
  // Always start with Dashboard
  breadcrumbs.push({ label: 'Dashboard', href: '/app' });
  
  if (segments.length > 1) {
    const section = segments[1];
    const sectionLabels: Record<string, string> = {
      'clients': 'Clients',
      'lenders': 'Lenders',
      'people': 'People',
      'opportunities': 'Opportunities',
      'loans': 'Loans',
      'realtors': 'Realtors',
      'assistant': 'AI Assistant',
      'account': 'Account Settings',
      'library': 'Library'
    };
    
    const sectionLabel = sectionLabels[section] || section.charAt(0).toUpperCase() + section.slice(1);
    breadcrumbs.push({ label: sectionLabel, href: `/app/${section}` });
    
    // Add detail page if exists
    if (segments.length > 2) {
      breadcrumbs.push({ label: 'Details', href: path });
    }
  }
  
  return breadcrumbs;
};

const Header = ({ toggleMobileMenu }: HeaderProps) => {
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);
  const { user, signOut } = useAuth();
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

        {/* Breadcrumb Navigation */}
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => [
              <BreadcrumbItem key={`item-${crumb.href}`}>
                {index === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage className="font-semibold">{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>,
              index < breadcrumbs.length - 1 && <BreadcrumbSeparator key={`sep-${crumb.href}`} />
            ]).flat().filter(Boolean)}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Search bar - REMOVED */}

        {/* Right side actions - Updated colors */}
        <div className="flex items-center space-x-2 lg:space-x-4"> 
          {/* Theme Toggle */}
          <ThemeToggle />
          
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

          {/* User Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/app/account" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
    </header>
  );
};

export default Header;
