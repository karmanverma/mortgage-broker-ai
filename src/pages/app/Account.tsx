import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Tables } from "@/types/supabase";

// Icons
import { 
  Bell, 
  CreditCard, 
  Download, 
  Lock, 
  Mail, 
  Save, 
  Shield, 
  User, 
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage, EnhancedAvatar } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogFooter,
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";

// Select
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";

// Simulated user data
const userData = {
  name: "John Doe",
  email: "johndoe@example.com",
  company: "Ace Mortgage Brokers",
  phone: "(555) 123-4567",
  avatar: "https://github.com/shadcn.png",
  subscription: {
    plan: "Professional",
    status: "Active",
    renewalDate: "Dec 15, 2023",
    price: "$79/month",
    features: [
      "Unlimited lender records",
      "Advanced AI assistant (500 queries/month)",
      "Document storage (20GB)",
      "Priority email & chat support",
      "API access"
    ],
    usage: {
      lenders: {
        used: 42,
        total: "Unlimited"
      },
      aiQueries: {
        used: 78,
        total: 500,
        percentage: 15.6
      },
      storage: {
        used: 2.1,
        total: 20,
        percentage: 10.5
      }
    }
  },
  notifications: {
    email: {
      updates: true,
      marketing: false,
      newRates: true,
      newDocuments: true
    },
    push: {
      updates: true,
      marketing: false,
      newRates: false,
      newDocuments: true
    }
  },
  security: {
    twoFactorEnabled: false,
    lastPasswordChange: "August 14, 2023",
    loginHistory: [
      {
        device: "Chrome on Windows",
        location: "Boston, MA",
        time: "Today at 10:32 AM"
      },
      {
        device: "Safari on iPhone",
        location: "Boston, MA",
        time: "Yesterday at 3:45 PM"
      },
      {
        device: "Chrome on Windows",
        location: "New York, NY",
        time: "May 14 at 9:12 AM"
      }
    ]
  },
  billing: {
    paymentMethod: {
      type: "Credit Card",
      last4: "4242",
      expiry: "04/24",
      brand: "Visa"
    },
    invoices: [
      {
        id: "INV-001",
        date: "May 1, 2023",
        amount: "$79.00",
        status: "Paid"
      },
      {
        id: "INV-002",
        date: "April 1, 2023",
        amount: "$79.00",
        status: "Paid"
      },
      {
        id: "INV-003",
        date: "March 1, 2023",
        amount: "$79.00",
        status: "Paid"
      }
    ]
  }
};

