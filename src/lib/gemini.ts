import type { CostLine } from "../types";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export type GeminiEstimate = {
  clientName: string;
  items: Array<{
    name: string;
    qty: number;
    costs: CostLine[];
  }>;
};

const PROMPT_PREFIX = `You are a cost estimation assistant for a Vietnamese merchandise and custom apparel business.

Extract order information from the user's free-form text and return ONLY valid JSON with this exact shape:
{
  "clientName": "<string: infer from context, or 'Khách hàng mới' if not mentioned>",
  "items": [
    {
      "name": "<string: product name in Vietnamese>",
      "qty": <integer: quantity, default 100 if not stated>,
      "costs": [
        { "label": "<string: cost component name>", "value": <number: cost in VND> }
      ]
    }
  ]
}

Rules:
- All money values are in VND. "45k", "45.000", "45,000" → 45000.
- If only one total cost per item is given, use a single cost line labeled "Phôi".
- Split into multiple cost lines when the user names components (e.g. phôi, in, thêu, vận chuyển).
- Quantity defaults to 100 when not stated.
- Return nothing outside the JSON object.

User input:
`;

export async function estimateCosts(userInput: string): Promise<GeminiEstimate> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY chưa được cấu hình trong .env.local");
  }

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: PROMPT_PREFIX + userInput }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("Gemini API error:", res.status, errText);
    throw new Error(`Gemini API lỗi (${res.status}). Vui lòng thử lại.`);
  }

  const data = await res.json() as {
    candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
  };

  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Gemini trả về phản hồi rỗng");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("Gemini returned invalid JSON:", raw);
    throw new Error("Gemini trả về dữ liệu không hợp lệ. Vui lòng thử lại.");
  }

  const estimate = parsed as GeminiEstimate;
  if (typeof estimate.clientName !== "string" || !Array.isArray(estimate.items)) {
    console.error("Gemini response shape mismatch:", parsed);
    throw new Error("Cấu trúc dữ liệu từ Gemini không đúng định dạng. Vui lòng thử lại.");
  }

  return estimate;
}
