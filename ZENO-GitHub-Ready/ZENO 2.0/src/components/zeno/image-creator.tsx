import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Download, ImagePlus, LoaderCircle, WandSparkles } from "lucide-react";
import { generateImage } from "@/lib/zeno/image.functions";
import type {
  GeneratedImageResult,
  ImageAspectRatio,
  ImageGenerationMode,
} from "@/lib/zeno/image.server";

const aspectRatios: ImageAspectRatio[] = ["1:1", "3:4", "4:3", "9:16", "16:9"];

export function ImageCreator() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<ImageGenerationMode>("quality");
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>("1:1");
  const [result, setResult] = useState<GeneratedImageResult | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function runGeneration() {
    if (busy || prompt.trim().length < 3) return;

    setBusy(true);
    setError("");
    setResult(null);

    try {
      const generated = await generateImage({
        data: {
          prompt: prompt.trim(),
          mode,
          aspectRatio,
        },
      });
      setResult(generated);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Image generation failed. Please try again.";
      setError(message.slice(0, 400));
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runGeneration();
  }

  const imageUrl = result
    ? `data:${result.mimeType};base64,${result.data}`
    : "";

  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-foreground md:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to ZENO
          </Link>
          <div className="text-right">
            <div className="font-display text-lg font-semibold tracking-[0.2em]">ZENO</div>
            <div className="text-xs text-muted-foreground">Image Studio</div>
          </div>
        </header>

        <section className="space-y-3 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
            <WandSparkles className="size-7" />
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Create with ZENO
          </h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground md:text-base">
            Describe the image you have in mind. Choose quality or speed, then let ZENO create it.
          </p>
        </section>

        <form onSubmit={handleGenerate} className="space-y-5 rounded-2xl border bg-card p-4 shadow-sm md:p-6">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Describe your image</span>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              maxLength={4000}
              rows={4}
              required
              minLength={3}
              placeholder="Example: A cinematic view of a futuristic Kolkata skyline at sunset, photorealistic, dramatic warm lighting..."
              className="w-full resize-y rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <span className="block text-right text-xs text-muted-foreground">{prompt.length}/4000</span>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium">Generation mode</legend>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("quality")}
                  aria-pressed={mode === "quality"}
                  className={`rounded-xl border p-3 text-left text-sm transition ${mode === "quality" ? "border-primary bg-primary/10" : "bg-background hover:bg-accent"}`}
                >
                  <strong className="block">Quality</strong>
                  <span className="mt-1 block text-xs text-muted-foreground">Higher detail · 2K</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("speed")}
                  aria-pressed={mode === "speed"}
                  className={`rounded-xl border p-3 text-left text-sm transition ${mode === "speed" ? "border-primary bg-primary/10" : "bg-background hover:bg-accent"}`}
                >
                  <strong className="block">Speed</strong>
                  <span className="mt-1 block text-xs text-muted-foreground">Faster · 1K</span>
                </button>
              </div>
            </fieldset>

            <label className="space-y-2">
              <span className="block text-sm font-medium">Aspect ratio</span>
              <select
                value={aspectRatio}
                onChange={(event) => setAspectRatio(event.target.value as ImageAspectRatio)}
                className="w-full rounded-xl border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
              >
                {aspectRatios.map((ratio) => (
                  <option key={ratio} value={ratio}>{ratio}</option>
                ))}
              </select>
              <span className="block text-xs text-muted-foreground">Choose square, portrait, or landscape.</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={busy || prompt.trim().length < 3}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <LoaderCircle className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
            {busy ? "Creating your image..." : "Generate image"}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Image generation uses your Gemini API quota and may incur charges. Generated images include Google's SynthID watermark.
          </p>
        </form>

        {error && (
          <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {result && (
          <section className="space-y-3 rounded-2xl border bg-card p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Your generated image</h2>
                <p className="text-xs text-muted-foreground">Model: {result.model}</p>
              </div>
              <a
                href={imageUrl}
                download="zeno-generated-image.png"
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition hover:bg-accent"
              >
                <Download className="size-4" /> Download
              </a>
            </div>
            <img
              src={imageUrl}
              alt={`Generated image: ${prompt}`}
              className="mx-auto max-h-[720px] w-full rounded-xl border bg-background object-contain"
            />
            <button
              type="button"
              onClick={() => void runGeneration()}
              disabled={busy}
              className="w-full rounded-xl border px-4 py-2.5 text-sm font-medium transition hover:bg-accent disabled:opacity-50"
            >
              Generate another version
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
