import type { CostLine } from "../types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export type AIEstimate = {
  clientName: string;
  items: Array<{
    name: string;
    qty: number;
    costs: CostLine[];
  }>;
};

const SYSTEM_PROMPT = `You are a cost estimation assistant for a Vietnamese merchandise and custom apparel business.

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
- Return nothing outside the JSON object.`;

export async function estimateCosts(userInput: string): Promise<AIEstimate> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error("VITE_GROQ_API_KEY chưa được cấu hình trong .env.local");
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userInput },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("Groq API error:", res.status, errText);
    throw new Error(`AI lỗi (${res.status}). Vui lòng thử lại.`);
  }

  const data = await res.json() as {
    choices?: Array<{ message: { content: string } }>;
  };

  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("AI trả về phản hồi rỗng");
  console.log("AI raw response:", raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("AI returned invalid JSON:", raw);
    throw new Error("AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.");
  }

  const estimate = parsed as AIEstimate;
  if (typeof estimate.clientName !== "string" || !Array.isArray(estimate.items)) {
    console.error("AI response shape mismatch:", parsed);
    throw new Error("Cấu trúc dữ liệu không đúng định dạng. Vui lòng thử lại.");
  }

  return estimate;
}
