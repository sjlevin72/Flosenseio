import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
// import { Toaster } from "@/components/ui/toaster";
import NotFound from "./pages/not-found";
import Dashboard from "./pages/Dashboard";
import EventDetails from "./pages/EventDetails";
import Settings from "./pages/Settings";
import Header from "./components/ui/layout/Header";
import Footer from "./components/ui/layout/Footer";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/events/:id" component={EventDetails} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
      <Footer />
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
