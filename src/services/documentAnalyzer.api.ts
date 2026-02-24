import api from "@/lib/axios";
import type { LogisticsDocumentResult } from "@/lib/documentAnalyzer";

export async function analyzeLogisticsDocument(text: string): Promise<LogisticsDocumentResult> {
  const { data } = await api.post<LogisticsDocumentResult>("/document/analyze", { text });
  return data;
}

