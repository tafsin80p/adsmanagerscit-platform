"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  MessageSquare,
  Search,
  Headphones,
  CheckCircle2,
  Clock,
  User,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  RefreshCw,
  Sparkles,
  Phone,
  Mail,
  Building,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Users,
  RotateCcw,
  Sliders,
  Filter,
  Flame,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { usePortal } from "@/context/PortalContext";

interface ChatSessionItem {
  sessionId: string;
  client: {
    id?: string;
    name: string;
    email: string;
    phone?: string;
    businessName?: string;
    avatar?: string;
  };
  status: "open" | "closed";
  assignedAgent?: {
    id?: string;
    name: string;
    email: string;
    avatar?: string;
  };
  participatingAgents?: Array<{
    name: string;
    avatar?: string;
    lastActive: string;
  }>;
  lastMessage?: {
    text: string;
    sender: "client" | "agent" | "system";
    senderName: string;
    createdAt: string;
  };
  unreadCountAdmin: number;
  unreadCountClient: number;
  closedAt?: string;
  closedBy?: {
    name: string;
    email: string;
  };
  updatedAt: string;
}

interface ChatMessageItem {
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

export default function AdminLiveChatPage() {
  const { profile } = usePortal();

  // Representative Name & Avatar
  const currentRepName = profile?.name || "Support Specialist";
  const currentRepEmail = profile?.email || "";
  const currentRepAvatar = profile?.avatar || "/images/profile-avatar.jpg";

  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [counts, setCounts] = useState({ open: 0, closed: 0, unreadAdmin: 0 });
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEndingChat, setIsEndingChat] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Maintain representative heartbeat presence
  useEffect(() => {
    const pingHeartbeat = () => {
      if (!isOnline) return;
      fetch("/api/chat/representatives", { method: "POST" }).catch(() => {});
    };
    pingHeartbeat();
    const heartbeatTimer = setInterval(pingHeartbeat, 60000);
    return () => clearInterval(heartbeatTimer);
  }, [isOnline]);

  // 2. Poll Sessions Queue
  const fetchQueue = async () => {
    try {
      const url = `/api/chat/sessions?status=${statusFilter}&q=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setSessions(data.sessions || []);
        if (data.counts) setCounts(data.counts);

        // Auto-select first session if none selected and on desktop
        if (!selectedSessionId && data.sessions?.length > 0) {
          setSelectedSessionId(data.sessions[0].sessionId);
        }
      }
    } catch (err) {
      console.warn("Queue fetch error:", err);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const queueInterval = setInterval(fetchQueue, 3500);
    return () => clearInterval(queueInterval);
  }, [statusFilter, searchQuery]);

  // 3. Poll Messages for Selected Session
  const fetchSelectedMessages = async (sid: string) => {
    try {
      const url = `/api/chat/messages?sessionId=${encodeURIComponent(sid)}&role=agent&markRead=true`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        if (data.session) {
          // Update session item in list
          setSessions((prev) =>
            prev.map((s) => (s.sessionId === sid ? { ...s, ...data.session } : s))
          );
        }
      }
    } catch (err) {
      console.warn("Message fetch error:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!selectedSessionId) {
      setMessages([]);
      return;
    }
    setIsLoadingMessages(true);
    fetchSelectedMessages(selectedSessionId);
    const msgInterval = setInterval(() => fetchSelectedMessages(selectedSessionId), 2500);
    return () => clearInterval(msgInterval);
  }, [selectedSessionId]);

  // 4. Auto scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Selected session object
  const activeSession = sessions.find((s) => s.sessionId === selectedSessionId);

  // 5. Send Agent Reply
  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || isSendingReply || !selectedSessionId) return;

    const textToSend = replyText.trim();
    setReplyText("");
    setIsSendingReply(true);

    // Optimistic UI update
    const optimisticMsg: ChatMessageItem = {
      _id: `temp_${Date.now()}`,
      sessionId: selectedSessionId,
      sender: "agent",
      senderName: currentRepName,
      senderAvatar: currentRepAvatar,
      senderRole: "Specialist",
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
          sessionId: selectedSessionId,
          text: textToSend,
          sender: "agent",
          senderName: currentRepName,
          senderAvatar: currentRepAvatar,
          senderRole: "Specialist",
          senderEmail: currentRepEmail,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) => (m._id === optimisticMsg._id ? data.message : m))
        );
        fetchQueue();
      }
    } catch (err) {
      console.warn("Could not send agent reply:", err);
    } finally {
      setIsSendingReply(false);
    }
  };

  // 6. Action: End Chat (Problem Solved)
  const handleEndChat = async () => {
    if (!selectedSessionId || isEndingChat) return;
    const confirmClose = window.confirm(
      "Are you sure you want to resolve and end this chat? (The customer can still reopen it anytime by sending a new message)."
    );
    if (!confirmClose) return;

    setIsEndingChat(true);
    try {
      const res = await fetch(`/api/chat/sessions/${encodeURIComponent(selectedSessionId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "close",
          agentName: currentRepName,
          agentEmail: currentRepEmail,
          reason: "Customer problem resolved",
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.systemMessage) {
          setMessages((prev) => [...prev, data.systemMessage]);
        }
        fetchQueue();
      }
    } catch (err) {
      console.warn("End chat error:", err);
    } finally {
      setIsEndingChat(false);
    }
  };

