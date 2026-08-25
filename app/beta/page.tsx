import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import styles from "./beta.module.css";

const DISCORD_SIGN_IN_URL = "https://app.traderslink.pro/api/auth/discord/login?returnTo=%2Fworkspace";

const BETA_FEATURES = [
  {
    description: "Enter the executions you took each day and TradersLink builds the trades for you. Review them by ticker with replay charts, then add notes, tags, and rules.",
    title: "Daily Trade Tracker",
  },
  {
    description: "Analyze every trade, not just your totals. Study entries, exits, complete trades, and the habits that show up over time.",
    title: "Trade Analyzer",
  },
  {
    description: "Use preset trading rules that TradersLink can track from your recorded trades, then create rules for your own process.",
    title: "Smart Rules",
  },
  {
    description: "Get press-release alerts in your dashboard, including halt alerts, so important news stays visible while you review trades.",
    title: "Press Release Alerts",
  },
  {
    description: "Open a completed trade and review its executions, result, notes, tags, rules, and analysis in one place.",
    title: "Trade Explorer",
  },
  {
    description: "Explore your results by ticker, time of day, holding time, setups, and other patterns supported by your recorded trades.",
    title: "Analytics",
  },
] as const;

export const metadata: Metadata = {
  title: "TradersLink Beta",
  description: "Free Discord beta access to TradersLink trade review tools.",
  alternates: { canonical: "/beta" },
};

export default function BetaLandingPage() {
  return (
    <main className={styles.page}>
      <section className={styles.frame}>
        <section className={styles.panel}>
          <Link aria-label="TradersLink homepage" className={styles.logo} href="/">
            <Image alt="TradersLink" height={74} priority src="/logo-horizontal-main.png" width={360} />
          </Link>

          <header className={styles.intro}>
            <p>Now available</p>
            <h1>TradersLink <strong>Beta App</strong></h1>
            <span>Free beta access for all TradersLink Discord members</span>
          </header>

          <div className={styles.featureList}>
            {BETA_FEATURES.map((feature, index) => (
              <article className={styles.feature} key={feature.title}>
                <span aria-hidden="true" className={styles.featureNumber}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2>{feature.title}</h2>
                  <p>{feature.description}</p>
                </div>
              </article>
            ))}
          </div>

          <section className={styles.action}>
            <p>Log in for free with your Discord account.</p>
            <a className={styles.actionButton} href={DISCORD_SIGN_IN_URL}>
              Continue with Discord
            </a>
          </section>
        </section>
      </section>
    </main>
  );
}
