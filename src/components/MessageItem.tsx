"use client";

import { useState } from "react";
import type { Message } from "@/app/page";

interface MessageItemProps {
    message: Message;
}

export default function MessageItem({ message }: MessageItemProps) {
    const isUser = message.role === "user";
    const [isSpeaking, setIsSpeaking] = useState(false);

    const handleSpeak = () => {
        if (!("speechSynthesis" in window)) return;

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message.content);
        utterance.lang = "en-US";
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    };

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 group`}>
            {/* Avatar for AI */}
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center mr-3 mt-1 shadow-lg shadow-emerald-500/20">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.591.659H9.061a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V17a2.25 2.25 0 01-2.25 2.25H7.25A2.25 2.25 0 015 17v-2.5" />
                    </svg>
                </div>
            )}

            <div className="flex flex-col gap-1 max-w-[75%]">
                <div
                    className={`
            px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
            transition-all duration-200 ease-out
            ${isUser
                            ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-br-md shadow-lg shadow-indigo-500/25"
                            : "bg-[var(--ai-bubble)] text-[var(--text-primary)] rounded-bl-md border border-[var(--border)]"
                        }
          `}
                >
                    {message.content}
                </div>

                {/* Speaker button for AI messages */}
                {!isUser && (
                    <button
                        onClick={handleSpeak}
                        className={`self-start flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all duration-200 ${isSpeaking
                                ? "text-indigo-400 bg-indigo-500/10"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]/50 opacity-0 group-hover:opacity-100"
                            }`}
                        title={isSpeaking ? "Stop speaking" : "Listen to this message"}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isSpeaking ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10h6v4H9z" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                            )}
                        </svg>
                        {isSpeaking ? "Stop" : "Listen"}
                    </button>
                )}
            </div>

            {/* Avatar for User */}
            {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center ml-3 mt-1 shadow-lg shadow-indigo-500/20">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                </div>
            )}
        </div>
    );
}
