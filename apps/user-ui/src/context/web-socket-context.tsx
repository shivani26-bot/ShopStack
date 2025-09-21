"use client";

// websocket setup
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// Creates a React Context where we’ll store the WebSocket instance and unread counts.This allows us to avoid prop drilling and instead use useWebSocket() anywhere.
const WebSocketContext = createContext<{
  ws: WebSocket | null;
  unreadCounts: Record<string, number>;
}>({
  ws: null,
  unreadCounts: {},
});

// Wraps your app (or part of it) with a context provider. Needs the logged-in user (to identify the connection).
export const WebSocketProvider = ({
  children,
  user,
}: {
  children: React.ReactNode;
  user: any;
}) => {
  //   wsReady → tracks if WebSocket is connected.
  // wsRef → stores the WebSocket object (useRef ensures it doesn’t reset on re-render).
  // unreadCounts → keeps a map of conversation IDs → unread message counts.
  const [wsReady, setWsReady] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({}); //{ "conv123": 2, "conv456": 5 }

  //   Runs whenever user.id changes.
  // Opens a WebSocket connection to your backend (NEXT_PUBLIC_CHATTING_WEBSOCKET_URI).
  // Once connected:
  // Sends "user_<id>" → this tells the server which user is connected.
  // Marks the socket as ready (setWsReady(true)).
  useEffect(() => {
    if (!user?.id) return;
    console.log("userid", user?.id);
    console.log("websuri", process.env.NEXT_PUBLIC_CHATTING_WEBSOCKET_URI);
    const ws = new WebSocket(process.env.NEXT_PUBLIC_CHATTING_WEBSOCKET_URI!);
    console.log("ws", ws);
    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(`user_${user.id}`);
      setWsReady(true);
    };

    //     Whenever the server sends a message:
    // Parse it as JSON.
    // If it’s an unseen count update, update unreadCounts.
    //     if server sends:
    //     {
    //   "type": "UNSEEN_COUNT_UPDATE",
    //   "payload": { "conversationId": "conv123", "count": 3 }
    // }
    // then state becomes
    // { ...prev, "conv123": 3 }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "UNSEEN_COUNT_UPDATE") {
        const { conversationId, count } = data.payload;
        setUnreadCounts((prev) => ({ ...prev, [conversationId]: count }));
      }
    };
    // When the component unmounts or user changes, the WebSocket is closed to avoid memory leaks.
    return () => {
      ws.close();
    };
  }, [user?.id]);

  // if (!wsReady) return null;
  return (
    // Makes ws and unreadCounts available to any component via useWebSocket().
    <WebSocketContext.Provider value={{ ws: wsRef.current, unreadCounts }}>
      {children}
    </WebSocketContext.Provider>
  );
};
// Instead of calling useContext(WebSocketContext) everywhere, you use useWebSocket() for cleaner code.
export const useWebSocket = () => useContext(WebSocketContext);

// It creates a WebSocket provider for your React app (Next.js client component).
// Opens a WebSocket connection for the logged-in user.
// Keeps track of unread chat counts (unreadCounts) in state.
// Exposes the WebSocket instance + unread counts via React Context, so any component in the app can use it with useWebSocket().
