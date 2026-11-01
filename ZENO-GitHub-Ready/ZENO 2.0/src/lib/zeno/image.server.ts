import { GoogleGenAI } from "@google/genai";

export type ImageGenerationMode = "quality" | "speed";
export type ImageAspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export interface GeneratedImageResult {
  data: string;
  mimeType: string;
  model: string;
}

function getRuntimeEnvironment(): Record<string, string | undefined> {
  return (
    globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env ?? {};
}

export async function generateZenoImage(
  prompt: string,
  mode: ImageGenerationMode,
  aspectRatio: ImageAspectRatio,
): Promise<GeneratedImageResult> {
  const env = getRuntimeEnvironment();
  const apiKey = env["GEMINI_API_KEY"];

  if (!apiKey) {
    throw new Error(
      "Gemini API key is missing. Check GEMINI_API_KEY in the project-root .env.local file.",
    );
  }

  // Google model IDs from the current Gemini image-generation model list.
  const model =
    mode === "quality"
      ? "gemini-nano-banana-2.1"
      : "gemini-3.1-flash-lite-image";

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 120_000,
      retryOptions: { attempts: 1 },
    },
  });

  const interaction = await ai.interactions.create({
    model,
    input: prompt,
    response_format: {
      type: "image",
      mime_type: "image/png",
      aspect_ratio: aspectRatio,
      image_size: mode === "quality" ? "2K" : "1K",
    },
  });

  const outputImage = interaction.output_image;
  if (!outputImage?.data) {
    throw new Error(
      "Gemini completed the request but did not return an image. Try a clearer prompt or another aspect ratio.",
    );
  }

  return {
    data: outputImage.data,
    mimeType: outputImage.mime_type || "image/png",
    model,
  };
}
