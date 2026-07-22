import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("watchlist display contract", () => {
  const clientSource = readFileSync(
    join(process.cwd(), "app", "watchlist", "live-watchlist-client.tsx"),
    "utf8",
  );
  const cssSource = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
  const accessPageSources = [
    join(process.cwd(), "app", "watchlist", "page.tsx"),
    join(process.cwd(), "app", "watchlist", "[symbol]", "page.tsx"),
    join(process.cwd(), "app", "watchlist", "archive", "page.tsx"),
    join(process.cwd(), "app", "watchlist", "archive", "[archiveId]", "page.tsx"),
  ].map((path) => readFileSync(path, "utf8"));

  it("keeps pullback state logic without rendering a visible state badge", () => {
    expect(clientSource).toContain("resolveTradersLinkAiPullbackScenarioState(scenario, livePrice)");
    expect(clientSource).toContain('data-scenario-state={state.toLowerCase().replaceAll(" ", "-")}');
    expect(clientSource).toContain('heading="Shallow pullback — momentum retest"');
    expect(clientSource).toContain('heading="Deep pullback — reset setup"');
    expect(clientSource).not.toContain("<span>{state}</span>");
  });

  it("shows the price-delay note on the watchlist and ticker detail", () => {
    expect(clientSource).toContain("Price <small className=\"watchlist-price-delay-note\">(may be slightly delayed)</small>");
    expect(clientSource).toContain("(prices may be slightly delayed)");
  });

  it("matches the high-risk heading to the Potential Path ticker size", () => {
    expect(cssSource).toMatch(/\.watchlist-v2-card-title h2\s*\{[\s\S]*?font-size:\s*1\.25rem;/);
    expect(cssSource).toMatch(/\.watchlist-high-risk-warning h2\s*\{[\s\S]*?font-size:\s*1\.25rem;/);
    expect(cssSource).toMatch(/\.watchlist-high-risk-warning p\s*\{[\s\S]*?font-size:\s*0\.86rem;/);
  });

  it("labels every watchlist authentication action as Discord login", () => {
    for (const source of accessPageSources) {
      expect(source).toContain("Log in with Discord");
      expect(source).not.toContain("Refresh Discord access");
    }
  });
});
