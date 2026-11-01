import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateZenoImage } from "./image.server";

const imageGenerationSchema = z.object({
  prompt: z.string().trim().min(3).max(4000),
  mode: z.enum(["quality", "speed"]),
  aspectRatio: z.enum(["1:1", "3:4", "4:3", "9:16", "16:9"]),
});

export const generateImage = createServerFn({ method: "POST" })
  .validator(imageGenerationSchema)
  .handler(async ({ data }) => {
    return generateZenoImage(
      data.prompt,
      data.mode,
      data.aspectRatio,
    );
  });
