import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import type { ImageAttachment, ReplyMode } from "./types";

const modeInstructions: Record<ReplyMode, string> = {
  initial:
    "Answer directly and clearly. Keep ordinary answers concise; explain step by step only when useful.",
  simpler:
    "Explain the same topic in simpler language with one easy example when useful.",
  deeper:
    "Give a more detailed explanation with useful insights, but avoid unnecessary repetition.",
  check:
    "Ask one useful question to test the user's understanding. Do not reveal the answer immediately.",
};

const ZENO_IDENTITY = `
You are ZENO, a friendly, knowledgeable and adaptive AI assistant.

IDENTITY:
- Your name is ZENO.
- Your creator and project owner is Ankit Das.
- Your tagline is "Understand. Adapt. Improve."
- You are powered by Google's Gemini AI technology.
- Never claim that Ankit Das created the underlying Gemini model.
- If asked who created you, say: "I am ZENO, an AI assistant created and owned by Ankit Das."

BEHAVIOUR:
- Be accurate, respectful, natural and helpful.
- Answer the user's latest question directly.
- Keep simple answers short; give detail when the question needs it.
- Use examples when they genuinely help.
- Admit uncertainty instead of inventing facts.
`;

function getRuntimeEnvironment(): Record<string, string | undefined> {
  return (
    globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env ?? {};
}

function isOverloaded(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const details = error as {
    status?: unknown;
    statusCode?: unknown;
    message?: unknown;
  };

  if (details.status === 503 || details.statusCode === 503) {
    return true;
  }

  const message =
    typeof details.message === "string" ? details.message : "";

  return /503|UNAVAILABLE|high demand|temporarily overloaded/i.test(message);
}

export async function generateZenoReply(
  prompt: string,
  mode: ReplyMode,
  image?: ImageAttachment,
): Promise<string> {
  const runtimeEnv = getRuntimeEnvironment();
  const apiKey = runtimeEnv["GEMINI_API_KEY"];

  if (!apiKey) {
    throw new Error(
      "Gemini API key is missing. Check GEMINI_API_KEY in the project-root .env.local file.",
    );
  }

  // Flash-Lite is Google's current stable high-throughput model.
  // The 3.6 Flash model is used only as a backup after a 503 overload.
  const primaryModel = "gemini-3.5-flash-lite";
  const fallbackModel = "gemini-3.6-flash";

  const requestTimeout = image ? 28_000 : 18_000;

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: requestTimeout,
      retryOptions: { attempts: 1 },
    },
  });

  const contents = image
    ? [
        {
          inlineData: {
            mimeType: image.mimeType,
            data: image.data,
          },
        },
        { text: prompt },
      ]
    : prompt;

  const config = {
    systemInstruction: `${ZENO_IDENTITY}\n\nCURRENT RESPONSE MODE:\n${modeInstructions[mode]}`,
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MINIMAL,
    },
    maxOutputTokens: 800,
  };

  try {
    const response = await ai.models.generateContent({
      model: primaryModel,
      contents,
      config,
    });

    const answer = response.text?.trim();
    if (!answer) throw new Error("ZENO received an empty response from Gemini.");
    return answer;
  } catch (primaryError) {
    // Do not spend another full request timeout on deadline/quota/auth errors.
    // Try the backup only when Google explicitly reports temporary overload.
    if (!isOverloaded(primaryError)) {
      throw primaryError;
    }

    console.warn(
      `ZENO primary model is overloaded. Trying backup model ${fallbackModel}.`,
    );

    try {
      const response = await ai.models.generateContent({
        model: fallbackModel,
        contents,
        config,
      });

      const answer = response.text?.trim();
      if (!answer) throw new Error("ZENO received an empty response from its backup model.");
      return answer;
    } catch (fallbackError) {
      console.error("ZENO backup model request failed:", fallbackError);
      throw new Error(
        "Gemini is temporarily unavailable. Please try again shortly.",
      );
    }
  }
}
