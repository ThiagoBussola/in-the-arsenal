import { env } from "../config/env";
import { AppError } from "../middlewares/errorHandler";
import { logger } from "../lib/logger";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "stepfun/step-3.5-flash:free";

const SYSTEM_PROMPT = `You are "Arsenal AI", an expert assistant for the Flesh and Blood trading card game (FaB). You help players with:
- Deck building advice and card synergies
- Meta analysis and matchup strategies
- Rules clarifications
- Lore and world-building from the world of Rathe
- Tournament preparation tips

Be concise, knowledgeable, and strategic. When discussing cards, mention their pitch values and card types when relevant.`;

export class AIHelperService {
  async chat(
    messages: ChatMessage[]
  ): Promise<{ reply: string; usage?: ChatCompletionResponse["usage"] }> {
    if (!env.OPENROUTER_API_KEY) {
      throw new AppError(503, "AI service is not configured");
    }

    const body = {
      model: MODEL,
      messages: [{ role: "system" as const, content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 1024,
      temperature: 0.7,
    };

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://inthearsenal.com",
        "X-Title": "In the Arsenal",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(
        { status: response.status, body: errorText },
        "OpenRouter error",
      );
      throw new AppError(502, "AI service returned an error");
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      throw new AppError(502, "AI service returned an empty response");
    }

    return { reply, usage: data.usage };
  }
}

export const aiHelperService = new AIHelperService();
