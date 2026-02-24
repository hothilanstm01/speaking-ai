import api from "@/lib/axios";

export interface SpeakingApiResponse {
    result: string;
}

export async function sendMessage(message: string): Promise<SpeakingApiResponse> {
    const { data } = await api.post<SpeakingApiResponse>("/speaking", {
        message,
    });
    return data;
}
