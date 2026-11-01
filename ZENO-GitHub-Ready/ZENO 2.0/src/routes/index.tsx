import { createFileRoute } from "@tanstack/react-router";
import { ZenoChat } from "@/components/zeno/zeno-chat";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZENO — Understand. Adapt. Improve." },
      {
        name: "description",
        content:
          "ZENO is an adaptive AI companion. Explore difficult ideas, solve problems, and check your understanding — one conversation at a time.",
      },
      { property: "og:title", content: "ZENO — Understand. Adapt. Improve." },
      {
        property: "og:description",
        content:
          "Meet ZENO, an adaptive AI companion for exploring ideas, solving problems, and deepening understanding.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "ZENO — Understand. Adapt. Improve." },
      {
        name: "twitter:description",
        content:
          "Meet ZENO, an adaptive AI companion for exploring ideas, solving problems, and deepening understanding.",
      },
    ],
  }),
  component: ZenoChat,
});
