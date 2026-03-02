"use client";

import React, { useState } from "react";
import FileUploadZone from "@/components/clearance-ai/FileUploadZone";
import ClearanceResultForm from "@/components/clearance-ai/ClearanceResultForm";
import type { ClearanceData } from "@/app/api/clearance-ai/route";

type Status = "idle" | "loading" | "success" | "error";

export default function ClearanceAIPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [status, setStatus] = useState<Status>("idle");
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [result, setResult] = useState<ClearanceData | null>(null);

    // ── Validation ──────────────────────────────────────────────
    const validate = (): string | null => {
        if (files.length === 0) return "Please upload at least one PDF document.";
        if (files.length > 10) return "Maximum 10 files allowed.";
        return null;
    };

    // ── Submit ───────────────────────────────────────────────────
    const handleAnalyze = async () => {
        const validationError = validate();
        if (validationError) {
            setErrorMsg(validationError);
            return;
        }

        setErrorMsg("");
        setStatus("loading");
        setResult(null);

        try {
            const formData = new FormData();
            files.forEach((file) => formData.append("files", file));

            const res = await fetch("/api/clearance-ai", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const body = await res.json();
                throw new Error(body?.error ?? "Unexpected error from server.");
            }

            const data: ClearanceData = await res.json();
            setResult(data);
            setStatus("success");
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
            setStatus("error");
        }
    };

    // ── Export ───────────────────────────────────────────────────
    const handleExport = () => {
        if (!result) return;

        const rows = [
            ["Field", "Value"],
            ["Importer", result.importer],
            ["Exporter", result.exporter],
            ["HS Code", result.hsCode],
            ["Quantity", String(result.quantity)],
            ["Unit Price (USD)", String(result.unitPrice)],
            ["Total Value (USD)", String(result.totalValue)],
            ["Gross Weight (kg)", String(result.grossWeight)],
            ["Incoterms", result.incoterms],
        ];

        const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "clearance-data.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setFiles([]);
        setResult(null);
        setStatus("idle");
        setErrorMsg("");
    };

    return (
        <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 md:p-8">
            {/* ── Header ── */}
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Clearance AI</h1>
                    </div>
                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-2xl">
                        Upload your trade documents (Invoice, Packing List, Bill of Lading) and let AI extract
                        the key customs clearance data for you in seconds.
                    </p>
                </div>

                {/* ── Upload Section ── */}
                <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm p-6 mb-6 shadow-xl">
                    <h2 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold">1</span>
                        Upload Trade Documents
                    </h2>

                    <FileUploadZone
                        files={files}
                        onFilesChange={setFiles}
                        disabled={status === "loading"}
                    />

                    {/* Error message */}
                    {errorMsg && (
                        <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3">
                            <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                            <p className="text-red-400 text-sm">{errorMsg}</p>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={handleAnalyze}
                            disabled={status === "loading" || files.length === 0}
                            className="
                relative flex items-center gap-2 px-6 py-2.5 rounded-xl
                bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 shadow-lg shadow-indigo-500/20
                hover:shadow-indigo-500/40 hover:-translate-y-0.5
              "
                        >
                            {status === "loading" ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Analyzing…
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                    </svg>
                                    Analyze Documents
                                </>
                            )}
                        </button>

                        {(status === "success" || files.length > 0) && (
                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={status === "loading"}
                                className="px-4 py-2.5 rounded-xl border border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 text-sm transition-colors disabled:opacity-40"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Loading skeleton ── */}
                {status === "loading" && (
                    <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-6 shadow-xl animate-pulse">
                        <div className="h-4 w-48 bg-slate-700 rounded mb-6" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="h-3 w-24 bg-slate-700 rounded" />
                                    <div className="h-9 bg-slate-700/60 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Result Section ── */}
                {status === "success" && result && (
                    <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm p-6 shadow-xl">
                        {/* Section header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                                Extracted Data
                                <span className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Success
                                </span>
                            </h2>

                            {/* Export button */}
                            <button
                                type="button"
                                onClick={handleExport}
                                className="
                  flex items-center gap-1.5 px-4 py-2 rounded-xl
                  bg-emerald-600/20 border border-emerald-500/30
                  text-emerald-400 hover:bg-emerald-600/30 hover:text-emerald-300
                  text-sm font-medium transition-all duration-150
                "
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                Export CSV
                            </button>
                        </div>

                        <p className="text-xs text-slate-500 mb-5 -mt-3">
                            Review and edit the fields below before exporting.
                        </p>

                        <ClearanceResultForm
                            data={result}
                            onChange={setResult}
                        />
                    </div>
                )}
            </div>
        </main>
    );
}
