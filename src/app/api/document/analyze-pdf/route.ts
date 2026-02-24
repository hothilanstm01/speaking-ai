import { NextRequest, NextResponse } from "next/server";
import {
  coerceLogisticsResult,
  EMPTY_LOGISTICS_DOCUMENT_RESULT,
  extractFirstJsonObject,
  type LogisticsDocumentResult,
} from "@/lib/documentAnalyzer";
import { appendLogisticsRowToSheet } from "@/lib/googleSheets";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a professional logistics document analyzer.

Your task:
1. Automatically detect the document type:
   - Invoice
   - Bill of Lading
   - Certificate of Origin (C/O)

2. Extract structured data.

Strict rules:
- Return ONLY valid JSON.
- No explanation.
- No markdown.
- No extra text.
- If a field is not found, return null.
- Date format: YYYY-MM-DD
- Amount must be number only (no commas, no currency symbol).

Fields to extract:

If Invoice:
- document_type = "Invoice"
- invoice_number
- total_amount
- currency
- issue_date
- supplier_name

If Bill of Lading:
- document_type = "Bill"
- bill_number
- etd
- eta
- vessel_name
- port_of_loading
- port_of_discharge

If Certificate of Origin:
- document_type = "CO"
- form_type
- issue_date
- exporter_name
- importer_name
- country_of_origin

Return format:

{
  "document_type": "",
  "invoice_number": null,
  "total_amount": null,
  "currency": null,
  "issue_date": null,
  "supplier_name": null,
  "bill_number": null,
  "etd": null,
  "eta": null,
  "vessel_name": null,
  "port_of_loading": null,
  "port_of_discharge": null,
  "form_type": null,
  "exporter_name": null,
  "importer_name": null,
  "country_of_origin": null
}`;

async function callGroqOrOllama(documentText: string): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    const groqModel = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: groqModel,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: documentText },
        ],
        max_tokens: 600,
        temperature: 0,
      }),
    });

    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return String(data.choices?.[0]?.message?.content ?? "");
  }

  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  const ollamaModel = process.env.OLLAMA_MODEL || "phi3:mini";
  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: ollamaModel,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: documentText },
      ],
      stream: false,
      options: { temperature: 0 },
    }),
  });
  if (!response.ok) throw new Error(await response.text());
  const data = await response.json();
  return String(data.message?.content ?? "");
}

function toStrictResult(rawModelText: string): LogisticsDocumentResult {
  const direct = (() => {
    try {
      return JSON.parse(rawModelText);
    } catch {
      return null;
    }
  })();

  const extracted = direct ?? extractFirstJsonObject(rawModelText);
  return coerceLogisticsResult(extracted);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");
  const fileName = form.get("fileName");

  if (!(file instanceof Blob)) {
    return NextResponse.json(EMPTY_LOGISTICS_DOCUMENT_RESULT, { status: 200 });
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pdfParse = (await import("pdf-parse")).default as (
      data: Buffer
    ) => Promise<{ text: string }>;

    const parsed = await pdfParse(buffer);
    const text = parsed.text || "";

    if (!text.trim()) {
      return NextResponse.json(EMPTY_LOGISTICS_DOCUMENT_RESULT, { status: 200 });
    }

    const modelText = await callGroqOrOllama(text);
    const result = toStrictResult(modelText);

    appendLogisticsRowToSheet(result, {
      fileName: typeof fileName === "string" ? fileName : null,
    }).catch(() => {
      // logged inside helper
    });

    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json(EMPTY_LOGISTICS_DOCUMENT_RESULT, { status: 200 });
  }
}

