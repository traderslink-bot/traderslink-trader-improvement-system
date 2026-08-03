"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PromptMode = "hidden" | "scroll" | "exit";

const dismissalKey = "traderslink-free-discord-prompt-dismissed-until";
const dismissalDurationMs = 30 * 24 * 60 * 60 * 1000;

function isDismissed() {
  try {
    const dismissedUntil = Number(window.localStorage.getItem(dismissalKey));

    return Number.isFinite(dismissedUntil) && dismissedUntil > Date.now();
  } catch {
    return false;
  }
}

export function FreeDiscordPrompt({
  discordInviteUrl,
}: {
  discordInviteUrl: string;
}) {
  const [mode, setMode] = useState<PromptMode>("hidden");
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(
        dismissalKey,
        String(Date.now() + dismissalDurationMs),
      );
    } catch {
      // The prompt can still close when browser storage is unavailable.
    }

    setMode("hidden");
  }, []);

  useEffect(() => {
    if (isDismissed()) {
      return;
    }

    const showScrollPrompt = () => {
      const pageHeight = document.documentElement.scrollHeight;
      const scrollProgress = (window.scrollY + window.innerHeight) / pageHeight;

      if (scrollProgress >= 0.45) {
        setMode((currentMode) =>
          currentMode === "hidden" ? "scroll" : currentMode,
        );
      }
    };

    const showExitPrompt = (event: MouseEvent) => {
      if (
        event.relatedTarget === null &&
        event.clientY <= 0 &&
        window.matchMedia("(pointer: fine)").matches
      ) {
        setMode((currentMode) =>
          currentMode === "hidden" || currentMode === "scroll"
            ? "exit"
            : currentMode,
        );
      }
    };

    window.addEventListener("scroll", showScrollPrompt, { passive: true });
    document.addEventListener("mouseout", showExitPrompt);
    showScrollPrompt();

    return () => {
      window.removeEventListener("scroll", showScrollPrompt);
      document.removeEventListener("mouseout", showExitPrompt);
    };
  }, []);

  useEffect(() => {
    if (mode !== "exit") {
      return;
    }

    closeButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismiss();
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [dismiss, mode]);

  if (mode === "hidden") {
    return null;
  }

  const content = (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
        Free community
      </p>
      <h2
        className="mt-3 text-2xl font-semibold text-white"
        id="free-discord-prompt-title"
      >
        Join the Free TradersLink Discord
      </h2>
      <p
        className="mt-3 text-sm leading-6 text-slate-300"
        id="free-discord-prompt-description"
      >
        Get free access to the TradersLink community, market discussion, and
        updates as new tools roll out.
      </p>
      <a
        className="tl-home-cta mt-5 inline-flex min-h-12 w-full items-center justify-center border border-cyan-300 bg-cyan-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
        href={discordInviteUrl}
        onClick={dismiss}
        rel="noopener noreferrer"
        target="_blank"
      >
        Join Free Discord
      </a>
      <p className="mt-3 text-center text-xs text-slate-500">
        Free to join. Opens Discord in a new tab.
      </p>
    </>
  );

  if (mode === "scroll") {
    return (
      <aside
        aria-label="Join the free TradersLink Discord"
        className="fixed bottom-5 right-5 z-40 w-[calc(100%-2.5rem)] max-w-sm border border-cyan-300/30 bg-slate-950 p-5 shadow-2xl shadow-cyan-950/60 sm:bottom-8 sm:right-8"
      >
        <button
          aria-label="Dismiss Discord prompt"
          className="absolute right-3 top-3 rounded p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          onClick={dismiss}
          type="button"
        >
          <span aria-hidden="true">&times;</span>
        </button>
        {content}
      </aside>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-5 backdrop-blur-sm">
      <section
        aria-describedby="free-discord-prompt-description"
        aria-labelledby="free-discord-prompt-title"
        aria-modal="true"
        className="relative w-full max-w-md border border-cyan-300/35 bg-[#06152b] p-6 shadow-2xl shadow-cyan-950/70"
        role="dialog"
      >
        <button
          aria-label="Dismiss Discord prompt"
          className="absolute right-4 top-4 rounded p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          onClick={dismiss}
          ref={closeButtonRef}
          type="button"
        >
          <span aria-hidden="true">&times;</span>
        </button>
        <p className="text-sm font-semibold text-emerald-300">Before you go</p>
        {content}
      </section>
    </div>
  );
}

