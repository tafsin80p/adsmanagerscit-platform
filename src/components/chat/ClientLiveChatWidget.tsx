"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  MessageSquare,
  X,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  Clock,
  ChevronDown,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Headphones,
  ExternalLink,
  RotateCcw,
  AlertCircle,
  Minimize2,
} from "lucide-react";
import { usePortal } from "@/context/PortalContext";

interface ChatMsg {
  _id?: string;
  sessionId: string;
  sender: "client" | "agent" | "system";
  senderName: string;
  senderAvatar?: string;
  senderRole?: string;
  text: string;
  attachmentUrl?: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatSessionData {
  sessionId: string;
  status: "open" | "closed";
  assignedAgent?: {
    name: string;
    email: string;
    avatar?: string;
  };
  participatingAgents?: Array<{
    name: string;
    avatar?: string;
  }>;
  unreadCountClient: number;
  closedAt?: string;
  closedBy?: {
    name: string;
    email: string;
  };
}

export const ClientLiveChatWidget: React.FC = () => {
  const { profile, isAuthenticated } = usePortal();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [sessionData, setSessionData] = useState<ChatSessionData | null>(null);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [onlineRepCount, setOnlineRepCount] = useState(2);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Initialize or load persistent Session ID from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    let storedId = localStorage.getItem("scit_chat_session_id");
    if (!storedId) {
      const clientEmailKey = profile?.email ? profile.email.replace(/[^a-zA-Z0-9]/g, "_") : "";
      storedId = clientEmailKey
        ? `chat_usr_${clientEmailKey}`
        : `chat_sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem("scit_chat_session_id", storedId);
    }
    setSessionId(storedId);

    // Initial session bootstrap
    fetch("/api/chat/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: storedId,
        clientName: profile?.name || "Client",
        clientEmail: profile?.email || "",
        clientPhone: profile?.phone || "",
        businessName: profile?.businessName || profile?.connectedPage?.name || "",
        avatar: profile?.avatar || "/images/profile-avatar.jpg",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.session) {
          setSessionData(data.session);
          setUnreadCount(data.session.unreadCountClient || 0);
        }
      })
      .catch(() => {});

    // Check online representatives count
    fetch("/api/chat/representatives")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.onlineCount !== undefined) {
          setOnlineRepCount(Math.max(1, data.onlineCount));
        }
      })
      .catch(() => {});
  }, [profile]);

  // 2. Poll messages when open
  useEffect(() => {
    if (!sessionId) return;

    const fetchMessages = async () => {
      try {
        const url = `/api/chat/messages?sessionId=${encodeURIComponent(sessionId)}&role=client&markRead=${isOpen ? "true" : "false"}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setMessages(data.messages || []);
          if (data.session) {
            setSessionData(data.session);
            if (!isOpen) {
              setUnreadCount(data.session.unreadCountClient || 0);
            } else {
              setUnreadCount(0);
            }
          }
        }
      } catch {}
    };

    fetchMessages();

    // Polling interval: 3 seconds if widget is open, 10 seconds if closed (for unread badge)
    const intervalMs = isOpen ? 3000 : 10000;
    const timer = setInterval(fetchMessages, intervalMs);
    return () => clearInterval(timer);
  }, [sessionId, isOpen]);

  // 3. Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // 4. Send Message Handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !isUploading) || isSending || !sessionId) return;

    const textToSend = inputText.trim();
    setInputText("");
    setIsSending(true);

    // Optimistic UI update
    const optimisticMsg: ChatMsg = {
      _id: `temp_${Date.now()}`,
      sessionId,
      sender: "client",
      senderName: profile?.name || "You",
      senderAvatar: profile?.avatar || "/images/profile-avatar.jpg",
      text: textToSend,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          text: textToSend,
          sender: "client",
          senderName: profile?.name || "You",
          senderAvatar: profile?.avatar || "/images/profile-avatar.jpg",
          clientMeta: {
            name: profile?.name || "Client",
            email: profile?.email || "",
            phone: profile?.phone || "",
            businessName: profile?.businessName || profile?.connectedPage?.name || "",
            avatar: profile?.avatar || "/images/profile-avatar.jpg",
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.session) {
          setSessionData(data.session);
        }
        // Replace optimistic msg with real msg from server
        setMessages((prev) =>
          prev.map((m) => (m._id === optimisticMsg._id ? data.message : m))
        );
      }
    } catch (err) {
      console.warn("Could not deliver chat message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // 5. Attachment Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionId) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "chat");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (uploadRes.ok && uploadData.success && uploadData.url) {
        // Send as chat message with image attachment
        const msgRes = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            text: "Sent an attachment image 📎",
            attachmentUrl: uploadData.url,
            sender: "client",
            senderName: profile?.name || "You",
            senderAvatar: profile?.avatar || "/images/profile-avatar.jpg",
          }),
        });

        const msgData = await msgRes.json();
        if (msgData.success && msgData.message) {
          setMessages((prev) => [...prev, msgData.message]);
          if (msgData.session) setSessionData(msgData.session);
        }
      }
    } catch (err) {
      console.warn("Attachment upload failed:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isChatClosed = sessionData?.status === "closed";

  return (
    <>
      {/* Floating Toggle Button (Visible when widget is closed or minimized) */}
      {(!isOpen || isMinimized) && (
        <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 group animate-in fade-in slide-in-from-bottom-3 duration-200">
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
              setUnreadCount(0);
            }}
            className="relative flex items-center gap-2.5 bg-[#0866FF] hover:bg-[#0052CC] text-white px-4 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-200 active:scale-95 cursor-pointer border-2 border-white"
          >
            <div className="relative">
              <MessageSquare className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0866FF] rounded-full animate-pulse" />
            </div>
            <span className="text-xs font-bold tracking-wide hidden sm:inline">
              Live Specialist Chat
            </span>

            {/* Unread Message Pill */}
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full border-2 border-white shadow-md animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Floating Live Chat Box (Visible when opened and not minimized) */}
      {isOpen && !isMinimized && (
        <div className="fixed bottom-5 right-5 z-50 w-[95vw] sm:w-[390px] h-[550px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0866FF] via-[#0052CC] to-[#1877F2] p-4 text-white relative flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shrink-0">
                <Headphones className="w-5 h-5 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#0866FF] rounded-full" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm truncate">SCIT Support Desk</h3>
                  <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.2 rounded-full">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-blue-100 flex items-center gap-1 mt-0.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse inline-block" />
                  <span>{onlineRepCount} Specialist{onlineRepCount > 1 ? "s" : ""} Online • Instant Reply</span>
                </p>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Minimize"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Representative Banner */}
          {sessionData?.assignedAgent && (
            <div className="bg-[#EEF4FF] px-4 py-2 border-b border-[#D8E4FC] flex items-center justify-between text-xs text-slate-700">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-bold text-[#0866FF] truncate">
                  {sessionData.assignedAgent.name}
                </span>
                <span className="text-[10px] text-slate-500">is assisting you</span>
              </div>
              <span className="text-[10px] font-bold bg-white text-[#0866FF] px-2 py-0.5 rounded-full border border-[#D8E4FC]">
                Connected
              </span>
            </div>
          )}

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8FAFC]">
            {/* Welcome System Bubble */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-3xs space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 text-[#0866FF] font-bold text-[11px]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Shopno Career IT Specialist Support</span>
              </div>
              <p className="leading-relaxed text-[11px] text-slate-600">
                Welcome! How can our Meta Ads team help you today? You can ask about order status, boost setup, payment verification, or ad optimization.
              </p>
            </div>

            {/* Conversation Messages */}
            {messages.map((msg, idx) => {
              if (msg.sender === "system") {
                return (
                  <div key={msg._id || idx} className="py-1 flex justify-center">
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-3 py-1 rounded-full text-center max-w-[90%] leading-relaxed">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              const isMe = msg.sender === "client";

              return (
                <div
                  key={msg._id || idx}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1`}
                >
                  {!isMe && (
                    <span className="text-[10px] font-bold text-slate-500 pl-1 flex items-center gap-1">
                      <span>{msg.senderName || "Specialist"}</span>
                      <span className="text-[9px] bg-blue-50 text-[#0866FF] px-1 rounded font-semibold border border-blue-100">
                        {msg.senderRole || "Support"}
                      </span>
                    </span>
                  )}

                  <div
                    className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-3xs ${
                      isMe
                        ? "bg-[#0866FF] text-white rounded-tr-none font-medium"
                        : "bg-white text-slate-800 border border-slate-200/90 rounded-tl-none font-normal"
                    }`}
                  >
                    {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                    {/* Image Attachment */}
                    {msg.attachmentUrl && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-black/10">
                        <a
                          href={msg.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block relative aspect-video bg-black/5"
                        >
                          <img
                            src={msg.attachmentUrl}
                            alt="Attachment"
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </a>
                      </div>
                    )}
                  </div>

                  <div
                    className={`text-[9px] text-slate-400 flex items-center gap-1 ${
                      isMe ? "pr-1" : "pl-1"
                    }`}
                  >
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isMe && (
                      msg.isRead ? (
                        <CheckCheck className="w-3 h-3 text-[#0866FF]" />
                      ) : (
                        <Check className="w-3 h-3 text-slate-400" />
                      )
                    )}
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* Issue Resolved / Chat Closed Banner */}
          {isChatClosed && (
            <div className="bg-[#FFFBEB] p-3 border-t border-[#FDE68A] text-xs text-amber-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-tight">
                <span className="font-bold block">
                  Problem Solved / Chat Closed by {sessionData?.closedBy?.name || "Support"}
                </span>
                <span className="text-slate-600 text-[10px]">
                  Need anything else? Simply send a message below to restart the conversation anytime!
                </span>
              </div>
            </div>
          )}

          {/* Footer Input Area */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-2 text-slate-400 hover:text-[#0866FF] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              title="Attach screenshot or photo"
            >
              {isUploading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#0866FF]" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isChatClosed
                  ? "Type to reopen and continue chat..."
                  : "Type your message here..."
              }
              className="flex-1 text-xs px-3 py-2.5 bg-[#F5F7FB] border border-slate-200 rounded-xl focus:bg-white focus:border-[#0866FF] focus:outline-none font-medium text-slate-800 placeholder-slate-400"
            />

            <button
              type="submit"
              disabled={(!inputText.trim() && !isUploading) || isSending}
              className="p-2.5 bg-[#0866FF] hover:bg-[#0052CC] text-white rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
              title="Send Message"
            >
              {isSending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default ClientLiveChatWidget;

