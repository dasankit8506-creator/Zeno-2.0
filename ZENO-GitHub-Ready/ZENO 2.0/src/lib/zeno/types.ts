
export type ChatRole = "user" | "assistant";

export type ReplyMode = "initial" | "simpler" | "deeper" | "check";

export type ImageMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/webp";

export interface ImageAttachment {
  mimeType: ImageMimeType;
  data: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  mode?: ReplyMode;

  // Temporary image preview for the current browser session.
  imagePreview?: string;
}

export type ChatStatus = "ready" | "submitted";
