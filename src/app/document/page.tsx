"use client";

import { useCallback, useState } from "react";
import Tesseract from "tesseract.js";
import type { LogisticsDocumentResult } from "@/lib/documentAnalyzer";

const EMPTY_RESULT: LogisticsDocumentResult = {
  document_type: "",
  invoice_number: null,
  total_amount: null,
  currency: null,
  issue_date: null,
  supplier_name: null,
  bill_number: null,
  etd: null,
  eta: null,
  vessel_name: null,
  port_of_loading: null,
  port_of_discharge: null,
  form_type: null,
  exporter_name: null,
  importer_name: null,
  country_of_origin: null,
};

export default function DocumentAnalyzerPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [rawText, setRawText] = useState("");
  const [result, setResult] = useState<LogisticsDocumentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const sheetUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_URL;

  const handleFiles = useCallback((list: File[]) => {
    if (!list.length) {
      setFiles([]);
      setFileName(null);
      return;
    }
    setFiles(list);
    setFileName(
      list.length === 1 ? list[0].name : `${list[0].name} + ${list.length - 1} files`
    );
    setError(null);
    setResult(null);
    setSummary(null);

    // Không auto đọc nội dung nữa; để user vẫn có thể paste tay nếu muốn.
    setRawText("");
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    handleFiles(list);
  };

  const handleAnalyze = async () => {
    const hasFiles = files.length > 0;
    const hasText = !!rawText.trim();

    if (!hasFiles && !hasText) {
      setError("Chưa chọn file hoặc nhập nội dung nào.");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    setSummary(null);

    try {
      let processed = 0;

      const tasks: Promise<void>[] = [];

      for (const file of files) {
        const lowerName = file.name.toLowerCase();
        const isPdf =
          file.type === "application/pdf" || lowerName.endsWith(".pdf");
        const isImage =
          file.type.startsWith("image/") ||
          lowerName.endsWith(".jpg") ||
          lowerName.endsWith(".jpeg") ||
          lowerName.endsWith(".png");

        if (isPdf) {
          tasks.push(
            (async () => {
              const form = new FormData();
              form.append("file", file);
              form.append("fileName", file.name);
              const res = await fetch("/api/document/analyze-pdf", {
                method: "POST",
                body: form,
              });
              await res.json();
              processed += 1;
            })()
          );
        } else if (isImage) {
          tasks.push(
            (async () => {
              const { data } = await Tesseract.recognize(file, "eng");
              const text = data?.text || "";
              if (!text.trim()) {
                processed += 1;
                return;
              }
              const res = await fetch("/api/document/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, fileName: file.name }),
              });
              await res.json();
              processed += 1;
            })()
          );
        } else {
          tasks.push(
            (async () => {
              const text = await file.text();
              const res = await fetch("/api/document/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, fileName: file.name }),
              });
              await res.json();
              processed += 1;
            })()
          );
        }
      }

      if (hasText) {
        tasks.push(
          (async () => {
            const res = await fetch("/api/document/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: rawText, fileName: "manual-input" }),
            });
            await res.json();
            processed += 1;
          })()
        );
      }

      await Promise.all(tasks);

      setSummary(
        `Đã xử lý ${processed} tài liệu. Dữ liệu đã được ghi vào Google Sheet (nếu đã cấu hình).`
      );
    } catch (err) {
      console.error(err);
      setError("Gọi API thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    const r = result ?? EMPTY_RESULT;
    const headers = [
      "document_type",
      "invoice_number",
      "total_amount",
      "currency",
      "issue_date",
      "supplier_name",
      "bill_number",
      "etd",
      "eta",
      "vessel_name",
      "port_of_loading",
      "port_of_discharge",
      "form_type",
      "exporter_name",
      "importer_name",
      "country_of_origin",
    ];

    const row = headers.map((key) => {
      const v = (r as Record<string, unknown>)[key];
      if (v === null || v === undefined) return "";
      const s = String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    });

    const csv = [headers.join(","), row.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "logistics_document.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-primary)]">
      <div className="w-full max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] shadow-2xl shadow-black/40 p-6 space-y-6">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Logistics Document Analyzer
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Upload file (text / đã OCR), hệ thống sẽ đọc nội dung, phân loại (Invoice / B/L / C/O) và trả về JSON đúng format, kèm nút export CSV mở được bằng Excel.
        </p>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            Chọn file / kéo thả vào ô dưới
          </label>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragActive(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const list = Array.from(e.dataTransfer.files || []);
              handleFiles(list);
            }}
            className={`border-2 border-dashed rounded-xl px-4 py-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
              dragActive
                ? "border-emerald-400 bg-emerald-500/5"
                : "border-[var(--border)] hover:border-indigo-400/80 hover:bg-indigo-500/5"
            }`}
            onClick={() => {
              document.getElementById("doc-file-input")?.click();
            }}
          >
            <span className="text-sm text-[var(--text-primary)]">
              Kéo thả PDF / file văn bản vào đây
            </span>
            <span className="text-[11px] text-[var(--text-secondary)]">
              Hoặc bấm để chọn nhiều file. Ảnh (JPG/PNG) hiện chưa đọc được, cần chuyển thành PDF/text trước.
            </span>
          </div>

          {/* Hidden file input */}
          <input
            id="doc-file-input"
            type="file"
            accept=".txt,.log,.json,.md,.csv,.pdf,.jpg,.jpeg,.png,image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {fileName && (
            <p className="text-xs text-[var(--text-secondary)]">
              File đã chọn: <span className="font-medium">{fileName}</span>
            </p>
          )}
          {!fileName && (
            <p className="text-[11px] text-[var(--text-secondary)]">
              Hỗ trợ: PDF, file văn bản (.txt/.csv/...), và ảnh (.jpg/.jpeg/.png). Mỗi tài liệu sẽ ghi 1 dòng vào Google Sheet.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--text-secondary)]">
            Nội dung (có thể paste trực tiếp)
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={8}
            className="w-full text-sm rounded-md border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
            placeholder="Paste nội dung Invoice / Bill of Lading / Certificate of Origin..."
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading}
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Đang phân tích..." : "Phân tích tài liệu"}
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={loading || (!result && !rawText)}
            className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:border-indigo-500/60 hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Tải về Excel (CSV)
          </button>
        </div>

        {sheetUrl && (
          <div className="flex items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
            <span>Mở bảng Google Sheet để xem kết quả:</span>
            <a
              href={sheetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-3 py-1.5 rounded-md border border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/10 transition-colors"
            >
              Mở Google Sheet
            </a>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {summary && (
          <div className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/40 rounded-md px-3 py-2">
            {summary}
          </div>
        )}
      </div>
    </main>
  );
}

