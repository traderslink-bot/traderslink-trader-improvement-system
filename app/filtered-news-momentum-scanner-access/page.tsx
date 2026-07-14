import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";

import { ACADEMY_SESSION_COOKIE, AcademyProgressStore } from "@/src/lib/academy/academy-progress-store";
import {
  AffiliateReferralStore,
  buildWhopCheckoutUrl,
  normalizeAffiliateCode,
} from "@/src/lib/affiliate-referrals/affiliate-referral-store";
import { TRADERSLINK_TWITTER_HANDLE } from "@/src/lib/academy/academy-seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const defaultDiscordInviteUrl = "https://discord.gg/rrq73JGfFf";
const pagePath = "/filtered-news-momentum-scanner-access";

export const metadata: Metadata = {
  title: "Filtered News + Momentum Scanner Access | TradersLink",
  description:
    "Get Discord access to filtered small-cap news, market-cap channels, momentum scanner alerts, AI summaries, and real-time support and resistance levels.",
  alternates: {
    canonical: pagePath,
  },
  openGraph: {
    title: "Filtered News + Momentum Scanner Access",
    description:
      "Small-cap news filtered by market cap, momentum scanner alerts, AI summaries, and support/resistance levels in Discord.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    creator: TRADERSLINK_TWITTER_HANDLE,
    site: TRADERSLINK_TWITTER_HANDLE,
    title: "Filtered News + Momentum Scanner Access",
    description:
      "Real-time small-cap news and scanner alerts with AI summaries and support/resistance levels.",
  },
};

interface UpgradePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

const includedFeatures = [
  "Real-time small-cap press release alerts filtered by market cap up to $100M",
  "Dedicated under-$30M, $30M-$50M, and $50M-$100M news channels",
  "Small-cap momentum scanner alerts in Discord",
  "News momentum scanner alerts for faster catalyst discovery",
  "Full AI-summarized article posts for paid Discord members",
  "Instant support and resistance levels attached to alerts",
  "Free Discord previews remain delayed, while paid channels receive the full post flow",
];

const howItWorks = [
  "Log in with Discord so paid channel access can be matched to the correct user.",
  "Continue to secure checkout on Whop to complete the $30 monthly plan.",
  "After purchase, Whop manages your subscription and unlocks the paid Discord channels.",
];

