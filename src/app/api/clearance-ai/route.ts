import { NextRequest, NextResponse } from "next/server";

export interface ClearanceData {
    importer: string;
    exporter: string;
    hsCode: string;
    quantity: number;
    unitPrice: number;
    totalValue: number;
    grossWeight: number;
    incoterms: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<ClearanceData | { error: string }>> {
    try {
        const formData = await req.formData();
        const files = formData.getAll("files");

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 });
        }

        // TODO: Replace with real AI extraction logic (e.g., call Gemini / GPT with file content)
        // For now, return mock data
        const mockData: ClearanceData = {
            importer: "ABC Import Co., Ltd — 123 Le Loi, Ho Chi Minh City, Vietnam",
            exporter: "XYZ Export Inc. — 456 Industrial Ave, Shenzhen, China",
            hsCode: "8471.30.10",
            quantity: 500,
            unitPrice: 120.5,
            totalValue: 60250,
            grossWeight: 1250.75,
            incoterms: "CIF",
        };

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        return NextResponse.json(mockData, { status: 200 });
    } catch (error) {
        console.error("[clearance-ai] Error processing request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
