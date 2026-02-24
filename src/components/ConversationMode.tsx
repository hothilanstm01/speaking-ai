"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { sendMessage } from "@/services/speaking.api";
import type { Message } from "@/app/page";

const Avatar3D = dynamic(() => import("./Avatar3D"), { ssr: false });

type ConversationState = "idle" | "listening" | "thinking" | "speaking";

interface ConversationModeProps {
    onClose: () => void;
    onNewMessages: (user: Message, ai: Message) => void;
}

interface SpeechRecognitionEvent {
    results: { [index: number]: { [index: number]: { transcript: string } } };
}

interface SpeechRecognitionInstance extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    onend: (() => void) | null;
}

declare global {
    interface Window {
        webkitSpeechRecognition: new () => SpeechRecognitionInstance;
        SpeechRecognition: new () => SpeechRecognitionInstance;
    }
}

const STATE_LABEL: Record<ConversationState, string> = {
    idle: "Tap avatar to start",
    listening: "Listening…",
    thinking: "Thinking…",
    speaking: "Speaking…",
};

const STATE_COLOR: Record<ConversationState, string> = {
    idle: "text-slate-400",
    listening: "text-emerald-400",
    thinking: "text-amber-400",
    speaking: "text-purple-400",
};

const RING_COLOR: Record<ConversationState, string> = {
    idle: "border-indigo-500/20",
    listening: "border-emerald-400/50",
    thinking: "border-amber-400/50",
    speaking: "border-purple-400/50",
};

const GLOW_COLOR: Record<ConversationState, string> = {
    idle: "shadow-indigo-500/20",
    listening: "shadow-emerald-400/40",
    thinking: "shadow-amber-400/40",
    speaking: "shadow-purple-500/60",
};

