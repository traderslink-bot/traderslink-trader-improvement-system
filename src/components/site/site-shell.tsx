"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";

import {
  TRADERSLINK_DISCORD_INVITE_URL,
  TRADERSLINK_X_URL,
} from "@/src/lib/academy/academy-seo";

type SiteTheme = "light" | "dark";
type SiteAuthSnapshot =
  | { authenticated: false; displayName: null }
  | { authenticated: true; displayName: string };

const themeStorageKey = "traderslink-site-theme";
const legacyThemeStorageKey = "traderslink-academy-theme";
const signedOutAuthSnapshot: SiteAuthSnapshot = {
  authenticated: false,
  displayName: null,
};

export function SiteShell({
  children,
  forcedTheme,
  shellElement = "div",
}: {
  children: ReactNode;
  forcedTheme?: SiteTheme;
  sectionHref?: string;
  sectionLabel?: string;
  shellElement?: "div" | "main";
}) {
  const [selectedTheme, setSelectedTheme] = useState<SiteTheme>("light");
  const [auth, setAuth] = useState<SiteAuthSnapshot>(signedOutAuthSnapshot);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const ShellElement = shellElement;
  const theme = forcedTheme ?? selectedTheme;
  const logoSrc =
    theme === "light"
      ? "/logo-horizontal-light.png"
      : "/logo-horizontal-main.png";

  useEffect(() => {
    if (forcedTheme) {
      return;
    }

    function syncTheme() {
      setSelectedTheme(getThemeSnapshot());
    }

    syncTheme();
    window.addEventListener("storage", syncTheme);
    window.addEventListener("traderslink-site-theme-change", syncTheme);
    window.addEventListener("traderslink-academy-theme-change", syncTheme);

    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("traderslink-site-theme-change", syncTheme);
      window.removeEventListener("traderslink-academy-theme-change", syncTheme);
    };
  }, [forcedTheme]);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/me", {
      credentials: "same-origin",
    })
      .then((response) =>
        response.ok ? response.json() : { authenticated: false, user: null },
      )
      .then((body: unknown) => {
        if (!cancelled) {
          setAuth(getAuthSnapshotFromResponse(body));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAuth(signedOutAuthSnapshot);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function selectTheme(nextTheme: SiteTheme) {
    if (forcedTheme) {
      return;
    }
    setSelectedTheme(nextTheme);
    window.localStorage.setItem(themeStorageKey, nextTheme);
    window.localStorage.setItem(legacyThemeStorageKey, nextTheme);
    window.dispatchEvent(new Event("traderslink-site-theme-change"));
    window.dispatchEvent(new Event("traderslink-academy-theme-change"));
  }

  return (
    <ShellElement className="academy-shell" data-academy-theme={theme}>
      <header className="academy-topbar">
        <div className="academy-topbar-inner">
          <div className="academy-brand">
            <Link
              href="/"
              className="academy-brand-logo-link"
              aria-label="TradersLink homepage"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoSrc}
                alt="TradersLink"
                className="academy-brand-logo"
              />
            </Link>
            <span className="academy-brand-divider" aria-hidden="true" />
            <Link href="/academy/" className="academy-brand-label">
              Academy Courses
            </Link>
          </div>

          <div className="academy-topbar-actions">
            <SiteTopbarControls
              auth={auth}
              showThemeToggle={!forcedTheme}
              onSelectTheme={selectTheme}
              theme={theme}
            />
          </div>

          <button
            type="button"
            className="academy-menu-button"
            aria-controls="site-mobile-menu"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close site menu" : "Open site menu"}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>

          <div
            id="site-mobile-menu"
            className="academy-mobile-menu"
            data-open={isMenuOpen}
          >
            <SiteTopbarControls
              auth={auth}
              showThemeToggle={!forcedTheme}
              onSelectTheme={(nextTheme) => {
                selectTheme(nextTheme);
                setIsMenuOpen(false);
              }}
              theme={theme}
            />
          </div>
        </div>
      </header>
      {children}
    </ShellElement>
  );
}

function SiteTopbarControls({
  auth,
  onSelectTheme,
  showThemeToggle,
  theme,
}: {
  auth: SiteAuthSnapshot;
  onSelectTheme: (theme: SiteTheme) => void;
  showThemeToggle: boolean;
  theme: SiteTheme;
}) {
  return (
    <>
      <SocialIconLinks />

      {auth.authenticated ? (
        <div className="academy-auth-group">
          <span className="academy-auth-status">
            Signed in as {auth.displayName}
          </span>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="academy-logout-button">
              Log out
            </button>
          </form>
        </div>
      ) : (
        <a
          href="/api/auth/discord/login?returnTo=%2Facademy%2F"
          className="academy-login-link"
        >
          Log in with Discord
        </a>
      )}
      {showThemeToggle ? (
        <div
          className="academy-theme-toggle"
          role="group"
          aria-label="Site color theme"
        >
          <button
            type="button"
            aria-pressed={theme === "light"}
            onClick={() => onSelectTheme("light")}
          >
            Light
          </button>
          <button
            type="button"
            aria-pressed={theme === "dark"}
            onClick={() => onSelectTheme("dark")}
          >
            Dark
          </button>
        </div>
      ) : null}
    </>
  );
}

function SocialIconLinks() {
  return (
    <div className="academy-social-links" aria-label="TradersLink social links">
      <SocialIconLink ariaLabel="Follow TradersLink on X" href={TRADERSLINK_X_URL}>
        <svg
          aria-hidden="true"
          className="academy-social-icon"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.96 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
        </svg>
      </SocialIconLink>

      <SocialIconLink
        ariaLabel="Join the TradersLink Discord server"
        href={TRADERSLINK_DISCORD_INVITE_URL}
      >
        <svg
          aria-hidden="true"
          className="academy-social-icon academy-social-icon-discord"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M20.32 4.37A19.8 19.8 0 0 0 15.36 2.8a13.78 13.78 0 0 0-.64 1.32 18.29 18.29 0 0 0-5.48 0 13.78 13.78 0 0 0-.64-1.32 19.73 19.73 0 0 0-4.96 1.57C.5 9.04-.35 13.6.07 18.1a19.93 19.93 0 0 0 6.08 3.08 14.82 14.82 0 0 0 1.3-2.12 12.89 12.89 0 0 1-2.05-.98c.17-.13.34-.26.5-.4a14.18 14.18 0 0 0 12.2 0c.16.14.33.27.5.4-.65.39-1.34.72-2.05.98.37.74.8 1.45 1.3 2.12a19.86 19.86 0 0 0 6.08-3.08c.5-5.22-.84-9.73-3.61-13.73ZM8.02 15.33c-1.18 0-2.15-1.08-2.15-2.42s.95-2.42 2.15-2.42 2.17 1.09 2.15 2.42c0 1.34-.95 2.42-2.15 2.42Zm7.96 0c-1.18 0-2.15-1.08-2.15-2.42s.95-2.42 2.15-2.42 2.17 1.09 2.15 2.42c0 1.34-.95 2.42-2.15 2.42Z" />
        </svg>
      </SocialIconLink>
    </div>
  );
}

function SocialIconLink({
  ariaLabel,
  children,
  href,
}: {
  ariaLabel: string;
  children: ReactNode;
  href: string;
}) {
  return (
    <a
      aria-label={ariaLabel}
      className="academy-social-link"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

function getThemeSnapshot(): SiteTheme {
  const savedTheme = window.localStorage.getItem(themeStorageKey);

  return savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light";
}

function getAuthSnapshotFromResponse(body: unknown): SiteAuthSnapshot {
  const candidate = body as {
    authenticated?: unknown;
    user?: {
      globalName?: unknown;
      username?: unknown;
    } | null;
  };
  const user = candidate.user;

  return candidate.authenticated === true && user
    ? {
        authenticated: true,
        displayName:
          typeof user.globalName === "string" && user.globalName
            ? user.globalName
            : typeof user.username === "string" && user.username
              ? user.username
              : "TradersLink member",
      }
    : signedOutAuthSnapshot;
}
