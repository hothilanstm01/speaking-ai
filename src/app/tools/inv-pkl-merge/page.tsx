"use client";

import React, { useState, useCallback, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Status = "idle" | "loading" | "success" | "error";

interface ToastState {
    visible: boolean;
    message: string;
    type: "success" | "error";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FileIcon() {
    return (
        <svg
            className="w-5 h-5 text-emerald-400 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
        </svg>
    );
}

function Spinner() {
    return (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
        </svg>
    );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ toast }: { toast: ToastState }) {
    if (!toast.visible) return null;

    const isSuccess = toast.type === "success";
    return (
        <div
            className={`
        fixed bottom-6 right-6 z-50 flex items-center gap-3
        px-5 py-3.5 rounded-xl shadow-2xl backdrop-blur-sm
        border transition-all duration-300
        ${isSuccess
                    ? "bg-emerald-900/80 border-emerald-500/40 text-emerald-300"
                    : "bg-red-900/80 border-red-500/40 text-red-300"
                }
      `}
        >
            {isSuccess ? (
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                    />
                </svg>
            ) : (
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvPklMergePage() {
    const [files, setFiles] = useState<File[]>([]);
    const [status, setStatus] = useState<Status>("idle");
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [isDragging, setIsDragging] = useState(false);
    const [toast, setToast] = useState<ToastState>({
        visible: false,
        message: "",
        type: "success",
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Toast helper ─────────────────────────────────────────────────────────
    const showToast = useCallback(
        (message: string, type: "success" | "error") => {
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
            setToast({ visible: true, message, type });
            toastTimerRef.current = setTimeout(
                () => setToast((prev) => ({ ...prev, visible: false })),
                4000
            );
        },
        []
    );

    // ── File management ───────────────────────────────────────────────────────
    const addFiles = useCallback((incoming: FileList | File[]) => {
        // Accept all files — server will reject non-Excel formats
        const valid = Array.from(incoming);
        setFiles((prev) => {
            const existing = new Set(prev.map((f) => f.name));
            const newOnes = valid.filter((f) => !existing.has(f.name));
            return [...prev, ...newOnes];
        });
        setErrorMsg("");
    }, []);

    const removeFile = useCallback((name: string) => {
        setFiles((prev) => prev.filter((f) => f.name !== name));
    }, []);

    // ── Drag & Drop ───────────────────────────────────────────────────────────
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            addFiles(e.target.files);
        }
        e.target.value = "";
    };

    // ── Generate Report ───────────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (files.length === 0) {
            setErrorMsg("Please upload at least one Excel file.");
            return;
        }

        setErrorMsg("");
        setStatus("loading");

        try {
            const formData = new FormData();
            files.forEach((file) => formData.append("files", file));

            const res = await fetch("/api/inv-pkl-merge", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const body = (await res.json()) as { error?: string };
                throw new Error(body?.error ?? "Server returned an error.");
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "merged-report.xlsx";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setStatus("success");
            showToast("Report generated and downloaded successfully!", "success");
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "An unexpected error occurred.";
            setStatus("error");
            setErrorMsg(message);
            showToast(message, "error");
        }
    };

    const handleReset = () => {
        setFiles([]);
        setStatus("idle");
        setErrorMsg("");
    };

    const isLoading = status === "loading";

    // ─── Render ──────────────────────────────────────────────────────────────
    return (
        <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                {/* ── Header ── */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                            <svg
                                className="w-5 h-5 text-emerald-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            INV / PKL Merge
                        </h1>
                    </div>
                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-2xl">
                        Upload multiple Excel files (Invoice or Packing List). The tool
                        will auto-detect each file type, append data to the correct sheet
                        in the template, and generate a merged report.
                    </p>
                </div>

                {/* ── Upload Card ── */}
                <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm p-6 mb-4 shadow-xl">
                    <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">
                            1
                        </span>
                        Upload Excel Files
                    </h2>

                    {/* Drop zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => !isLoading && fileInputRef.current?.click()}
                        className={`
              relative flex flex-col items-center justify-center
              rounded-xl border-2 border-dashed cursor-pointer
              px-6 py-10 transition-all duration-200
              ${isDragging
                                ? "border-emerald-400 bg-emerald-500/10"
                                : "border-slate-600 hover:border-emerald-500/60 hover:bg-slate-700/30"
                            }
              ${isLoading ? "pointer-events-none opacity-50" : ""}
            `}
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-700/60 border border-slate-600 flex items-center justify-center mb-4">
                            <svg
                                className={`w-6 h-6 transition-colors ${isDragging ? "text-emerald-400" : "text-slate-400"
                                    }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                                />
                            </svg>
                        </div>
                        <p className="text-slate-300 text-sm font-medium mb-1">
                            {isDragging ? "Release to add files" : "Drag & drop files here"}
                        </p>
                        <p className="text-slate-500 text-xs">
                            or{" "}
                            <span className="text-emerald-400 hover:underline">
                                click to browse
                            </span>{" "}
                            &mdash; .xlsx, .xls, .xlsm, .xlsb
                        </p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".xlsx,.xls,.xlsm,.xlsb,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            className="hidden"
                            onChange={handleInputChange}
                            disabled={isLoading}
                        />
                    </div>

                    {/* File list */}
                    {files.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">
                                {files.length} file{files.length > 1 ? "s" : ""} selected
                            </p>
                            <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {files.map((file) => (
                                    <li
                                        key={file.name}
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-700/40 border border-slate-700/60 group"
                                    >
                                        <FileIcon />
                                        <span className="flex-1 text-sm text-slate-300 truncate">
                                            {file.name}
                                        </span>
                                        <span className="text-xs text-slate-500 flex-shrink-0">
                                            {(file.size / 1024).toFixed(0)} KB
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFile(file.name);
                                            }}
                                            disabled={isLoading}
                                            className="ml-1 w-5 h-5 flex items-center justify-center rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 opacity-0 group-hover:opacity-100"
                                            aria-label={`Remove ${file.name}`}
                                        >
                                            <svg
                                                className="w-3.5 h-3.5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Error message */}
                    {errorMsg && (
                        <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3">
                            <svg
                                className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                                />
                            </svg>
                            <p className="text-red-400 text-sm">{errorMsg}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            id="btn-generate-report"
                            onClick={handleGenerate}
                            disabled={isLoading || files.length === 0}
                            className="
                relative flex items-center gap-2 px-6 py-2.5 rounded-xl
                bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 shadow-lg shadow-emerald-500/20
                hover:shadow-emerald-500/40 hover:-translate-y-0.5
              "
                        >
                            {isLoading ? (
                                <>
                                    <Spinner />
                                    Generating&hellip;
                                </>
                            ) : (
                                <>
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                                        />
                                    </svg>
                                    Generate Report
                                </>
                            )}
                        </button>

                        {(files.length > 0 || status !== "idle") && (
                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={isLoading}
                                className="px-4 py-2.5 rounded-xl border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 text-sm transition-colors disabled:opacity-40"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Info Card ── */}
                <div className="rounded-xl bg-slate-800/30 border border-slate-700/40 px-5 py-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                        How it works
                    </h3>
                    <ul className="space-y-1.5 text-xs text-slate-500">
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">→</span>
                            <span>
                                Files with{" "}
                                <strong className="text-slate-400">&quot;COMMERCIAL INVOICE&quot;</strong>{" "}
                                or{" "}
                                <strong className="text-slate-400">&quot;Amount&quot;</strong>{" "}
                                column are treated as{" "}
                                <strong className="text-emerald-400">INV</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">→</span>
                            <span>
                                Files with{" "}
                                <strong className="text-slate-400">&quot;PACKING LIST&quot;</strong>{" "}
                                or{" "}
                                <strong className="text-slate-400">&quot;Gross Weight&quot;</strong>{" "}
                                are treated as{" "}
                                <strong className="text-emerald-400">PKL</strong>.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold mt-0.5">→</span>
                            <span>
                                Data is appended to the matching sheet in{" "}
                                <strong className="text-slate-400">template.xlsx</strong>. The{" "}
                                <strong className="text-slate-400">OUTPUT</strong> sheet
                                formulas are preserved.
                            </span>
                        </li>
                    </ul>
                </div>
            </div>

            <Toast toast={toast} />
        </main>
    );
}
