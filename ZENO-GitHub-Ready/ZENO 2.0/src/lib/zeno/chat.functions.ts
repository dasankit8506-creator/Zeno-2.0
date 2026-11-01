
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateZenoReply } from "./chat.server";

const imageSchema = z.object({
  mimeType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]),
  data: z.string()
    .min(1)
    .max(2_800_000),
});

const chatRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(20000),
  mode: z.enum(["initial", "simpler", "deeper", "check"]),
  image: imageSchema.optional(),
});

export const generateChatReply = createServerFn({
  method: "POST",
})
  .validator(chatRequestSchema)
  .handler(async ({ data }) => {
    return generateZenoReply(
      data.prompt,
      data.mode,
      data.image,
    );
  });