const Account = () => {
  // Avatar dialog state and hook
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const { uploading, error: avatarError, preview, onFileChange, uploadAvatar, reset } = useAvatarUpload();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  
  const { user: authUser, initialized } = useAuth();
  const authLoading = !initialized;
  
  // Profile state
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!authUser?.id) {
        setProfileLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
          
        if (error) {
          console.error('Error fetching profile:', error);
          setProfile(null);
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };
    
    if (initialized) {
      fetchProfile();
    }
  }, [authUser?.id, initialized]);
  
  // Add direct Supabase profile update function
  const updateProfile = async (updates: Partial<Tables<'profiles'>>) => {
    if (!authUser?.id) throw new Error("User not authenticated");
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', authUser.id);
      
    if (error) throw error;
    
    return { data: true };
  };
  const [loading, setLoading] = useState(false);
  const [localProfile, setLocalProfile] = useState({
    first_name: '',
    last_name: '',
    company_name: '',
    avatar_url: '',
    email: '',
    phone: '',
    notifications: {
      email: {
        updates: false,
        marketing: false,
        newRates: false,
        newDocuments: false
      },
      push: {
        updates: false,
        marketing: false,
        newRates: false,
        newDocuments: false
      }
    },
    security: {
      twoFactorEnabled: false,
      lastPasswordChange: ''
    }
  });
  
  const [passwordFields, setPasswordFields] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const { toast } = useToast();

  // Initialize local profile state when profile is loaded
  useEffect(() => {
    if (profile) {
      // Only sync fields that are guaranteed to exist on the profile type.
      // Other fields like phone, notifications, and security will be managed
      // in the local state until the database schema is updated.
      setLocalProfile(prev => ({
        ...prev,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        company_name: profile.company_name || '',
        avatar_url: profile.avatar_url || '',
        email: authUser?.email || '',
        // The following are not on the profile type, so we don't sync them.
        // phone: (profile as any).phone || '', 
        // notifications: (profile as any).notifications || prev.notifications,
        // security: (profile as any).security || prev.security,
      }));
    }
  }, [profile, authUser]);

  // Show loading state while auth is initializing or profile is loading
  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Handle case where user is loaded but profile is not
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h2 className="text-xl font-semibold text-destructive">Error Loading Profile</h2>
        <p className="text-muted-foreground mt-2">
          We couldn't load your profile data. Please try refreshing the page or contact support if the problem persists.
        </p>
      </div>
    );
  }

  // Handle form submission for profile update
  const handleProfileUpdate = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      await updateProfile({
        first_name: localProfile.first_name,
        last_name: localProfile.last_name,
        company_name: localProfile.company_name,
        avatar_url: localProfile.avatar_url
      });
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Update failed",
        description: err.message || "Could not update profile.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle notification preference update
  const updateNotificationPreference = (
    channel: 'email' | 'push', 
    type: 'updates' | 'marketing' | 'newRates' | 'newDocuments', 
    value: boolean
  ) => {
    setLocalProfile({
      ...localProfile,
      notifications: {
        ...localProfile.notifications,
        [channel]: {
          ...localProfile.notifications[channel],
          [type]: value
        }
      }
    });
    
    toast({
      title: "Preferences updated",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} notifications ${value ? 'enabled' : 'disabled'}.`,
    });
  };

  // Handle password update
  const handlePasswordUpdate = () => {
    if (passwordFields.newPassword !== passwordFields.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation don't match.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setPasswordFields({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
    }, 1000);
  };

  // Toggle two-factor authentication
  const toggleTwoFactor = (enabled: boolean) => {
    setLocalProfile({
      ...localProfile,
      security: {
        ...localProfile.security,
        twoFactorEnabled: enabled
      }
    });
    
    toast({
      title: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'}`,
      description: enabled 
        ? "Your account is now more secure."
        : "Two-factor authentication has been turned off.",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        {/* <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1> Removed main page title as it is now in header */}
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList className="bg-transparent border-b pb-px w-full justify-start rounded-none gap-6">
          <TabsTrigger
            value="profile"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="subscription"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Subscription
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and company details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="flex flex-col items-center gap-2">
                  <EnhancedAvatar
                    className="h-24 w-24"
                    data={{
                      avatar_url: localProfile.avatar_url || '',
                      email: localProfile.email || '',
                      first_name: localProfile.first_name || '',
                      last_name: localProfile.last_name || '',
                      display_name: `${localProfile.first_name || ''} ${localProfile.last_name || ''}`
                    }}
                    size="xl"
                    showHoverEffect
                  />
                  <Dialog open={avatarDialogOpen} onOpenChange={open => { setAvatarDialogOpen(open); if (!open) reset(); }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Change Avatar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Avatar</DialogTitle>
                        <DialogDescription>Choose a new profile picture (max 2MB, image only).</DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col items-center gap-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={onFileChange}
                          aria-label="Upload avatar"
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-accent-foreground hover:file:bg-accent/80"
                        />
                        {preview && (
                          <img src={preview} alt="Avatar preview" className="w-24 h-24 rounded-full object-cover border" />
                        )}
                        {avatarError && <div className="text-red-500 text-sm">{avatarError}</div>}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => { setAvatarDialogOpen(false); reset(); }} disabled={uploading}>
                          Cancel
                        </Button>
                        <Button
                          onClick={async () => {
                            const url = await uploadAvatar();
                            if (url) {
                              setAvatarDialogOpen(false);
                              reset();
                              toast({ title: "Avatar updated", description: "Your profile picture has been updated." });
                            }
                          }}
                          disabled={uploading}
                        >
                          {uploading ? "Uploading..." : "Save"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="grid flex-1 gap-4 w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        value={localProfile.first_name || ''}
                        onChange={e => setLocalProfile({...localProfile, first_name: e.target.value})}
                        disabled={loading || authLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        value={localProfile.last_name || ''}
                        onChange={e => setLocalProfile({...localProfile, last_name: e.target.value})}
                        disabled={loading || authLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Company</Label>
                      <Input
                        id="company_name"
                        value={localProfile.company_name || ''}
                        onChange={e => setLocalProfile({...localProfile, company_name: e.target.value})}
                        disabled={loading || authLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={localProfile.phone}
                        onChange={(e) => setLocalProfile({...localProfile, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select defaultValue="America/New_York">
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                    <SelectItem value="Pacific/Honolulu">Hawaii Time (HT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button onClick={handleProfileUpdate} disabled={loading || authLoading}>
                {(loading || authLoading) ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader className="pb-3">
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>
                  You are currently on the {userData.subscription && userData.subscription.plan ? userData.subscription.plan : 'Free'} plan
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-xl">{userData.subscription && userData.subscription.plan ? userData.subscription.plan : 'Free'}</h3>
                      <p className="text-sm text-muted-foreground">{userData.subscription && userData.subscription.price ? userData.subscription.price : ''}</p>
                    </div>
                    <Badge>{userData.subscription && userData.subscription.status ? userData.subscription.status : ''}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Includes:</h4>
                    <ul className="space-y-2">
                      {userData.subscription && userData.subscription.features ? userData.subscription.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <div className="mr-2 h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-primary"></div>
                          </div>
                          {feature}
                        </li>
                      )) : []}
                    </ul>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Current Usage:</h4>
                    <div className="space-y-4">
                      {userData.subscription && userData.subscription.usage && userData.subscription.usage.aiQueries ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>AI Queries</span>
                            <span>
                              {userData.subscription.usage.aiQueries.used} / {userData.subscription.usage.aiQueries.total}
                            </span>
                          </div>
                          <Progress value={userData.subscription.usage.aiQueries.percentage} />
                        </div>
                      ) : null}
                      
                      {userData.subscription && userData.subscription.usage && userData.subscription.usage.storage ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Storage</span>
                            <span>
                              {userData.subscription.usage.storage.used} GB / {userData.subscription.usage.storage.total} GB
                            </span>
                          </div>
                          <Progress value={userData.subscription.usage.storage.percentage} />
                        </div>
                      ) : null}
                      
                      {userData.subscription && userData.subscription.usage && userData.subscription.usage.lenders ? (
                        <div className="flex items-center justify-between text-sm">
                          <span>Lenders</span>
                          <span>
                            {userData.subscription.usage.lenders.used} / {userData.subscription.usage.lenders.total}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                <div className="text-sm text-muted-foreground">
                  Renews on {userData.subscription && userData.subscription.renewalDate ? userData.subscription.renewalDate : ''}
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">Cancel Plan</Button>
                  <Button size="sm">Change Plan</Button>
                </div>
              </CardFooter>
            </Card>
            
            <Card className="lg:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>
                  Manage your payment methods and billing history
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3 space-y-4">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{userData.billing && userData.billing.paymentMethod && userData.billing.paymentMethod.brand ? userData.billing.paymentMethod.brand : ''} •••• {userData.billing && userData.billing.paymentMethod && userData.billing.paymentMethod.last4 ? userData.billing.paymentMethod.last4 : ''}</div>
                      <div className="text-sm text-muted-foreground">Expires {userData.billing && userData.billing.paymentMethod && userData.billing.paymentMethod.expiry ? userData.billing.paymentMethod.expiry : ''}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button variant="outline" size="sm">
                    Manage Payment Methods
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Recent Invoices</h4>
                  <div className="space-y-2">
                    {userData.billing && userData.billing.invoices ? userData.billing.invoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{invoice.date}</div>
                            <div className="text-xs text-muted-foreground">{invoice.id}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-sm font-medium">{invoice.amount}</div>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )) : []}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-6">
                <Button variant="outline" size="sm">
                  View All Invoices
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
              <CardDescription>
                Choose the best plan for your needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup defaultValue="professional" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <RadioGroupItem
                    value="starter"
                    id="starter"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="starter"
                    className="flex flex-col justify-between gap-2 rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">Starter</span>
                      <span className="text-xs">For small brokerages</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">$49</span>
                      <span className="text-xs text-muted-foreground">per month</span>
                    </div>
                  </Label>
                </div>
                
                <div>
                  <RadioGroupItem
                    value="professional"
                    id="professional"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="professional"
                    className="flex flex-col justify-between gap-2 rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary relative"
                  >
                    <div className="absolute -top-2 right-4 px-2 py-0.5 text-xs font-semibold text-white bg-brand-600 rounded-full">
                      CURRENT PLAN
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">Professional</span>
                      <span className="text-xs">For growing brokerages</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">$99</span>
                      <span className="text-xs text-muted-foreground">per month</span>
                    </div>
                  </Label>
                </div>
                
                <div>
                  <RadioGroupItem
                    value="enterprise"
                    id="enterprise"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="enterprise"
                    className="flex flex-col justify-between gap-2 rounded-md border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">Enterprise</span>
                      <span className="text-xs">For large teams</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">$199</span>
                      <span className="text-xs text-muted-foreground">per month</span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Compare Plans</Button>
              <Button>Update Plan</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>
                Choose what types of emails you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="email-updates" className="flex flex-col space-y-1">
                  <span>Updates and announcements</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Receive emails about new features and improvements
                  </span>
                </Label>
                <Switch
                  id="email-updates"
                  checked={localProfile.notifications && localProfile.notifications.email && localProfile.notifications.email.updates}
                  onCheckedChange={(checked) => 
                    updateNotificationPreference('email', 'updates', checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="email-marketing" className="flex flex-col space-y-1">
                  <span>Marketing and promotions</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Receive special offers and promotions
                  </span>
                </Label>
                <Switch
                  id="email-marketing"
                  checked={localProfile.notifications && localProfile.notifications.email && localProfile.notifications.email.marketing}
                  onCheckedChange={(checked) => 
                    updateNotificationPreference('email', 'marketing', checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="email-rates" className="flex flex-col space-y-1">
                  <span>Rate updates</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Receive notifications when lender rates change
                  </span>
                </Label>
                <Switch
                  id="email-rates"
                  checked={localProfile.notifications && localProfile.notifications.email && localProfile.notifications.email.newRates}
                  onCheckedChange={(checked) => 
                    updateNotificationPreference('email', 'newRates', checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="email-documents" className="flex flex-col space-y-1">
                  <span>Document notifications</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Receive notifications when documents are added or updated
                  </span>
                </Label>
                <Switch
                  id="email-documents"
                  checked={localProfile.notifications && localProfile.notifications.email && localProfile.notifications.email.newDocuments}
                  onCheckedChange={(checked) => 
                    updateNotificationPreference('email', 'newDocuments', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>
                Configure browser and mobile notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="push-updates" className="flex flex-col space-y-1">
                  <span>Updates and announcements</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Receive push notifications about new features
                  </span>
                </Label>
                <Switch
                  id="push-updates"
                  checked={localProfile.notifications && localProfile.notifications.push && localProfile.notifications.push.updates}
                  onCheckedChange={(checked) => 
                    updateNotificationPreference('push', 'updates', checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="push-marketing" className="flex flex-col space-y-1">
                  <span>Marketing and promotions</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Receive push notifications about special offers
                  </span>
                </Label>
                <Switch
                  id="push-marketing"
                  checked={localProfile.notifications && localProfile.notifications.push && localProfile.notifications.push.marketing}
                  onCheckedChange={(checked) => 
                    updateNotificationPreference('push', 'marketing', checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="push-rates" className="flex flex-col space-y-1">
                  <span>Rate updates</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Receive push notifications when lender rates change
                  </span>
                </Label>
                <Switch
                  id="push-rates"
                  checked={localProfile.notifications && localProfile.notifications.push && localProfile.notifications.push.newRates}
                  onCheckedChange={(checked) => 
                    updateNotificationPreference('push', 'newRates', checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="push-documents" className="flex flex-col space-y-1">
                  <span>Document notifications</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Receive push notifications for document updates
                  </span>
                </Label>
                <Switch
                  id="push-documents"
                  checked={localProfile.notifications && localProfile.notifications.push && localProfile.notifications.push.newDocuments}
                  onCheckedChange={(checked) => 
                    updateNotificationPreference('push', 'newDocuments', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current">Current Password</Label>
                <Input
                  id="current"
                  type="password"
                  value={passwordFields.currentPassword}
                  onChange={(e) => setPasswordFields({...passwordFields, currentPassword: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new">New Password</Label>
                <Input
                  id="new"
                  type="password"
                  value={passwordFields.newPassword}
                  onChange={(e) => setPasswordFields({...passwordFields, newPassword: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm New Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={passwordFields.confirmPassword}
                  onChange={(e) => setPasswordFields({...passwordFields, confirmPassword: e.target.value})}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Last changed: {userData.security && userData.security.lastPasswordChange ? userData.security.lastPasswordChange : ''}
              </div>
              <Button onClick={handlePasswordUpdate} disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-1">
                  <div className="font-medium">Two-factor authentication</div>
                  <div className="text-sm text-muted-foreground">
                    Protect your account with an additional verification step
                  </div>
                </div>
                <Switch
                  checked={localProfile.security && localProfile.security.twoFactorEnabled}
                  onCheckedChange={toggleTwoFactor}
                />
              </div>
              
              {localProfile.security && localProfile.security.twoFactorEnabled && (
                <div className="rounded-md border p-4 mt-4">
                  <div className="flex items-center space-x-4">
                    <div className="rounded-full bg-green-100 p-2">
                      <Shield className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Two-factor authentication is enabled</div>
                      <div className="text-xs text-muted-foreground">
                        Your account is now protected with an additional verification step
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Login History</CardTitle>
              <CardDescription>
                Recent account access from various devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userData.security && userData.security.loginHistory ? userData.security.loginHistory.map((login, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{login.device}</div>
                      <div className="text-xs flex space-x-2">
                        <span className="text-muted-foreground">{login.location}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">{login.time}</span>
                      </div>
                    </div>
                    {index === 0 && (
                      <Badge variant="outline" className="ml-auto">Current</Badge>
                    )}
                  </div>
                )) : []}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View Full Login History
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Account;
