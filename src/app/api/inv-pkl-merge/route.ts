import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

type FileType = "INV" | "PKL" | "UNKNOWN";

interface ParsedRow {
    [key: string]: string | number | boolean | null;
}

function detectFileType(workbook: XLSX.WorkBook): FileType {
    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const raw = XLSX.utils.sheet_to_csv(sheet).toUpperCase();

        if (raw.includes("COMMERCIAL INVOICE") || raw.includes("AMOUNT")) {
            return "INV";
        }
        if (raw.includes("PACKING LIST") || raw.includes("GROSS WEIGHT")) {
            return "PKL";
        }
    }
    return "UNKNOWN";
}

/**
 * Keywords that signal the START of a data table header row.
 * The extractor will look for a row containing ANY of these (case-insensitive).
 */
const TABLE_HEADER_MARKERS = ["SE NO", "SE.NO", "SE NO.", "STT"];

/**
 * Keywords that signal the END of a data table (stop reading here).
 */
const TABLE_END_MARKERS = ["TOTAL", "SELLER CONFIRMING", "GENERAL DIRECTOR"];

/**
 * Determine whether a raw row (array of cells) looks like the data table header.
 */
function isHeaderRow(row: unknown[]): boolean {
    return row.some((cell) => {
        const s = String(cell ?? "")
            .trim()
            .toUpperCase();
        return TABLE_HEADER_MARKERS.some((m) => s === m || s.startsWith(m));
    });
}

/**
 * Determine whether a raw row signals the end of the data table.
 */
function isEndRow(row: unknown[]): boolean {
    const firstCell = String(row[0] ?? "")
        .trim()
        .toUpperCase();
    const rowText = row
        .map((c) => String(c ?? "").trim().toUpperCase())
        .join(" ");
    return TABLE_END_MARKERS.some(
        (m) => firstCell.startsWith(m) || rowText.includes(m)
    );
}

/**
 * Read a sheet as a 2-D array, locate the actual data table (starting after
 * the header row that contains "SE No." or "STT"), and return only those rows
 * as plain objects keyed by the header values.
 */
function extractRows(workbook: XLSX.WorkBook): ParsedRow[] {
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

    // Get everything as a 2-D array (no header inference)
    const aoa = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
        header: 1,
        defval: null,
        raw: false,
    });

    // 1. Find the header row index
    const headerIdx = aoa.findIndex((row) => isHeaderRow(row));
    if (headerIdx === -1) return []; // No recognizable table found

    const allHeaders = aoa[headerIdx].map((h) => String(h ?? "").trim());

    // 2. Limit columns: stop at the first empty header to avoid right-side reference tables
    const firstEmpty = allHeaders.findIndex((h) => h === "");
    const colLimit = firstEmpty === -1 ? allHeaders.length : firstEmpty;

    // Only keep columns within the boundary that have a non-empty header
    const usedCols: Array<{ header: string; colIdx: number }> = allHeaders
        .slice(0, colLimit)
        .map((header, colIdx) => ({ header, colIdx }))
        .filter(({ header }) => header !== "");

    // 3. Collect data rows from header+1 until an end-marker row or end of sheet
    const result: ParsedRow[] = [];

    for (let i = headerIdx + 1; i < aoa.length; i++) {
        const row = aoa[i];

        // Stop if we hit a TOTAL / signature row
        if (isEndRow(row)) break;

        // Skip rows where all used columns are empty
        const isBlank = usedCols.every(({ colIdx }) => {
            const c = row[colIdx];
            return c === null || String(c).trim() === "";
        });
        if (isBlank) continue;

        // Build an object using only the valid header columns
        const obj: ParsedRow = {};
        usedCols.forEach(({ header, colIdx }) => {
            const cellVal = row[colIdx] ?? null;
            obj[header] = cellVal === "" ? null : (cellVal as ParsedRow[string]);
        });
        result.push(obj);
    }

    return result;
}



/**
 * Convert a raw cell value to a safe primitive for ExcelJS.
 * Strips formula strings (starting with "=") so we always paste values only.
 */
function toSafeValue(v: string | number | boolean | null): ExcelJS.CellValue {
    if (v === null || v === "") return null;
    if (typeof v === "number" || typeof v === "boolean") return v;
    // If the source cell was a formula, xlsx returns the calculated text result.
    // Guard against any edge-case formula strings leaking through.
    if (typeof v === "string" && v.startsWith("=")) return v.slice(1) || null;
    // Try to coerce pure numeric strings back to numbers for clean Excel cells
    const asNum = Number(v);
    if (v !== "" && !isNaN(asNum)) return asNum;
    return v;
}

/**
 * Append parsed rows into a worksheet starting at a specific column.
 * @param ws        - Target ExcelJS worksheet
 * @param rows      - Rows extracted from the uploaded file
 * @param startCol  - 1-based column index where data should begin (e.g. 1 = A, 5 = E)
 */
function appendRowsToSheet(
    ws: ExcelJS.Worksheet,
    rows: ParsedRow[],
    startCol: number
): void {
    // Find the first empty row after existing data (minimum row 2)
    const nextRow = Math.max(ws.rowCount + 1, 2);

    rows.forEach((row, rowOffset) => {
        const values = Object.values(row);
        const rowNum = nextRow + rowOffset;
        values.forEach((cellValue, colOffset) => {
            ws.getCell(rowNum, startCol + colOffset).value = toSafeValue(cellValue);
        });
    });
}


export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const formData = await req.formData();
        const entries = formData.getAll("files");

        const files = entries.filter((e): e is File => e instanceof File);

        if (files.length === 0) {
            return NextResponse.json(
                { error: "No files uploaded." },
                { status: 400 }
            );
        }

        const templatePath = path.join(
            process.cwd(),
            "src",
            "templates",
            "template.xlsx"
        );

        if (!fs.existsSync(templatePath)) {
            return NextResponse.json(
                { error: "Template file not found on server." },
                { status: 500 }
            );
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(templatePath);

        const invSheet = workbook.getWorksheet("INV");
        const pklSheet = workbook.getWorksheet("PKL");

        if (!invSheet || !pklSheet) {
            return NextResponse.json(
                { error: 'Template must contain sheets named "INV" and "PKL".' },
                { status: 500 }
            );
        }

        for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const uploadedWb = XLSX.read(buffer, { type: "buffer" });
            const fileType = detectFileType(uploadedWb);

            if (fileType === "UNKNOWN") {
                continue;
            }

            const rows = extractRows(uploadedWb);

            if (fileType === "INV") {
                // INV: start at column A (1), row 2
                appendRowsToSheet(invSheet, rows, 1);
            } else {
                // PKL: start at column E (5), row 2
                appendRowsToSheet(pklSheet, rows, 5);
            }
        }

        const outputBuffer = await workbook.xlsx.writeBuffer();


        return new NextResponse(outputBuffer, {
            status: 200,
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": 'attachment; filename="merged-report.xlsx"',
            },
        });
    } catch (err) {
        const message =
            err instanceof Error ? err.message : "An unexpected error occurred.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
