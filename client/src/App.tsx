import React, { useEffect, useState } from 'react';
import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Info from "@/pages/info";
import { Web3Provider } from "@/lib/web3";
import { BaseMiniKitProvider } from "@/lib/base-minikit-provider";

// Create a client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/info" component={Info} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    // Mark app as ready after initial render
    setIsAppReady(true);
  }, []);

  // Check if we're running as a Mini App (following Base docs pattern)
  const isMiniApp = typeof window !== 'undefined' && 
    (window.parent !== window || window.location.search.includes('miniapp=true'));

  // Following Base docs: "Wrap your existing application in <MiniKitProvider>"
  if (isMiniApp) {
    return (
      <BaseMiniKitProvider>
        <Router />
        <Toaster />
      </BaseMiniKitProvider>
    );
  }

  // Regular web app with existing wallet functionality
  return (
    <QueryClientProvider client={queryClient}>
      <Web3Provider>
        <Router />
        <Toaster />
      </Web3Provider>
    </QueryClientProvider>
  );
}

export default App;