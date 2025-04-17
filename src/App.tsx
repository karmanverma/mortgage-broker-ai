import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth context
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Landing page components
import LandingPage from "./pages/LandingPage";

// Auth pages
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";

// App pages
import Dashboard from "./pages/app/Dashboard";
import Lenders from "./pages/app/Lenders";
import AIAssistant from "./pages/app/AIAssistant";
import Account from "./pages/app/Account";
// Import Client Pages
import ClientsPage from "./pages/app/clients/ClientsPage";
import ClientDetailPage from "./pages/app/clients/ClientDetailPage";


// Layout components
import DashboardLayout from "./components/layouts/DashboardLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* SessionContextProvider is likely inside AuthProvider, remove from here */}
      <BrowserRouter>
        <AuthProvider> 
          {/* AuthProvider should now handle Supabase client initialization and context */} 
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Protected routes - wrapped with ProtectedRoute */}
            <Route path="/app" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="lenders" element={<Lenders />} />
              <Route path="assistant" element={<AIAssistant />} />
              <Route path="account" element={<Account />} />
              {/* Client Routes */}
              <Route path="clients" element={<ClientsPage />} />
              <Route path="clients/:clientId" element={<ClientDetailPage />} />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