  // 7. Action: Join / Take Over Chat
  const handleJoinChat = async () => {
    if (!selectedSessionId) return;
    try {
      const res = await fetch(`/api/chat/sessions/${encodeURIComponent(selectedSessionId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          agentName: currentRepName,
          agentEmail: currentRepEmail,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.systemMessage) {
          setMessages((prev) => [...prev, data.systemMessage]);
        }
        fetchQueue();
      }
    } catch (err) {
      console.warn("Join chat error:", err);
    }
  };

  // 8. Action: Reopen Chat
  const handleReopenChat = async () => {
    if (!selectedSessionId) return;
    try {
      const res = await fetch(`/api/chat/sessions/${encodeURIComponent(selectedSessionId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reopen",
          agentName: currentRepName,
          agentEmail: currentRepEmail,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.systemMessage) {
          setMessages((prev) => [...prev, data.systemMessage]);
        }
        fetchQueue();
      }
    } catch (err) {
      console.warn("Reopen chat error:", err);
    }
  };

  // 9. Quick Canned Response helper
  const handleQuickCannedResponse = (text: string) => {
    setReplyText(text);
  };

  // 10. Attachment upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSessionId) return;

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
        const msgRes = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: selectedSessionId,
            text: "Attached reference screenshot / file 📎",
            attachmentUrl: uploadData.url,
            sender: "agent",
            senderName: currentRepName,
            senderAvatar: currentRepAvatar,
            senderRole: "Specialist",
          }),
        });

        const msgData = await msgRes.json();
        if (msgData.success && msgData.message) {
          setMessages((prev) => [...prev, msgData.message]);
          fetchQueue();
        }
      }
    } catch (err) {
      console.warn("Agent file upload failed:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header Ribbon */}
        <div className="bg-white p-5 rounded-2xl border border-[#E9EDF4] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#EEF2FF] text-[#3858F6]">
                <Headphones className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[#121826] tracking-tight">
                Live Support & Multi-Agent Desk
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Multi-representative customer support queue. Any online specialist can assist, take over, and resolve client inquiries.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Online Status Toggle */}
            <button
              type="button"
              onClick={() => setIsOnline(!isOnline)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-3xs cursor-pointer ${
                isOnline
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-100 text-slate-500 border border-slate-200"
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                }`}
              />
              <span>{isOnline ? "You are Online (Ready)" : "You are Away"}</span>
            </button>

            {/* Metrics Pills */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-[#EEF2FF] text-[#3858F6] text-xs font-extrabold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#3858F6]" />
                {counts.open} Active Chats
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {counts.closed} Resolved
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Chat Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[640px] max-h-[calc(100vh-210px)]">
          {/* Left Column: Conversations Queue (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E9EDF4] shadow-2xs flex flex-col overflow-hidden">
            {/* Queue Search & Tabs Header */}
            <div className="p-4 border-b border-[#E9EDF4] space-y-3 bg-[#F8FAFC]">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search client by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#3858F6]"
                />
              </div>

              {/* Status Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-bold text-center">
                <button
                  type="button"
                  onClick={() => setStatusFilter("open")}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === "open"
                      ? "bg-white text-[#3858F6] shadow-3xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Active ({counts.open})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("closed")}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === "closed"
                      ? "bg-white text-[#3858F6] shadow-3xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Closed ({counts.closed})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    statusFilter === "all"
                      ? "bg-white text-[#3858F6] shadow-3xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All ({counts.open + counts.closed})
                </button>
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {isLoadingQueue && sessions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#3858F6]" />
                  <span>Loading conversations...</span>
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-600">No {statusFilter} chats found</p>
                  <p className="text-[11px] text-slate-400">
                    Client messages from the live chat widget will appear in this queue.
                  </p>
                </div>
              ) : (
                sessions.map((sess) => {
                  const isSelected = sess.sessionId === selectedSessionId;
                  const isClosed = sess.status === "closed";

                  return (
                    <div
                      key={sess.sessionId}
                      onClick={() => setSelectedSessionId(sess.sessionId)}
                      className={`p-3.5 transition-all cursor-pointer flex items-start gap-3 relative ${
                        isSelected
                          ? "bg-[#EEF4FF] border-l-4 border-l-[#3858F6]"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-200 border border-slate-200 shrink-0">
                        <img
                          src={sess.client?.avatar || "/images/profile-avatar.jpg"}
                          alt={sess.client?.name || "Client"}
                          className="w-full h-full object-cover"
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                            isClosed ? "bg-slate-400" : "bg-emerald-500"
                          }`}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-xs text-[#121826] truncate">
                            {sess.client?.name || "Guest Visitor"}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {sess.lastMessage?.createdAt
                              ? new Date(sess.lastMessage.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {sess.client?.businessName || sess.client?.email || "Direct Visitor"}
                        </p>

                        <div className="flex items-center justify-between gap-2 mt-1.5">
                          <p className="text-xs text-slate-600 truncate flex-1 font-medium">
                            {sess.lastMessage?.text || "Started a new chat"}
                          </p>

                          {sess.unreadCountAdmin > 0 && (
                            <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-black rounded-full shadow-2xs">
                              {sess.unreadCountAdmin}
                            </span>
                          )}
                        </div>

                        {/* Assigned Specialist Tag */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {sess.assignedAgent ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              <UserCheck className="w-2.5 h-2.5 text-[#3858F6]" />
                              <span>{sess.assignedAgent.name}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-bold">
                              Unassigned (Open for all)
                            </span>
                          )}

                          {isClosed && (
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-semibold">
                              Resolved
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Chat Conversation Thread (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E9EDF4] shadow-2xs flex flex-col overflow-hidden">
            {activeSession ? (
              <>
                {/* Active Chat Header */}
                <div className="p-4 border-b border-[#E9EDF4] bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                      <img
                        src={activeSession.client?.avatar || "/images/profile-avatar.jpg"}
                        alt={activeSession.client?.name || "Client"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-sm text-[#121826] truncate">
                          {activeSession.client?.name || "Customer"}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            activeSession.status === "open"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {activeSession.status === "open" ? "🟢 Live Active" : "🔒 Problem Solved"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap mt-0.5">
                        {activeSession.client?.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {activeSession.client.email}
                          </span>
                        )}
                        {activeSession.client?.phone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {activeSession.client.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Representative Actions: Join Chat, End Chat, Reopen */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {/* Takeover / Join button */}
                    {activeSession.assignedAgent?.email !== currentRepEmail && (
                      <button
                        type="button"
                        onClick={handleJoinChat}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#3858F6] text-xs font-bold rounded-xl border border-[#C7D2FE] transition-all cursor-pointer"
                        title="Assign chat to yourself"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Assign to Me</span>
                      </button>
                    )}

                    {activeSession.status === "open" ? (
                      <button
                        type="button"
                        onClick={handleEndChat}
                        disabled={isEndingChat}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                        title="Mark issue as resolved and close the chat"
                      >
                        {isEndingChat ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>End Chat (Problem Solved)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleReopenChat}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reopen Conversation</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages Timeline */}
                <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-[#F8FAFC]">
                  {isLoadingMessages && messages.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#3858F6]" />
                      <span>Loading messages...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 text-xs">
                      No messages recorded in this conversation yet.
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      if (msg.sender === "system") {
                        return (
                          <div key={msg._id || idx} className="py-1 flex justify-center">
                            <span className="text-[11px] font-semibold text-slate-600 bg-slate-200/80 px-3.5 py-1 rounded-full text-center max-w-[85%] leading-relaxed border border-slate-300/40">
                              {msg.text}
                            </span>
                          </div>
                        );
                      }

                      const isAgent = msg.sender === "agent";

                      return (
                        <div
                          key={msg._id || idx}
                          className={`flex flex-col ${isAgent ? "items-end" : "items-start"} space-y-1`}
                        >
                          <div className="flex items-center gap-1.5 px-1">
                            <span className="text-[10px] font-bold text-slate-500">
                              {msg.senderName}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 rounded font-semibold ${
                                isAgent
                                  ? "bg-blue-100 text-[#3858F6]"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {isAgent ? "Specialist" : "Customer"}
                            </span>
                          </div>

                          <div
                            className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-3xs break-words ${
                              isAgent
                                ? "bg-[#3858F6] text-white rounded-tr-none font-medium"
                                : "bg-white text-slate-800 border border-slate-200/90 rounded-tl-none font-normal"
                            }`}
                          >
                            {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

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

                          <span className="text-[9px] text-slate-400 font-mono px-1">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      );
                    })
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Canned Responses Bar */}
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
                  <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">
                    Quick Templates:
                  </span>
                  {[
                    "Hello! How can I assist you with your Meta Ads today?",
                    "We are reviewing your campaign setup right now.",
                    "Your payment has been verified and your ad is now active!",
                    "Could you please share your Facebook Post link or TrxID?",
                    "Thank you for contacting SCIT Support. Have a wonderful day!",
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickCannedResponse(preset)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-200 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-medium transition-colors shrink-0 cursor-pointer"
                    >
                      {preset.slice(0, 32)}...
                    </button>
                  ))}
                </div>

                {/* Agent Reply Input Box */}
                <form
                  onSubmit={handleSendReply}
                  className="p-4 bg-white border-t border-slate-200 flex items-center gap-2"
                >
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
                    className="p-2.5 text-slate-400 hover:text-[#3858F6] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    title="Attach file or screenshot"
                  >
                    {isUploading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-[#3858F6]" />
                    ) : (
                      <Paperclip className="w-4 h-4" />
                    )}
                  </button>

                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${activeSession.client?.name || "customer"} as ${currentRepName}... (Enter to send)`}
                    className="flex-1 text-xs px-3.5 py-3 bg-[#F5F7FB] border border-slate-200 rounded-xl focus:bg-white focus:border-[#3858F6] focus:outline-none font-medium text-slate-800 placeholder-slate-400"
                  />

                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSendingReply}
                    className="inline-flex items-center gap-1.5 px-4 py-3 bg-[#3858F6] hover:bg-[#2542D9] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  >
                    {isSendingReply ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Send Reply</span>
                  </button>
                </form>
              </>
            ) : (
              /* Empty Selection State */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 text-slate-400">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <Headphones className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-base text-slate-700">No Chat Selected</h3>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  Select an active customer conversation from the queue on the left to start replying, or wait for new incoming requests.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

