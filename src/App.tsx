import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Error Boundary
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Auth context
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
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
import NewAIAssistant from "./pages/app/NewAIAssistant";
import NewAIAssistantV2 from "./pages/app/NewAIAssistantV2";
import Account from "./pages/app/Account";
// Import Client Pages
import ClientsPage from "./pages/app/clients/ClientsPage";
import ClientDetailPage from "./pages/app/clients/ClientDetailPage";
// Import People Page
import People from "./pages/app/People";
import PersonDetailPage from "./pages/app/people/PersonDetailPage";
// Import new feature pages
import OpportunitiesPage from "./pages/app/opportunities/OpportunitiesPage";
import OpportunityDetailPage from "./pages/app/opportunities/OpportunityDetailPage";
import LoansPage from "./pages/app/loans/LoansPage";
import LoanDetailPage from "./pages/app/loans/LoanDetailPage";
import RealtorsPage from "./pages/app/realtors/RealtorsPage";
import NotesPage from "./pages/app/NotesPage";
import TodosPage from "./pages/app/TodosPage";
import RealtorDetailPage from "./pages/app/realtors/RealtorDetailPage";
import LenderDetailPage from "./pages/app/LenderDetailPage";


// Layout components
import DashboardLayout from "./components/layouts/DashboardLayout";
import NotFound from "./pages/NotFound";

// Configure React Query with better defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
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
              {/* New feature routes */}
              <Route path="opportunities" element={<OpportunitiesPage />} />
              <Route path="opportunities/:id" element={<OpportunityDetailPage />} />
              <Route path="loans" element={<LoansPage />} />
              <Route path="loans/:id" element={<LoanDetailPage />} />
              <Route path="realtors" element={<RealtorsPage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="todos" element={<TodosPage />} />
              <Route path="realtors/:realtorId" element={<RealtorDetailPage />} />
              {/* Existing routes */}
              <Route path="lenders" element={<Lenders />} />
              <Route path="lenders/:lenderId" element={<LenderDetailPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="clients/:clientId" element={<ClientDetailPage />} />
              <Route path="people" element={<People />} />
              <Route path="people/:personId" element={<PersonDetailPage />} />
              <Route path="assistant" element={<NewAIAssistantV2 />} />
              <Route path="assistant-v1" element={<NewAIAssistant />} />
              <Route path="assistant-legacy" element={<AIAssistant />} />
              <Route path="account" element={<Account />} />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AuthProvider>
        </BrowserRouter>
        {/* React Query Devtools - only in development */}
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
