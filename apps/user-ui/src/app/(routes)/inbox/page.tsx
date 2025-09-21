"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useRequireAuth from "apps/user-ui/src/hooks/useRequiredAuth";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { isProtected } from "apps/user-ui/src/utils/protected";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import shopProfile from "../../../assets/icons/shop-profiile.png";
import ChatInput from "apps/user-ui/src/shared/components/chats/chatinput";
import { useWebSocket } from "apps/user-ui/src/context/web-socket-context";
const Page = () => {
  const searchParams = useSearchParams(); //reads URL query params (likely Next.js / React Router hook). Used later to get conversationId.
  const { user, isLoading: userLoading } = useRequireAuth(); //custom hook that returns authenticated user and isLoading. user holds current user info (id, name, ...).
  const router = useRouter();

  const messageContainerRef = useRef<HTMLDivElement | null>(null); //ref to the container DOM element that holds messages (unused in snippet, but typically for scroll or measurements).
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null); //ref to an element at the bottom to scrollIntoView() to keep chat scrolled to bottom.
  const queryClient = useQueryClient(); //React Query client for manipulating cached queries

  const [chats, setChats] = useState<any[]>([]); //array of conversation summaries (sidebar list).
  const [selectedChat, setSelectedChat] = useState<any | null>(null); //currently open conversation object.
  const [message, setMessage] = useState(""); //current typed message input.
  const [hasMore, setHasMore] = useState(true); //whether there are older messages to load (pagination).
  const [page, setPage] = useState(1); //current page index for message pagination
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false); //local flag to avoid refetching messages immediately after selecting chat (used in your message query).
  const conversationId = searchParams.get("conversationId"); //conversationId: string
  const { ws } = useWebSocket(); //your WebSocket connection object (custom hook).
  //   fetch conversations
  // conversations will be an array of conversation summaries (the server returns conversations).
  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await axiosInstance.get(
        "/chatting/api/get-user-conversations",
        isProtected
      );
      console.log("conv", res.data);
      return res.data.conversations;
    },
  });

  // fetch messages
  //   Query key includes conversationId so messages are cached per conversation.
  // enabled: !!conversationId means query only runs when conversationId is truthy.
  // Query function logic:
  // If no conversationId or hasFetchedOnce is true → returns [] immediately (preventing re-fetch).
  // Note: Using hasFetchedOnce inside the queryFn is a pattern, but better practice is to use React Query's onSuccess or enabled flags to avoid state changes inside queryFn.
  // Calls API for page 1, then:
  // sets local page to 1
  // sets hasMore from server response
  // flips hasFetchedOnce to true so the queryFn returns early next time
  // returns res.data.messages.reverse() — reverse because server returns newest-first and client expects oldest-first (so UI shows top→oldest).
  // staleTime prevents refetching for 2 minutes.
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId || hasFetchedOnce) return [];
      const res = await axiosInstance.get(
        `/chatting/api/get-messages/${conversationId}?page=1`,
        isProtected
      );
      setPage(1);
      setHasMore(res.data.hasMore);
      setHasFetchedOnce(true);
      return res.data.messages.reverse();
    },
    enabled: !!conversationId,
    staleTime: 2 * 60 * 1000,
  });

  // When messages updates and there’s at least one message, call scrollToBottom() to keep viewport at latest message.
  useEffect(() => {
    if (messages?.length > 0) scrollToBottom();
  }, [messages]);

  // Whenever conversations from React Query changes, copy them into component state chats. This allows you to locally update chats (e.g., unreadCount) without mutating query cache directly.
  useEffect(() => {
    if (conversations) setChats(conversations);
  }, [conversations]);

  // When the URL conversationId or chats list changes, find the corresponding chat object and set it as selectedChat
  useEffect(() => {
    if (conversationId && chats.length > 0) {
      const chat = chats.find((c) => c.conversationId === conversationId);
      setSelectedChat(chat || null);
    }
  }, [conversationId, chats]);

  //   Sets up WebSocket onmessage handler whenever ws or conversationId changes.
  // What it does:
  // Parse incoming JSON data.
  // If data.type === "NEW_MESSAGE":
  // newMsg = data.payload.
  // If newMsg.conversationId === conversationId (i.e., user is viewing that conversation):
  // Append the new message to React Query cache for ["messages", conversationId].
  // Scroll to bottom.
  // Update chats list so the sidebar's lastMessage shows this content for the corresponding chat.
  useEffect(() => {
    if (!ws) return;

    ws.onmessage = (event: any) => {
      const data = JSON.parse(event.data);
      if (data.type === "NEW_MESSAGE") {
        const newMsg = data?.payload;
        // 1️⃣ Update message list if current conversation is open
        if (newMsg.conversationId === conversationId) {
          queryClient.setQueryData(
            ["messages", conversationId],
            (old: any = []) => [
              ...old,
              {
                content: newMsg.messageBody || newMsg.content || "",
                senderType: newMsg.senderType,
                seen: false,
                createdAt: newMsg.createdAt || new Date().toISOString(),
              },
            ]
          );
          scrollToBottom();
        }
        // 2️⃣ Update last message & unread count
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.conversationId === newMsg.conversationId
              ? { ...chat, lastMessage: newMsg.content }
              : chat
          )
        );
      }
      if (data.type === "UNSEEN_COUNT_UPDATE") {
        const { conversationId: msgConversationId, count } = data.payload;
        console.log("data.payload", data.payload);
        console.log("selected", selectedChat);
        console.log("chats", chats);
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.conversationId === msgConversationId
              ? {
                  ...chat,
                  unreadCount: msgConversationId === conversationId ? 0 : count,
                }
              : chat
          )
        );
      }
    };
  }, [ws, conversationId]);

  const loadMoreMessages = async () => {
    const nextPage = page + 1;
    const res = await axiosInstance.get(
      `/chatting/api/get-messages/${conversationId}?page=${nextPage}`,
      isProtected
    );

    queryClient.setQueryData(["messages", conversationId], (old: any = []) => [
      ...res.data.messages.reverse(),
      ...old,
    ]);

    setPage(nextPage);
    setHasMore(res.data.hasMore);
  };

  const getLastMessage = (chat: any) => chat?.lastMessage || "";

  const handleChatSelect = (chat: any) => {
    setHasFetchedOnce(false);
    setChats((prev) =>
      prev.map((c) =>
        c.conversationId === chat.conversationId ? { ...c, unreadCount: 0 } : c
      )
    );

    router.push(`?conversationId=${chat.conversationId}`);

    ws?.send(
      JSON.stringify({
        type: "MARK_AS_SEEN",
        conversationId: chat.conversationId,
      })
    );
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    });
  };

  const handleSend = async (e: any) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;
    const payload = {
      fromUserId: user?.id,
      toUserId: selectedChat?.seller?.id,
      conversationId: selectedChat?.conversationId,
      messageBody: message,
      senderType: "user",
    };

    // 1. Optimistically update UI
    // queryClient.setQueryData(
    //   ["messages", selectedChat.conversationId],
    //   (old: any = []) => [
    //     ...old,
    //     {
    //       content: payload.messageBody,
    //       senderType: "user",
    //       createdAt: new Date().toISOString(),
    //       seen: true,
    //     },
    //   ]
    // );
    // 3. Send to server if socket is open
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    } else {
      console.warn("WebSocket not open, message not sent");
    }
    // 2. Update sidebar chats
    console.log(JSON.stringify(payload));
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.conversationId
          ? { ...chat, lastMessage: payload.messageBody }
          : chat
      )
    );

    console.log("chats", chats);
    setMessage("");
    scrollToBottom();
  };
  return (
    <div className="w-full">
      <div className="md:w-[80%] mx-auto pt-5">
        <div className="flex h-[80vh] shadow-md rounded-lg overflow-hidden border">
          {/* Sidebar */}
          <div className="w-[320px] border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 text-lg font-semibold text-gray-800">
              Messages
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
              {isLoading ? (
                <div className="p-4 text-sm text-gray-500">Loading...</div>
              ) : chats.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">No Conversation</div>
              ) : (
                chats.map((chat) => {
                  const isActive =
                    selectedChat?.conversationId === chat.conversationId;
                  return (
                    <button
                      key={chat.conversationId}
                      onClick={() => handleChatSelect(chat)}
                      className={`w-full text-left px-4 py-3 transition flex items-center gap-3 ${
                        isActive ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <Image
                        src={chat.seller?.avatar || shopProfile}
                        alt={chat.seller?.name}
                        width={40}
                        height={40}
                        className="rounded-full border object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800">
                            {chat.seller?.name}
                          </span>
                          {chat.seller?.isOnline && (
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 truncate max-w-[160px]">
                            {getLastMessage(chat)}
                          </p>
                          {chat?.unreadCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-semibold">
                              {chat?.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex flex-col flex-1 bg-gray-50">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 p-4 border-b bg-white">
                  <Image
                    src={selectedChat.seller?.avatar || shopProfile}
                    alt={selectedChat?.seller?.name}
                    width={40}
                    height={40}
                    className="rounded-full border object-cover"
                  />
                  <div>
                    <h2 className="text-gray-800 font-semibold text-sm">
                      {selectedChat.seller?.name}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {selectedChat.seller?.isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={messageContainerRef}
                  className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-sm"
                >
                  {hasMore && (
                    <button
                      onClick={loadMoreMessages}
                      className="mx-auto block text-xs px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                    >
                      Load previous messages
                    </button>
                  )}
                  {messages?.map((msg: any, index: number) => (
                    <div
                      key={index}
                      className={`flex flex-col ${
                        msg.senderType === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`${
                          msg.senderType === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-800 border"
                        } px-4 py-2 rounded-lg shadow-sm max-w-[70%]`}
                      >
                        {msg.text || msg.content}
                      </div>
                      <span className="text-[11px] text-gray-400 mt-1">
                        {msg.time ||
                          new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                      </span>
                    </div>
                  ))}
                  <div ref={scrollAnchorRef} />
                </div>

                {/* Input */}
                <div className="border-t bg-white p-3">
                  <ChatInput
                    message={message}
                    setMessage={setMessage}
                    onSendMessage={handleSend}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Select a conversation to start chatting
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;

// useSearchParams() is a React Router hook (from react-router-dom v6.4+) that helps you read and update the query string (URL search parameters) in your React app.
// http://localhost:3000/products?category=books&page=2
// You can read and modify the query parameters like this:
//   const [searchParams, setSearchParams] = useSearchParams();

//   // Reading query params
//   const category = searchParams.get("category"); // "books"
//   const page = searchParams.get("page"); // "2"

// useSearchParams() returns a tuple:
// searchParams → an instance of URLSearchParams (you can use .get(), .has(), .set(), etc.).
// setSearchParams → a function to update the query string (like setState).

// divide-y
// This utility adds borders between vertical child elements inside a container.
// Example: If you have a list (<ul> or <div> with multiple <div> children), divide-y will put a horizontal line between each child.
// It does not add a border before the first child or after the last child, only in between.

// 🔹 divide-gray-200
// This sets the color of the dividing line to Tailwind’s gray-200 color.
// Tailwind has a scale of gray shades (gray-50 to gray-900), where gray-200 is a light gray.
