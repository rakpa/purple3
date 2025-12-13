import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { supabase } from "@/lib/supabase";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import India from "./pages/India";
import AISummary from "./pages/AISummary";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Component to handle OAuth callback - must be inside BrowserRouter
function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    // Process OAuth callback when app loads
    const handleOAuthCallback = async () => {
      // Check if this is an OAuth callback (has hash with tokens)
      if (window.location.hash && window.location.hash.includes('access_token')) {
        try {
          // Give Supabase a moment to process the hash
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Get the session after Supabase processes the URL hash
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting session:', error);
            // Clear the hash and redirect to login
            window.history.replaceState(null, '', window.location.pathname);
            navigate('/login');
            return;
          }

          if (session) {
            // Session successfully established, clear hash and redirect to dashboard
            window.history.replaceState(null, '', window.location.pathname);
            navigate('/dashboard', { replace: true });
          } else {
            // No session found, clear hash and redirect to login
            window.history.replaceState(null, '', window.location.pathname);
            navigate('/login');
          }
        } catch (error) {
          console.error('Error handling OAuth callback:', error);
          window.history.replaceState(null, '', window.location.pathname);
          navigate('/login');
        }
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  // Show loading while processing OAuth callback
  if (window.location.hash && window.location.hash.includes('access_token')) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Completing sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <Categories />
          </ProtectedRoute>
        }
      />
      <Route
        path="/india"
        element={
          <ProtectedRoute>
            <India />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-summary"
        element={
          <ProtectedRoute>
            <AISummary />
          </ProtectedRoute>
        }
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
