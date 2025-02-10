"use client";

import * as React from "react";

import useWindowSize from "@/lib/hooks/use-window-size";

import { motion, AnimatePresence } from "motion/react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { Message } from "ai";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface InputPanelProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  messages: Array<Message>;
  setMessages: (messages: Array<Message>) => void;
  query?: string;
  stop: () => void;
  append: (message: any) => void;
}

export function Input({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  messages,
  setMessages,
  query,
  stop,
  append,
}: InputPanelProps) {
  const [showEmptyScreen, setShowEmptyScreen] = React.useState(false);
  const router = useRouter();
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const isFirstMessage = React.useRef(true);

  const [isComposing, setIsComposing] = React.useState(false);
  const [enterDisabled, setEnterDisabled] = React.useState(false);

  const handlerCompositionStart = () => setIsComposing(true);

  const handleCompositionEnd = () => {
    setIsComposing(false);
    setEnterDisabled(true);

    setTimeout(() => {
      setEnterDisabled(false);
    }, 300);
  };

  const handleNewChat = () => {
    setMessages([]);
    router.push("/");
  };

  React.useEffect(() => {
    if (isFirstMessage.current && query && query.trim().length > 0) {
      append({
        role: "user",
        content: query,
      });
      isFirstMessage.current = false;
    }
  }, [query]);

  return (
    <div
      className={cn(
        "mx-auto w-full",
        messages.length > 0
          ? "fixed bottom-0 left-0 right-0"
          : "flex flex-col items-center justify-center",
      )}
    >
      {messages.length === 0 && (
        <div className="mb-4 ">
          <h1 className="text-2xl">Where Knowledge Begins</h1>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className={cn(
          "max-w-3xl w-full mx-auto",
          messages.length > 0 ? "px-2 py-4" : "",
        )}
      >
        <div className="relative flex flex-col w-full gap-2 border-2 border-input bg-zinc-900/50 rounded-lg p-4 focus-within:border-zinc-700/70 hover:border-zinc-700/70 transition-all duration-200">
          <Textarea
            ref={inputRef}
            name="input"
            rows={3}
            tabIndex={0}
            onCompositionStart={handlerCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder="Ask me anything..."
            spellCheck={true}
            value={input}
            className="resize-none w-full min-h-12 bg-transparent ring-0 border-0  text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
            onChange={(e) => {
              handleInputChange(e);
              setShowEmptyScreen(e.target.value.length === 0);
            }}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !isComposing &&
                !enterDisabled
              ) {
                if (input.trim().length === 0) {
                  e.preventDefault();
                  return;
                }

                e.preventDefault();
                const textarea = e.target as HTMLTextAreaElement;
                textarea.form?.requestSubmit();
              }
            }}
            onFocus={() => setShowEmptyScreen(true)}
            onBlur={() => setShowEmptyScreen(false)}
          />
        </div>
      </form>
    </div>
  );
}
