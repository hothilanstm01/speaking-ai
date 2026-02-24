"use client";

import ChatBox from "@/components/ChatBox";
import ConversationMode from "@/components/ConversationMode";
import { sendMessage } from "@/services/speaking.api";
import { useState, useCallback } from "react";

export interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationMode, setConversationMode] = useState(false);

  const handleSend = useCallback(async (text: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const data = await sendMessage(text);
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: "ai",
        content: data.result,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "ai",
        content: "Sorry, something went wrong. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConversationMessages = useCallback(
    (userMsg: Message, aiMsg: Message) => {
      setMessages((prev) => [...prev, userMsg, aiMsg]);
    },
    []
  );

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-primary)]">
      <ChatBox
        messages={messages}
        loading={loading}
        onSend={handleSend}
        onOpenConversation={() => setConversationMode(true)}
      />

      {conversationMode && (
        <ConversationMode
          onClose={() => setConversationMode(false)}
          onNewMessages={handleConversationMessages}
        />
      )}
    </main>
  );
}