export default async function FilteredNewsMomentumScannerAccessPage({
  searchParams,
}: UpgradePageProps) {
  const params = await searchParams;
  const queryAffiliateCode = normalizeAffiliateCode(firstParam(params?.a));
  const cookieStore = await cookies();
  const academySession = await new AcademyProgressStore().getSessionByToken(
    cookieStore.get(ACADEMY_SESSION_COOKIE)?.value,
  );
  const referral = academySession
    ? await new AffiliateReferralStore().findReferralByDiscordUserId(
        academySession.discordUserId,
      )
    : null;

  const affiliateCode = queryAffiliateCode || referral?.affiliateCode || "";
  const checkoutUrl = buildWhopCheckoutUrl({ affiliateCode });
  const discordInviteUrl =
    process.env.TRADERSLINK_FREE_DISCORD_INVITE_URL || defaultDiscordInviteUrl;
  const returnToPath = queryAffiliateCode
    ? `${pagePath}?a=${encodeURIComponent(queryAffiliateCode)}`
    : pagePath;
  const connectDiscordUrl = `/api/auth/discord/login?returnTo=${encodeURIComponent(returnToPath)}`;
  const discordName = academySession?.user.globalName || academySession?.user.username || "";

  return (
    <main className="min-h-screen bg-[#071017] text-slate-100">
      <section className="border-b border-cyan-200/15 bg-[linear-gradient(180deg,#071017_0%,#0d1f24_52%,#111827_100%)]">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" aria-label="TradersLink homepage" className="flex items-center">
            <span className="flex h-12 w-[232px] items-center overflow-hidden rounded-md border border-cyan-100/20 bg-[#011E56] px-3 shadow-[0_12px_30px_rgba(1,30,86,0.3)]">
              <Image
                alt="TradersLink"
                className="h-auto w-full"
                height={74}
                priority
                src="/logo-horizontal-main.png"
                width={360}
              />
            </span>
          </Link>
          <a
            className="rounded-md border border-cyan-200/25 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-100/60 hover:bg-cyan-100/10"
            href={discordInviteUrl}
            rel="noreferrer"
            target="_blank"
          >
            Join Free Discord
          </a>
        </nav>

        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 pb-14 pt-10 sm:px-8 lg:grid-cols-[minmax(0,0.62fr)_minmax(320px,0.38fr)] lg:pb-18 lg:pt-16">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
              TradersLink paid Discord access
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Real-time small-cap news and momentum alerts with support and resistance.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              The paid $30 plan gives you Discord access to small-cap news filtered
              by market cap, the small-cap momentum scanner, the news momentum
              scanner, and instant real-time support and resistance levels.
            </p>
            {!academySession ? (
              <div className="mt-7 rounded-lg border border-emerald-200/20 bg-emerald-950/16 p-5">
                <p className="text-base font-semibold text-white">
                  To get started with paid access, log in with Discord.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  This lets TradersLink match your purchase to the correct Discord
                  user before sending you to Whop checkout.
                </p>
              </div>
            ) : (
              <div className="mt-7 rounded-lg border border-emerald-200/20 bg-emerald-950/16 p-5">
                <p className="text-base font-semibold text-white">
                  Logged in with Discord{discordName ? `: ${discordName}` : ""}.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  You can continue to Whop checkout. Whop will handle payment,
                  subscription management, and paid Discord channel access.
                </p>
              </div>
            )}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {academySession ? (
                <a
                  className="rounded-md bg-emerald-300 px-5 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-emerald-200"
                  href={checkoutUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Continue to Whop Checkout
                </a>
              ) : (
                <Link
                  className="rounded-md bg-emerald-300 px-5 py-3 text-center text-sm font-bold text-slate-950 transition hover:bg-emerald-200"
                  href={connectDiscordUrl}
                >
                  Log In with Discord
                </Link>
              )}
              <a
                className="rounded-md border border-cyan-200/25 px-5 py-3 text-center text-sm font-bold text-cyan-100 transition hover:border-cyan-100/60 hover:bg-cyan-100/10"
                href={discordInviteUrl}
                rel="noreferrer"
                target="_blank"
              >
                Join Free Discord
              </a>
            </div>
          </div>

          <aside className="rounded-lg border border-cyan-100/18 bg-slate-950/45 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.32)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
              Paid plan
            </p>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-5xl font-semibold text-white">$30</span>
              <span className="pb-2 text-sm font-semibold text-slate-400">USD / month</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Payment is completed through Whop. After checkout, Whop handles the
              paid product access and connects your purchase to Discord so the
              paid channels unlock for your account.
            </p>
            <div className="mt-5 border-t border-cyan-100/15 pt-5">
              <p className="text-sm font-semibold text-white">
                {academySession
                  ? `Ready for checkout${discordName ? `: ${discordName}` : ""}`
                  : "Discord login required before checkout"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Payment and subscription management are handled securely by Whop.
                If Whop asks you to log in with Discord after purchase, use the same
                Discord account so the paid channels unlock correctly.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-[#101720] py-12">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.56fr)_minmax(300px,0.44fr)]">
          <div>
            <h2 className="text-2xl font-semibold text-white">What you get</h2>
            <div className="mt-6 grid gap-3">
              {includedFeatures.map((feature) => (
                <div
                  className="rounded-md border border-slate-700/80 bg-slate-950/32 px-4 py-3 text-sm leading-6 text-slate-200"
                  key={feature}
                >
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white">How access works</h2>
            <div className="mt-6 grid gap-4">
              {howItWorks.map((step, index) => (
                <div
                  className="rounded-md border border-emerald-200/18 bg-emerald-950/16 p-4"
                  key={step}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
                    Step {index + 1}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}
