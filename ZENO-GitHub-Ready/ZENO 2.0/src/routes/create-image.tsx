import { createFileRoute } from "@tanstack/react-router";
import { ImageCreator } from "@/components/zeno/image-creator";

export const Route = createFileRoute("/create-image")({
  component: ImageCreator,
});
