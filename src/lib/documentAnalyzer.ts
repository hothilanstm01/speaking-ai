export type DocumentType = "Invoice" | "Bill" | "CO" | "";

export type LogisticsDocumentResult = {
  document_type: DocumentType;
  invoice_number: string | null;
  total_amount: number | null;
  currency: string | null;
  issue_date: string | null;
  supplier_name: string | null;
  bill_number: string | null;
  etd: string | null;
  eta: string | null;
  vessel_name: string | null;
  port_of_loading: string | null;
  port_of_discharge: string | null;
  form_type: string | null;
  exporter_name: string | null;
  importer_name: string | null;
  country_of_origin: string | null;
};

export const EMPTY_LOGISTICS_DOCUMENT_RESULT: LogisticsDocumentResult = {
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeIsoDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  // Best-effort: YYYY/MM/DD or YYYY.MM.DD
  const m1 = v.match(/^(\d{4})[/.](\d{1,2})[/.](\d{1,2})$/);
  if (m1) {
    const yyyy = Number(m1[1]);
    const mm = Number(m1[2]);
    const dd = Number(m1[3]);
    if (yyyy >= 1900 && yyyy <= 2100 && mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
      return `${String(yyyy).padStart(4, "0")}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
    }
  }

  // Best-effort: DD/MM/YYYY or MM/DD/YYYY (ambiguous). Prefer DD/MM if day > 12.
  const m2 = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m2) {
    const a = Number(m2[1]);
    const b = Number(m2[2]);
    const yyyy = Number(m2[3]);
    if (yyyy < 1900 || yyyy > 2100) return null;
    let dd = a;
    let mm = b;
    if (a <= 12 && b <= 12) {
      // ambiguous: keep as null to avoid wrong conversion
      return null;
    }
    if (a <= 12 && b > 12) {
      // likely MM/DD
      mm = a;
      dd = b;
    }
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
    return `${String(yyyy).padStart(4, "0")}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  }

  return null;
}

function normalizeCurrency(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(v)) return v;
  return null;
}

function normalizeAmount(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const v = value.trim();
  if (!v) return null;
  const cleaned = v.replace(/[^0-9.\-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === "." || cleaned === "-.") return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v ? v : null;
}

export function extractFirstJsonObject(text: string): unknown | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const slice = text.slice(start, end + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

export function coerceLogisticsResult(value: unknown): LogisticsDocumentResult {
  const base: LogisticsDocumentResult = { ...EMPTY_LOGISTICS_DOCUMENT_RESULT };
  if (!isPlainObject(value)) return base;

  const docType = typeof value.document_type === "string" ? value.document_type.trim() : "";
  if (docType === "Invoice" || docType === "Bill" || docType === "CO") base.document_type = docType;
  else base.document_type = "";

  base.invoice_number = normalizeString(value.invoice_number);
  base.total_amount = normalizeAmount(value.total_amount);
  base.currency = normalizeCurrency(value.currency);
  base.issue_date = normalizeIsoDate(value.issue_date);
  base.supplier_name = normalizeString(value.supplier_name);

  base.bill_number = normalizeString(value.bill_number);
  base.etd = normalizeIsoDate(value.etd);
  base.eta = normalizeIsoDate(value.eta);
  base.vessel_name = normalizeString(value.vessel_name);
  base.port_of_loading = normalizeString(value.port_of_loading);
  base.port_of_discharge = normalizeString(value.port_of_discharge);

  base.form_type = normalizeString(value.form_type);
  base.exporter_name = normalizeString(value.exporter_name);
  base.importer_name = normalizeString(value.importer_name);
  base.country_of_origin = normalizeString(value.country_of_origin);

  return base;
}

