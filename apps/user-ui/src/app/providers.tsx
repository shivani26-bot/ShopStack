"use client";
import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import useUser from "../hooks/useUser";
import { WebSocketProvider } from "../context/web-socket-context";
const Providers = ({ children }: { children: React.ReactNode }) => {
  //   React components re-render multiple times. if we just did : const queryClient = new QueryClient();
  // a new QueryClient would be created on every render, wiping out the cache.
  // By using useState(() => new QueryClient(...)), React creates it once and reuses the same instance across renders.
  // ✅ This preserves your query cache and avoids unnecessary API calls.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        //         refetchOnWindowFocus: false
        // By default, React Query refetches data when you return to the browser tab.
        // Example: You open the app → switch to another tab → come back → it auto-fetches again.
        // Setting this to false stops that. Good for avoiding extra API calls when not needed.

        //         staleTime: 1000 * 60 * 5 (5 minutes)
        // Defines how long the data is considered "fresh".
        // During this time, React Query won’t refetch automatically if you re-mount a component or re-open the same page.
        // Example: If you load a product list, navigate away, and come back within 5 minutes → it uses cached data instead of hitting the API again.
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5,
          }, //when we switch the window it will not call the api
        },
      })
  );
  return (
    // Wraps all children components inside QueryClientProvider.
    // Now, any component under <Providers> can use hooks like useQuery, useMutation, etc.
    <QueryClientProvider client={queryClient}>
      <ProvidersWithWebSocket>{children}</ProvidersWithWebSocket>
    </QueryClientProvider>
  );
};

const ProvidersWithWebSocket = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, isLoading } = useUser();

  // if (isLoading) return null;
  // Option 1: Keep children mounted while user is loading
  if (isLoading) {
    return <>{children}</>; // no websocket yet, but no unmounting either
  }
  // Option 2: Once user is resolved, mount WebSocketProvider
  if (user) {
    return <WebSocketProvider user={user}>{children}</WebSocketProvider>;
  }

  // fallback for logged-out users
  return <>{children}</>;
  // return (
  //   <>
  //     {user && <WebSocketProvider user={user}>{children}</WebSocketProvider>}
  //     {!user && children}
  //   </>
  // );
};

export default Providers;

//setting up tanstack query
// Importing QueryClient (which manages caching, fetching, and updating server data) and QueryClientProvider (context provider to give React Query’s features to the whole app).
// Providers: This component is a wrapper/provider for your app.
// { children } means whatever you pass inside <Providers> ... </Providers> will be rendered inside it.
// new QueryClient() creates an instance of React Query’s client.
// Why inside useState?
// If you just did const queryClient = new QueryClient();, it would create a new client every time the component re-renders, losing the cache.
// useState(() => new QueryClient()) ensures it’s created only once and persists across re-renders.
// useState(() => new QueryClient())
// Here, instead of passing a value, you pass a function.
// React will call this function only once (on the first render) to compute the initial value.
// This is called lazy initialization.
// If you did useState(new QueryClient()), then new QueryClient() would run on every render, even if React only uses the first value. Using the function form avoids unnecessary re-instantiations.
// We’re ignoring the setter function (setQueryClient) because we never need to change the client after it’s created.
