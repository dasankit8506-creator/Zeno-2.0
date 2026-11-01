
import { useEffect, useRef, useState } from "react";
import {
  ClockIcon,
  ListChecksIcon,
  Maximize2Icon,
  Minimize2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";

import {
  Message as ChatMessagePrimitive,
  MessageContent as ChatMessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";

import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";

import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { ZenoLogo } from "@/components/zeno/zeno-logo";

import { SUGGESTED_PROMPTS } from "@/lib/zeno/demo-engine";
import { makeId, sendMessage } from "@/lib/zeno/chat-service";

import type {
  ChatMessage,
  ChatStatus,
  ReplyMode,
} from "@/lib/zeno/types";

import { cn } from "@/lib/utils";

interface SavedChat {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

const STORAGE_KEY = "zeno-conversations-v2";
const MAX_SAVED_CHATS = 30;
const MAX_SAVED_MESSAGES = 40;
const REQUEST_TIMEOUT = 90000;

const ADAPTIVE_ACTIONS: Array<{
  label: string;
  mode: ReplyMode;
  icon: typeof Maximize2Icon;
}> = [
  { label: "Simpler", mode: "simpler", icon: Minimize2Icon },
  { label: "Go deeper", mode: "deeper", icon: Maximize2Icon },
  {
    label: "Check my understanding",
    mode: "check",
    icon: ListChecksIcon,
  },
];

function isSavedChat(value: unknown): value is SavedChat {
  if (!value || typeof value !== "object") return false;

  const chat = value as SavedChat;

  return (
    typeof chat.id === "string" &&
    typeof chat.title === "string" &&
    typeof chat.updatedAt === "number" &&
    Array.isArray(chat.messages) &&
    chat.messages.every(
      (message: unknown) =>
        !!message &&
        typeof message === "object" &&
        typeof (message as ChatMessage).id === "string" &&
        typeof (message as ChatMessage).text === "string" &&
        ["user", "assistant"].includes(
          (message as ChatMessage).role,
        ),
    )
  );
}

function getChatTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find(
    (message) => message.role === "user",
  );

  if (!firstUserMessage) return "New conversation";

  const title = firstUserMessage.text.trim();

  return title.length > 42
    ? `${title.slice(0, 42)}...`
    : title;
}

function buildConversationPrompt(messages: ChatMessage[]): string {
  const recentMessages = messages.slice(-18);

  const conversation = recentMessages
    .map((message) => {
      const speaker =
        message.role === "user" ? "User" : "ZENO";

      return `${speaker}: ${message.text}`;
    })
    .join("\n\n");

  return `
Continue the following conversation as ZENO.

Use previous messages to understand the user's context.
Answer the latest user message directly.
Do not unnecessarily repeat previous answers.
Do not pretend to remember information that is not included.

CONVERSATION HISTORY:

${conversation}

Now respond to the latest user message.
`;
}

function withTimeout<T>(
  promise: Promise<T>,
  milliseconds: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(
        new Error(
          "The request took too long. Check your Gemini connection and try again.",
        ),
      );
    }, milliseconds);

    promise.then(
      (result) => {
        window.clearTimeout(timer);
        resolve(result);
      },
      (error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 250);
  }

  return "An unexpected connection error occurred.";
}

