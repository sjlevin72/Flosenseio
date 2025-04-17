import * as wouter from "wouter";
const { Switch, Route, useLocation } = wouter;
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
// import { Toaster } from "@/components/ui/toaster";
import NotFound from "./pages/not-found";
import Dashboard from "./pages/Dashboard";
import EventDetails from "./pages/EventDetails";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Header from "./components/ui/layout/Header";
import Footer from "./components/ui/layout/Footer";

// Protected route component
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, [key: string]: any }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user is authenticated
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setLocation("/login");
        }
      } catch (error) {
        setIsAuthenticated(false);
        setLocation("/login");
      }
    }

    checkAuth();
  }, [setLocation]);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  // If authenticated, render the component
  if (isAuthenticated) {
    return <Component {...rest} />;
  }

  // This should not be reached due to the redirect in useEffect
  return null;
}

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/">
          <Header />
          <main className="flex-grow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <Switch>
                <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
                <Route path="/events/:id" component={() => <ProtectedRoute component={EventDetails} />} />
                <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
                <Route component={NotFound} />
              </Switch>
            </div>
          </main>
          <Footer />
        </Route>
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      {/* <Toaster /> */}
    </QueryClientProvider>
  );
}

export default App;
