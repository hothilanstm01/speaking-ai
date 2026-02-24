import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are an English speaking practice partner. Your job is to:
1. Reply naturally to what the user said in English (2-3 sentences max)
2. Gently correct any grammar mistakes
3. Give a fluency score from 1 to 10

Always format your response exactly like this:
Reply: [your natural reply here]
Correction: [corrected sentence, or "Great job! No corrections needed." if correct]
Score: [number]/10`;

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;

    if (groqKey) {
      // Use Groq (online)
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
            { role: "user", content: message },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        return NextResponse.json({ error: `Groq error: ${err}` }, { status: 500 });
      }

      const data = await response.json();
      const result = data.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";
      return NextResponse.json({ result });
    } else {
      // Use Ollama (local)
      const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
      const ollamaModel = process.env.OLLAMA_MODEL || "phi3:mini";

      const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaModel,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: message },
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        return NextResponse.json({ error: `Ollama error: ${err}` }, { status: 500 });
      }

      const data = await response.json();
      const result = data.message?.content ?? "Sorry, I couldn't generate a response.";
      return NextResponse.json({ result });
    }
  } catch (error) {
    console.error("Speaking API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
