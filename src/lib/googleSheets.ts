import { google } from "googleapis";
import type { LogisticsDocumentResult } from "./documentAnalyzer";

type AppendMeta = {
  fileName?: string | null;
};

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function getEnv(name: string): string | null {
  const v = process.env[name];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

async function getSheetsClient() {
  const serviceJson = getEnv("GOOGLE_SERVICE_ACCOUNT_JSON");
  const spreadsheetId = getEnv("GOOGLE_SHEETS_SPREADSHEET_ID");

  if (!serviceJson || !spreadsheetId) {
    return null;
  }

  let creds: {
    client_email?: string;
    private_key?: string;
  };
  try {
    creds = JSON.parse(serviceJson);
  } catch {
    console.error("Invalid GOOGLE_SERVICE_ACCOUNT_JSON");
    return null;
  }

  if (!creds.client_email || !creds.private_key) {
    console.error("GOOGLE_SERVICE_ACCOUNT_JSON missing client_email or private_key");
    return null;
  }

  const auth = new google.auth.JWT(
    creds.client_email,
    undefined,
    creds.private_key,
    SCOPES
  );

  const sheets = google.sheets({ version: "v4", auth });
  return { sheets, spreadsheetId };
}

async function ensureHeaderRow(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  range: string
) {
  try {
    const [sheetName] = range.split("!");
    const headerRange = `${sheetName}!A1:R1`;

    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: headerRange,
    });

    const hasHeader =
      existing.data.values &&
      existing.data.values.length > 0 &&
      existing.data.values[0].length > 0;

    if (hasHeader) return;

    const headerValues = [
      [
        "timestamp",
        "file_name",
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
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: headerRange,
      valueInputOption: "RAW",
      requestBody: {
        values: headerValues,
      },
    });

    const yellow = { red: 1, green: 0.95, blue: 0.8 };
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 18,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: yellow,
                  textFormat: { bold: true },
                },
              },
              fields: "userEnteredFormat(backgroundColor,textFormat.bold)",
            },
          },
        ],
      },
    });
  } catch (err) {
    console.error("Google Sheets ensureHeaderRow error:", err);
  }
}

export async function appendLogisticsRowToSheet(
  data: LogisticsDocumentResult,
  meta: AppendMeta = {}
): Promise<void> {
  const client = await getSheetsClient();
  if (!client) return;

  const { sheets, spreadsheetId } = client;
  const range = getEnv("GOOGLE_SHEETS_RANGE") || "Sheet1!A:Z";

  const timestamp = new Date().toISOString();
  const fileName = meta.fileName ?? "";

  const row = [
    timestamp,
    fileName,
    data.document_type ?? "",
    data.invoice_number ?? "",
    data.total_amount ?? "",
    data.currency ?? "",
    data.issue_date ?? "",
    data.supplier_name ?? "",
    data.bill_number ?? "",
    data.etd ?? "",
    data.eta ?? "",
    data.vessel_name ?? "",
    data.port_of_loading ?? "",
    data.port_of_discharge ?? "",
    data.form_type ?? "",
    data.exporter_name ?? "",
    data.importer_name ?? "",
    data.country_of_origin ?? "",
  ];

  try {
    await ensureHeaderRow(sheets, spreadsheetId, range);
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values: [row],
      },
    });
  } catch (err) {
    console.error("Google Sheets append error:", err);
  }
}

