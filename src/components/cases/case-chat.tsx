import React, { useEffect, useState, useRef } from "react";
import io, { Socket } from "socket.io-client";
import type { ChatMessage, User } from "@/types/franchise";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import axios from "axios";
import axiosInstance from "@/utils/axiosInstance";

interface CaseChatProps {
  caseId: string;
  currentUser: User;
  assignedUsers: User[];
  initialMessages?: ChatMessage[];
}

let socket: Socket;

function getFormattedChatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getInitials(name: string | undefined): string {
  if (!name) return "NA"; // Default initials
  return name
    .split(" ")
    .map((part) => part[0]?.toUpperCase() || "")
    .slice(0, 2)
    .join("");
}

function getRandomColorFromName(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

export default function CaseChat({
  caseId,
  currentUser,
  assignedUsers,
  initialMessages = [],
}: CaseChatProps) {
  // console.log("Assigned users prop:", assignedUsers);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // ✅ All hooks must come before any `return`
  const chat = useSelector(
    (state: RootState) => state.permissions.permissions?.chat
  );

  // Load previous messages
 useEffect(() => {
  const loadMessages = async () => {
    try {
      const { data } = await axiosInstance.get(`/cases/${caseId}/messages`);
      
      if (Array.isArray(data)) {
        setMessages(data);
      } else {
        throw new Error("Invalid response format - expected array");
      }
    } catch (error) {
      console.error("Fetch messages error:", error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
    }
  };

  loadMessages();
}, [caseId, toast]);

  // Socket connection and event handlers
  useEffect(() => {
    socket = io("https://tumbledrybe.sharda.co.in", {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      // console.log("🟢 Connected to socket server");
      setIsConnected(true);

      const userId = currentUser.userId || currentUser.id;
      const username = currentUser.name;

      if (userId && username) {
        socket.emit("register", userId, username);
        // console.log("Registering user:", userId, username);
      } else {
        console.error("❌ Missing userId or username during registration");
      }
    });

    // ✅ ADD THIS: handle 'registered' and join case room
    socket.on("registered", () => {
      // console.log("✅ Registered on socket server");

      // 👇 Join the case room immediately after registering
      socket.emit("joinCase", { caseId });
      // console.log("📥 Joining case:", caseId);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("🔴 Disconnected from socket server");
    });

    socket.on("newMessage", (msg: ChatMessage) => {
      setMessages((prev) =>
        [...prev]
          .filter((m) => {
            if (!m.id) return true;
            if (m.id.startsWith("temp-") && m.message === msg.message)
              return false;
            return true;
          })
          .concat(msg)
      );
    });

    socket.on("error", (errMsg: string) => {
      console.error("Socket error:", errMsg);
      toast({
        title: "Chat Error",
        description: errMsg,
        variant: "destructive",
      });
    });

    return () => {
      socket.off("connect");
      socket.off("registered");
      socket.off("disconnect");
      socket.off("newMessage");
      socket.off("error");
      socket.disconnect();
    };
  }, [caseId, currentUser.userId, currentUser.name, toast]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector(
          "div[data-radix-scroll-area-viewport]"
        );
        if (viewport) {
          viewport.scrollTo({
            top: viewport.scrollHeight,
            behavior: "smooth",
          });
        }
      }
    };

    scrollToBottom();
  }, [messages]);

  const SUPER_ADMIN_ID = "68271c74487f3a8ea0dd6bdd";

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageContent = newMessage.trim();
    if (!messageContent || isSending || !isConnected) return;

    try {
      setIsSending(true);

      const tempMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        caseId,
        senderId: currentUser.userId!, // sender's userId
        senderName: currentUser.name,
        message: messageContent,
        timestamp: new Date().toISOString(),
        status: "sending",
      };

      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage("");

      // Send via socket
      socket.emit("sendMessage", {
        caseId,
        message: messageContent,
      });

      // Get user _id from localStorage
      const userStr = localStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      const userIdToSend = userObj?._id;
      console.log("Sending userId (ObjectId) in mark-read:", userIdToSend);

      if (!userIdToSend) {
        throw new Error("User _id not found in localStorage");
      }

      const token = localStorage.getItem("token");

      await axiosInstance.put(`/chats/mark-read/${caseId}`, {
        userId: userIdToSend, // send _id from localStorage user object
      });

      const caseResponse = await axiosInstance.get(`/api/cases/${caseId}`);
      const caseName = caseResponse.data.unitName; // Adjust this based on your API response
      // console.log("caseResponse : ", caseResponse);

      // Send push notification to all assigned users except the sender
      for (const user of caseResponse.data.assignedUsers) {
        // Skip the sender from notifications
        if (user.userId === currentUser.userId) {
          continue;
        }

        const userId = user._id; // Correctly access the userId

        // console.log("userId : ", userId);

        // console.log(`Sending notification to userId: ${userId}`);

        // Send a push notification API request
        try {
          await axiosInstance.post("/pushnotifications/send-notification", {
            userId: userId, // Send notification to assigned user's ID
            message: `New message in case "${caseName}" by ${currentUser.name}: ${messageContent}`, // Custom message
          });
        } catch (error: unknown) {
          if (error instanceof Error) {
            // Narrow down the error type here
            if (
              error.message.includes("404") ||
              error.message.includes("410")
            ) {
              console.log(
                `User ${userId} not subscribed or subscription expired, skipping notification.`
              );
            } else {
              console.error(`Error sending notification to ${userId}:`, error);
            }
          } else {
            console.error("Unknown error:", error);
          }
        }
      }

      // Send notification to Super Admin (hardcoded)
      console.log(
        `Sending notification to Super Admin with userId: ${SUPER_ADMIN_ID}`
      );
    await axiosInstance.post(
  "/pushnotifications/send-notification",
  {
    userId: SUPER_ADMIN_ID, // Send notification to Super Admin
    message: `New message in case "${caseName}" by ${currentUser.name}: ${messageContent}`, // Custom message
  }
);

    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const isSuperAdmin = currentUser?.name === "Super Admin";

  if (!isSuperAdmin && !chat) {
    return (
      <Card className="p-6">
        <p className="text-center text-red-600 font-semibold">
          You do not have permission to access the chat.
        </p>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5 text-primary" />
            Team Chat
          </CardTitle>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isConnected ? "bg-green-500" : "bg-red-500"
              )}
            />
            <span className="text-xs text-muted-foreground">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {assignedUsers && assignedUsers.length > 0
            ? `Chatting with: ${assignedUsers.map((u) => u.name).join(", ")}`
            : "No users assigned to this case"}
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, index) => {
                const isCurrentUser = msg.senderId === currentUser.userId;
                const initials = getInitials(msg.senderName || "Unknown");

                const bgColor = getRandomColorFromName(msg.senderName);

                return (
                  <div
                    key={msg.id || `msg-temp-${index}`}
                    className={cn(
                      "flex items-start gap-2",
                      isCurrentUser ? "justify-end" : "justify-start"
                    )}
                  >
                    {!isCurrentUser && (
                      <div className="flex-shrink-0">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback
                            className={cn(bgColor, "text-white font-medium")}
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}

                    <div className="flex flex-col max-w-[80%]">
                      {!isCurrentUser && (
                        <span className="text-xs font-medium mb-1">
                          {msg.senderName}
                        </span>
                      )}
                      <div
                        className={cn(
                          "rounded-lg px-3 py-2",
                          isCurrentUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.message}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-xs mt-1",
                          isCurrentUser ? "text-right" : "text-left",
                          msg.status === "sending"
                            ? "text-muted-foreground"
                            : ""
                        )}
                      >
                        {msg.status === "sending"
                          ? "Sending..."
                          : getFormattedChatTime(msg.timestamp)}
                      </span>
                    </div>

                    {isCurrentUser && (
                      <div className="flex-shrink-0">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback
                            className={cn(bgColor, "text-white font-medium")}
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <form
          onSubmit={handleSendMessage}
          className="border-t p-4 flex items-center gap-2"
        >
          <Input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-grow"
            disabled={!isConnected || assignedUsers.length === 0}
          />
          <Button
            type="submit"
            size="icon"
            disabled={
              !newMessage.trim() ||
              !isConnected ||
              isSending ||
              assignedUsers.length === 0
            }
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
