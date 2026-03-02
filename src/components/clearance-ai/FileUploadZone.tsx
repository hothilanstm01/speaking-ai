"use client";

import React, { useRef, useState, DragEvent, ChangeEvent } from "react";

interface FileUploadZoneProps {
    files: File[];
    onFilesChange: (files: File[]) => void;
    disabled?: boolean;
}

const ACCEPTED_TYPES = ["application/pdf"];
const MAX_FILE_SIZE_MB = 20;

export default function FileUploadZone({ files, onFilesChange, disabled }: FileUploadZoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const validateAndAdd = (incoming: File[]) => {
        const valid = incoming.filter((f) => {
            if (!ACCEPTED_TYPES.includes(f.type)) return false;
            if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) return false;
            return true;
        });

        // Deduplicate by name
        const existing = new Set(files.map((f) => f.name));
        const merged = [...files, ...valid.filter((f) => !existing.has(f.name))];
        onFilesChange(merged);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(false);
        if (disabled) return;
        validateAndAdd(Array.from(e.dataTransfer.files));
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            validateAndAdd(Array.from(e.target.files));
            e.target.value = "";
        }
    };

    const removeFile = (name: string) => {
        onFilesChange(files.filter((f) => f.name !== name));
    };

    const formatBytes = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-3">
            {/* Drop zone */}
            <div
                onClick={() => !disabled && inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`
          relative cursor-pointer rounded-xl border-2 border-dashed p-8
          flex flex-col items-center justify-center gap-3 transition-all duration-200
          ${dragging
                        ? "border-indigo-400 bg-indigo-500/10 scale-[1.01]"
                        : "border-slate-600 hover:border-indigo-500 hover:bg-slate-700/40"
                    }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
            >
                {/* Upload icon */}
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                </div>
                <div className="text-center">
                    <p className="text-slate-200 font-medium">
                        Drop PDF files here or{" "}
                        <span className="text-indigo-400 underline underline-offset-2">browse</span>
                    </p>
                    <p className="text-slate-500 text-sm mt-1">
                        Invoice, Packing List, Bill of Lading — max {MAX_FILE_SIZE_MB} MB each
                    </p>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf"
                    multiple
                    className="hidden"
                    onChange={handleChange}
                    disabled={disabled}
                />
            </div>

            {/* File list */}
            {files.length > 0 && (
                <ul className="space-y-2">
                    {files.map((file) => (
                        <li
                            key={file.name}
                            className="flex items-center gap-3 rounded-lg bg-slate-700/60 border border-slate-600/50 px-4 py-2.5"
                        >
                            {/* PDF icon */}
                            <div className="flex-shrink-0 w-8 h-8 rounded bg-red-500/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM9.5 15.5h-1v-5h1.75c.966 0 1.75.784 1.75 1.75S11.216 14 10.25 14H9.5v1.5zm5 0h-2v-5h2c1.105 0 2 .895 2 2v1c0 1.105-.895 2-2 2zm4.5-3.5h-1V11h1v1zm0 1h-1v1h1v-1z" />
                                </svg>
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-slate-200 text-sm font-medium truncate">{file.name}</p>
                                <p className="text-slate-500 text-xs">{formatBytes(file.size)}</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => removeFile(file.name)}
                                disabled={disabled}
                                className="flex-shrink-0 text-slate-500 hover:text-red-400 transition-colors disabled:opacity-40"
                                aria-label={`Remove ${file.name}`}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
