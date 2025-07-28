import React, { useEffect } from 'react';
import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Info from "@/pages/info";
import { Web3Provider } from "@/lib/web3";
import { sdk } from '@farcaster/miniapp-sdk';

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
  useEffect(() => {
    // Initialize Farcaster MiniApp SDK and hide splash screen
    const initializeMiniApp = async () => {
      try {
        // Call ready() to hide the splash screen and show the app content
        await sdk.actions.ready();
      } catch (error) {
        console.error('Failed to initialize Farcaster MiniApp:', error);
        // Still call ready() even if there's an error to ensure the app shows
        await sdk.actions.ready();
      }
    };

    initializeMiniApp();
  }, []);

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