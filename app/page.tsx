"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useWidgetProps,
  useMaxHeight,
  useDisplayMode,
  useRequestDisplayMode,
  useIsChatGptApp,
} from "./hooks";

export default function Home() {
  const toolOutput = useWidgetProps<{
    name?: string;
    result?: { structuredContent?: { name?: string } };
  }>();
  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useDisplayMode();
  const requestDisplayMode = useRequestDisplayMode();
  const isChatGptApp = useIsChatGptApp();

  const name = toolOutput?.result?.structuredContent?.name || toolOutput?.name;

  return (
    <div
      className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20"
      style={{
        maxHeight,
        height: displayMode === "fullscreen" ? maxHeight : undefined,
      }}
    >
      {displayMode !== "fullscreen" && (
        <button
          aria-label="Enter fullscreen"
          className="fixed top-4 right-4 z-50 p-3 cursor-pointer transition-all rounded-full border hover:shadow-md"
          style={{
            backgroundColor: "var(--color-background-primary)",
            color: "var(--color-text-primary)",
            borderColor: "var(--color-border)",
          }}
          onClick={() => requestDisplayMode("fullscreen")}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
            />
          </svg>
        </button>
      )}
      <main className="flex flex-col row-start-2 items-center sm:items-start gap-8">
        {!isChatGptApp && (
          <div
            className="w-full p-4 rounded-lg border"
            style={{
              backgroundColor: "var(--color-background-secondary)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-body-small font-medium">
                This app relies on data from a ChatGPT session.
              </p>
              <p className="text-body-small font-medium">
                No{" "}
                <a
                  href="https://developers.openai.com/apps-sdk/reference"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline px-1.5 py-0.5 rounded"
                  style={{
                    fontFamily: "var(--font-mono)",
                    backgroundColor: "var(--color-background-primary)",
                  }}
                >
                  window.openai
                </a>{" "}
                property detected
              </p>
            </div>
          </div>
        )}
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol
          className="list-inside list-decimal text-center sm:text-left text-body-small space-y-2"
          style={{
            fontFamily: "var(--font-mono)",
            letterSpacing: "-0.01em",
          }}
        >
          <li>Welcome to the ChatGPT Apps SDK Next.js Starter</li>
          <li>Name returned from tool call: {name ?? "..."}</li>
          <li>MCP server path: /mcp</li>
        </ol>
      </main>
    </div>
  );
}
