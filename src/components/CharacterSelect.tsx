"use client";

import { CHARACTERS, type Character } from "@/lib/characters";

interface CharacterSelectProps {
    selected: Character;
    onSelect: (character: Character) => void;
}

export default function CharacterSelect({ selected, onSelect }: CharacterSelectProps) {
    return (
        <div className="w-full max-w-2xl px-2">
            <p className="text-xs text-[var(--text-secondary)] text-center mb-3 uppercase tracking-widest font-medium">
                Choose your speaking partner
            </p>
            <div className="grid grid-cols-4 gap-2">
                {CHARACTERS.map((char) => {
                    const isActive = char.id === selected.id;
                    return (
                        <button
                            key={char.id}
                            onClick={() => onSelect(char)}
                            className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 group
                ${isActive
                                    ? "border-indigo-500/50 bg-indigo-500/10"
                                    : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-indigo-500/30 hover:bg-indigo-500/5"
                                }`}
                        >
                            {/* Avatar circle */}
                            <div
                                className={`w-12 h-12 rounded-full bg-gradient-to-br ${char.avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all duration-200
                ${isActive ? "scale-110" : "group-hover:scale-105"}`}
                                style={{ boxShadow: isActive ? `0 0 20px ${char.glowColor}` : undefined }}
                            >
                                {char.name[0]}
                            </div>
                            <div className="text-center">
                                <p className={`text-sm font-semibold ${isActive ? "text-indigo-300" : "text-[var(--text-primary)]"}`}>
                                    {char.name}
                                </p>
                                <p className="text-xs text-[var(--text-secondary)] leading-tight">{char.role}</p>
                                <p className="text-xs text-[var(--text-secondary)]/60 leading-tight hidden sm:block">{char.accent}</p>
                            </div>
                            {isActive && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