export default function ConversationMode({ onClose, onNewMessages }: ConversationModeProps) {
    const [state, setState] = useState<ConversationState>("idle");
    const [transcript, setTranscript] = useState("");
    const [aiText, setAiText] = useState("Hi! I'm your English speaking partner. Tap me to start chatting!");
    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
    const closingRef = useRef(false);

    useEffect(() => {
        return () => {
            closingRef.current = true;
            recognitionRef.current?.abort();
            window.speechSynthesis?.cancel();
        };
    }, []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    });

    const speak = useCallback((text: string): Promise<void> => {
        return new Promise((resolve) => {
            if (!("speechSynthesis" in window) || closingRef.current) { resolve(); return; }
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "en-US";
            utterance.rate = 0.9;
            utterance.pitch = 1.05;
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            window.speechSynthesis.speak(utterance);
        });
    }, []);

    const startListening = useCallback(() => {
        // if (closingRef.current) return;

        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { alert("Use Chrome or Edge for voice support."); return; }

        const recognition = new SR();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = async (event: SpeechRecognitionEvent) => {
            const text = event.results[0][0].transcript;
            if (closingRef.current) return;
            setTranscript(text);
            setState("thinking");

            try {
                const data = await sendMessage(text);
                if (closingRef.current) return;

                const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text, timestamp: new Date() };
                const aiMsg: Message = { id: crypto.randomUUID(), role: "ai", content: data.result, timestamp: new Date() };
                onNewMessages(userMsg, aiMsg);

                setAiText(data.result);
                setState("speaking");
                await speak(data.result);

                if (!closingRef.current) {
                    setState("listening");
                    startListening();
                }
            } catch {
                if (!closingRef.current) {
                    setAiText("Oops, something went wrong. Tap to try again.");
                    setState("idle");
                }
            }
        };

        recognition.onerror = () => { if (!closingRef.current) setState("idle"); };
        recognition.onend = () => { };

        recognitionRef.current = recognition;
        setState("listening");
        setTranscript("");
        recognition.start();
    }, [speak, onNewMessages]);

    const handleAvatarClick = () => {

        if (state === "idle") { startListening(); }
        else if (state === "listening") { recognitionRef.current?.stop(); setState("idle"); }
        else if (state === "speaking") { window.speechSynthesis?.cancel(); setState("idle"); }
    };

    const handleClose = () => {
        closingRef.current = true;
        recognitionRef.current?.abort();
        window.speechSynthesis?.cancel();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050a15] overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0" style={{
                    backgroundImage: `linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)`,
                    backgroundSize: "60px 60px",
                }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
                    style={{ background: "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)" }} />
                <div className="particle particle-1" />
                <div className="particle particle-2" />
                <div className="particle particle-3" />
                <div className="particle particle-4" />
            </div>

            {/* Close button */}
            <button onClick={handleClose}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center z-10 transition-all group">
                <svg className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-white/30 mb-4">AI Speaking Partner</p>

            {/* 3D Avatar — click overlay ON TOP of canvas */}
            <div className="relative mb-4" style={{ position: 'relative', zIndex: 5 }}>
                <div className={`absolute inset-0 -m-4 rounded-full border-2 transition-all duration-700 ${RING_COLOR[state]} shadow-2xl ${GLOW_COLOR[state]} pointer-events-none`} />
                {state === "listening" && (
                    <>
                        <div className="absolute inset-0 -m-6 rounded-full border border-emerald-400/30 animate-ripple pointer-events-none" />
                        <div className="absolute inset-0 -m-6 rounded-full border border-emerald-400/20 animate-ripple [animation-delay:0.6s] pointer-events-none" />
                    </>
                )}
                {state === "speaking" && (
                    <div className="absolute inset-0 -m-6 rounded-full bg-purple-500/10 animate-pulse-slow pointer-events-none" />
                )}
                {state === "thinking" && (
                    <>
                        <div className="absolute w-3 h-3 rounded-full bg-amber-400 animate-orbit-1 top-1/2 left-1/2 shadow-lg shadow-amber-400/50 pointer-events-none" />
                        <div className="absolute w-2 h-2 rounded-full bg-amber-300 animate-orbit-2 top-1/2 left-1/2 pointer-events-none" />
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-500 animate-orbit-3 top-1/2 left-1/2 pointer-events-none" />
                    </>
                )}
                {/* Canvas renders here — pointer-events:none on Avatar3D wrapper */}
                <div className="rounded-full overflow-hidden w-[320px] h-[320px]">
                    <Avatar3D state={state} />
                </div>
                {/* TRANSPARENT CLICK OVERLAY — sits ON TOP of canvas, captures all clicks */}
                <div
                    onClick={handleAvatarClick}
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        borderRadius: '50%',
                        cursor: 'pointer',
                        zIndex: 999,
                        background: 'transparent',
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label="Toggle listening"
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAvatarClick(); }}
                />
            </div>

            {/* State label + mic button */}
            <div className="flex flex-col items-center gap-3 mb-6">
                <div className={`text-sm font-medium tracking-widest uppercase transition-all duration-300 ${STATE_COLOR[state]}`}>
                    {STATE_LABEL[state]}
                </div>
                <button
                    onClick={handleAvatarClick}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border-2
                        ${state === "idle" ? "bg-indigo-500/20 border-indigo-500/50 hover:bg-indigo-500/30" : ""}
                        ${state === "listening" ? "bg-emerald-500/20 border-emerald-400/70 animate-pulse" : ""}
                        ${state === "thinking" ? "bg-amber-500/20 border-amber-400/50" : ""}
                        ${state === "speaking" ? "bg-purple-500/20 border-purple-400/70" : ""}
                    `}
                    aria-label="Toggle microphone"
                >
                    {state === "idle" && (
                        <svg className="w-6 h-6 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V6zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c3.39-.49 6-3.39 6-6.92h-2z" />
                        </svg>
                    )}
                    {state === "listening" && (
                        <svg className="w-6 h-6 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 15c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V6zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-2.08c3.39-.49 6-3.39 6-6.92h-2z" />
                        </svg>
                    )}
                    {state === "thinking" && (
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:0ms]" />
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:150ms]" />
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                    )}
                    {state === "speaking" && (
                        <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Transcript */}
            <div className="w-full max-w-lg px-6 space-y-3 max-h-48 overflow-y-auto">
                {transcript && (
                    <div className="flex justify-end">
                        <div className="bg-indigo-500/15 border border-indigo-500/25 rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%]">
                            <p className="text-xs text-indigo-300 font-semibold mb-1 uppercase tracking-wider">You</p>
                            <p className="text-sm text-white/90">{transcript}</p>
                        </div>
                    </div>
                )}
                {aiText && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[80%]">
                            <p className="text-xs text-purple-400 font-semibold mb-1 uppercase tracking-wider">AI</p>
                            <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{aiText}</p>
                        </div>
                    </div>
                )}
            </div>

            <p className="absolute bottom-5 text-xs text-white/15 tracking-widest">ESC to exit • tap avatar to pause</p>
        </div>
    );
}
