"use client";

import { useState, useRef, useEffect } from "react";
import type { Message } from "@/app/page";
import MessageItem from "./MessageItem";

interface ChatBoxProps {
    messages: Message[];
    loading: boolean;
    onSend: (text: string) => void;
    onOpenConversation: () => void;
}

export default function ChatBox({
    messages,
    loading,
    onSend,
    onOpenConversation,
}: ChatBoxProps) {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || loading) return;
        onSend(trimmed);
        setInput("");
        inputRef.current?.focus();
    };

    return (
        <div className="w-full max-w-2xl h-[90vh] flex flex-col rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--bg-secondary)] shadow-2xl shadow-black/40">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                        </svg>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[var(--bg-secondary)]" />
                </div>
                <div className="flex-1">
                    <h1 className="text-base font-semibold text-[var(--text-primary)]">Speaking AI</h1>
                    <p className="text-xs text-[var(--text-secondary)]">English Practice Partner · Online</p>
                </div>

                {/* Conversation Mode Button */}
                <button
                    onClick={onOpenConversation}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 hover:text-indigo-300 transition-all duration-200 text-xs font-medium"
                    title="Open voice conversation mode"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                    </svg>
                    <span className="hidden sm:inline">Talk</span>
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4 border border-indigo-500/20">
                            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Start Speaking!</h2>
                        <p className="text-sm text-[var(--text-secondary)] max-w-xs leading-relaxed">
                            Type a message below, or tap <strong className="text-indigo-400">&quot;Talk&quot;</strong> to start a live voice conversation with the AI robot.
                        </p>
                    </div>
                )}

                {messages.map((msg) => (
                    <MessageItem key={msg.id} message={msg} />
                ))}

                {/* Loading indicator */}
                {loading && (
                    <div className="flex justify-start mb-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center mr-3 mt-1 shadow-lg shadow-emerald-500/20">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.591.659H9.061a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V17a2.25 2.25 0 01-2.25 2.25H7.25A2.25 2.25 0 015 17v-2.5" />
                            </svg>
                        </div>
                        <div className="bg-[var(--ai-bubble)] border border-[var(--border)] rounded-2xl rounded-bl-md px-4 py-3">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message…"
                    disabled={loading}
                    className="flex-1 bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] rounded-xl px-4 py-3 text-sm outline-none border border-[var(--border)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-200 disabled:opacity-50"
                />

                {/* Send Button */}
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                </button>
            </form>
        </div>
    );
}
