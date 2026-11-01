import { describe, expect, it } from "vitest";
import {
  DEMO_NOTE,
  SUGGESTED_PROMPTS,
  getResponse,
  selectTrack,
} from "@/lib/zeno/demo-engine";

describe("zeno demo engine", () => {
  it("routes each suggested prompt to the matching track", () => {
    expect(selectTrack("Explain something difficult")).toBe("difficult");
    expect(selectTrack("Help me solve a problem")).toBe("problem");
    expect(selectTrack("Explore a new idea")).toBe("idea");
  });

  it("answers every suggested prompt in all four reply modes", () => {
    for (const { prompt } of SUGGESTED_PROMPTS) {
      for (const mode of ["initial", "simpler", "deeper", "check"] as const) {
        const reply = getResponse(prompt, mode);
        expect(reply.length).toBeGreaterThan(50);
      }
    }
  });

  it("gives distinct content for each reply mode", () => {
    const modes = ["initial", "simpler", "deeper", "check"] as const;
    const replies = modes.map((mode) => getResponse("Explore a new idea", mode));
    expect(new Set(replies).size).toBe(modes.length);
  });

  it("labels demo content so it is never mistaken for a live model", () => {
    expect(DEMO_NOTE).toMatch(/demo/i);
    expect(DEMO_NOTE).toMatch(/no AI model/i);
  });
});
