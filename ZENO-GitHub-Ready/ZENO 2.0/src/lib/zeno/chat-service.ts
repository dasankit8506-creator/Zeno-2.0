import { generateChatReply } from "./chat.functions";
import type { ImageAttachment, ReplyMode } from "./types";

let counter = 0;

function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

export function makeId(prefix: string): string {
  return nextId(prefix);
}

async function respondTo(
  prompt: string,
  mode: ReplyMode,
  image?: ImageAttachment,
): Promise<string> {
  // Let errors reach the UI so ZENO can display them properly.
  return await generateChatReply({
    data: { prompt, mode, image },
  });
}

export interface SendMessageResult {
  text: string;
  mode: ReplyMode;
}

export async function sendMessage(
  prompt: string,
  mode: ReplyMode = "initial",
  image?: ImageAttachment,
): Promise<SendMessageResult> {
  const text = await respondTo(prompt, mode, image);
  return { text, mode };
}