export function ZenoChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("ready");

  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const [hydrated, setHydrated] = useState(false);
  const [errorNotice, setErrorNotice] = useState("");

  const sendingRef = useRef(false);

  const busy = status === "submitted";

  // Restore saved conversations.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed: unknown = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          const validChats = parsed
            .filter(isSavedChat)
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, MAX_SAVED_CHATS);

          setSavedChats(validChats);

          // Safe array access: fixes both TS2532 errors.
          const latestChat = validChats[0];

          if (latestChat) {
            setActiveChatId(latestChat.id);
            setMessages(latestChat.messages);
          }
        }
      }
    } catch (error) {
      console.error("ZENO history restoration error:", error);
    }

    setHydrated(true);
  }, []);

  // Save conversations in browser storage.
  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(savedChats),
      );
    } catch (error) {
      console.error("ZENO history saving error:", error);
    }
  }, [savedChats, hydrated]);

  // Automatically save changes to the active conversation.
  useEffect(() => {
    if (!hydrated || !activeChatId || messages.length === 0) {
      return;
    }

    setSavedChats((previous) => {
      const existing = previous.find(
        (chat) => chat.id === activeChatId,
      );

      const updatedChat: SavedChat = {
        id: activeChatId,
        title: existing?.title ?? getChatTitle(messages),
        messages: messages.slice(-MAX_SAVED_MESSAGES),
        updatedAt: Date.now(),
      };

      return [
        updatedChat,
        ...previous.filter(
          (chat) => chat.id !== activeChatId,
        ),
      ]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_SAVED_CHATS);
    });
  }, [messages, activeChatId, hydrated]);

  // Send a message with conversation context.
  const handleSend = async (
    displayText: string,
    mode: ReplyMode = "initial",
  ) => {
    const trimmed = displayText.trim();

    if (!trimmed || sendingRef.current || !hydrated) return;

    sendingRef.current = true;
    setErrorNotice("");

    const chatId = activeChatId ?? makeId("chat");

    if (!activeChatId) {
      setActiveChatId(chatId);
    }

    const userMessage: ChatMessage = {
      id: makeId("user"),
      role: "user",
      text: trimmed,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setStatus("submitted");

    try {
      const contextualPrompt =
        buildConversationPrompt(updatedMessages);

      const reply = await withTimeout(
        sendMessage(contextualPrompt, mode),
        REQUEST_TIMEOUT,
      );

      const assistantMessage: ChatMessage = {
        id: makeId("assistant"),
        role: "assistant",
        text: reply.text,
        mode: reply.mode,
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);
    } catch (error) {
      console.error("ZENO request failed:", error);

      const message = getErrorMessage(error);
      setErrorNotice(message);

      setMessages((previous) => [
        ...previous,
        {
          id: makeId("assistant"),
          role: "assistant",
          text: `I couldn't complete that request. ${message}`,
        },
      ]);
    } finally {
      sendingRef.current = false;
      setStatus("ready");
    }
  };

  const handleNewChat = () => {
    if (sendingRef.current) return;

    setMessages([]);
    setActiveChatId(null);
    setErrorNotice("");
  };

  const handleOpenChat = (chat: SavedChat) => {
    if (sendingRef.current) return;

    setActiveChatId(chat.id);
    setMessages(chat.messages);
    setErrorNotice("");
  };

  const handleDeleteChat = (chatId: string) => {
    if (sendingRef.current) return;

    setSavedChats((previous) =>
      previous.filter((chat) => chat.id !== chatId),
    );

    if (activeChatId === chatId) {
      setMessages([]);
      setActiveChatId(null);
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-background">

      {/* HEADER */}
      <header className="flex items-center justify-between gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur md:px-8">

        <div className="flex items-center gap-3">
          <ZenoLogo size={34} className="shrink-0" />

          <div className="leading-tight">
            <div className="font-display text-lg font-semibold tracking-[0.2em] text-foreground">
              ZENO
            </div>

            <div className="hidden text-xs text-muted-foreground sm:block">
              Understand. <span className="text-primary">Adapt.</span>{" "}
              <span className="text-highlight">Improve.</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">

          {/* CHAT HISTORY */}
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium text-foreground hover:bg-accent">
              <ClockIcon className="size-4" />
              <span className="hidden sm:inline">History</span>
              <span>{savedChats.length}</span>
            </summary>

            <div className="absolute right-0 top-full z-50 mt-2 max-h-80 w-72 overflow-y-auto rounded-xl border bg-card p-2 shadow-xl">

              <div className="px-2 py-2 text-xs font-semibold text-muted-foreground">
                Your conversations
              </div>

              {savedChats.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">
                  No saved conversations yet.
                </p>
              ) : (
                savedChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="flex items-center gap-2 rounded-lg p-2 hover:bg-accent"
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenChat(chat)}
                      disabled={busy}
                      className="min-w-0 flex-1 truncate text-left text-sm text-foreground"
                    >
                      {chat.title}
                    </button>

                    <button
                      type="button"
                      title="Delete conversation"
                      aria-label={`Delete ${chat.title}`}
                      onClick={() => handleDeleteChat(chat.id)}
                      disabled={busy}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2Icon className="size-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </details>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNewChat}
            disabled={busy}
            className="gap-2 rounded-full"
          >
            <PlusIcon className="size-4" />
            <span className="hidden sm:inline">New chat</span>
          </Button>

        </div>
      </header>

      {/* CHAT AREA */}
      <Conversation className="zeno-scroll">

        {messages.length === 0 ? (
          <ConversationContent className="mx-auto w-full max-w-3xl px-4">
            <ConversationEmptyState className="min-h-[55vh]">

              <div className="flex flex-col items-center gap-5 py-10 text-center">
                <ZenoLogo size={64} />

                <div className="space-y-3">
                  <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                    Hello, I'm ZENO.
                  </h1>

                  <p className="mx-auto max-w-md text-base text-muted-foreground md:text-lg">
                    What would you like to explore today?
                  </p>

                  <p className="text-xs text-muted-foreground/80">
                    Understand. Adapt. Improve.
                  </p>
                </div>

                <div className="mt-2 grid w-full max-w-xl gap-3 sm:grid-cols-3">
                  {SUGGESTED_PROMPTS.map((item) => (
                    <button
                      key={item.prompt}
                      type="button"
                      disabled={busy}
                      onClick={() => handleSend(item.prompt)}
                      className="group flex flex-col gap-1 rounded-xl border bg-card/60 p-4 text-left transition-colors hover:border-primary/60 hover:bg-accent disabled:opacity-60"
                    >
                      <span className="text-sm font-semibold text-foreground">
                        {item.prompt}
                      </span>

                      <span className="text-xs leading-snug text-muted-foreground">
                        {item.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </ConversationEmptyState>
          </ConversationContent>
        ) : (
          <ConversationContent className="zeno-scroll mx-auto w-full max-w-3xl px-4 pb-6 pt-4">

            {messages.map((message) =>
              message.role === "user" ? (
                <ChatMessagePrimitive key={message.id} from="user">
                  <ChatMessageContent className="group-[.is-user]:rounded-2xl group-[.is-user]:bg-primary group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-primary-foreground">
                    <MessageResponse className="text-sm">
                      {message.text}
                    </MessageResponse>
                  </ChatMessageContent>
                </ChatMessagePrimitive>
              ) : (
                <AssistantMessage
                  key={message.id}
                  message={message}
                  busy={busy}
                  onAction={(label, mode) => handleSend(label, mode)}
                />
              ),
            )}

            {busy && (
              <div className="text-sm text-muted-foreground">
                <Shimmer className="font-display">
                  ZENO is thinking
                </Shimmer>
              </div>
            )}

          </ConversationContent>
        )}

        <ConversationScrollButton className="border-border bg-card" />
      </Conversation>

      {/* VISIBLE ERROR */}
      {errorNotice && (
        <div
          role="alert"
          className="mx-auto w-full max-w-3xl px-4 pb-2 text-sm text-destructive"
        >
          ZENO error: {errorNotice}
        </div>
      )}

      {/* MESSAGE INPUT */}
      <div className="border-t bg-card/40 px-4 pb-4 pt-3 md:px-8">
        <div className="mx-auto w-full max-w-3xl">

          <PromptInput
            onSubmit={({ text }) => handleSend(text ?? "")}
            className="rounded-2xl border-border bg-card shadow-sm"
          >
            <PromptInputTextarea
              placeholder="Ask ZENO anything…"
              className="min-h-14 resize-none border-none bg-transparent text-sm focus-visible:ring-0"
            />

            <PromptInputFooter className="justify-end">
              <PromptInputSubmit
                status={status}
                disabled={busy}
                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              />
            </PromptInputFooter>
          </PromptInput>

          <p className="mt-2 text-center text-[11px] text-muted-foreground/80">
            Conversations are saved in this browser. No sign-up required.
          </p>

        </div>
      </div>

    </div>
  );
}

interface AssistantMessageProps {
  message: ChatMessage;
  busy: boolean;
  onAction: (label: string, mode: ReplyMode) => void;
}

function AssistantMessage({
  message,
  busy,
  onAction,
}: AssistantMessageProps) {
  return (
    <ChatMessagePrimitive from="assistant" className="max-w-full">

      <ChatMessageContent className="group-[.is-assistant]:text-foreground">

        <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-card/60 px-2.5 py-1">
          <span
            className="size-1.5 rounded-full bg-highlight"
            aria-hidden="true"
          />

          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            ZENO
          </span>
        </div>

        <MessageResponse className="zeno-prose">
          {message.text}
        </MessageResponse>

      </ChatMessageContent>

      <div className={cn("mt-1 flex flex-wrap gap-2", busy && "opacity-60")}>
        {ADAPTIVE_ACTIONS.map(({ label, mode, icon: Icon }) => (
          <button
            key={mode}
            type="button"
            disabled={busy}
            onClick={() => onAction(label, mode)}
            className="inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground disabled:pointer-events-none"
          >
            <Icon className="size-3.5 text-primary" />
            {label}
          </button>
        ))}
      </div>

    </ChatMessagePrimitive>
  );
}


