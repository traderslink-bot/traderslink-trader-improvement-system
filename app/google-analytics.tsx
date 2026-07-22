"use client";

import { Suspense, useEffect } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";

type GoogleAnalyticsParams = Record<
  string,
  string | number | boolean | null | undefined
>;

type GoogleAnalyticsCommand =
  | [command: "js", date: Date]
  | [
      command: "config",
      measurementId: string,
      params?: GoogleAnalyticsParams,
    ]
  | [command: "event", eventName: string, params?: GoogleAnalyticsParams];

declare global {
  interface Window {
    dataLayer?: GoogleAnalyticsCommand[];
    gtag?: (...args: GoogleAnalyticsCommand) => void;
  }
}

const GOOGLE_ANALYTICS_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/;

const configuredMeasurementId = (
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
  process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID ||
  "G-KKDBE5323S"
).trim();

export const GOOGLE_ANALYTICS_MEASUREMENT_ID =
  GOOGLE_ANALYTICS_MEASUREMENT_ID_PATTERN.test(configuredMeasurementId)
    ? configuredMeasurementId
    : "";

const isGoogleAnalyticsEnabled =
  GOOGLE_ANALYTICS_MEASUREMENT_ID.length > 0 &&
  process.env.NEXT_PUBLIC_DISABLE_GA !== "true" &&
  (process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_ENABLE_GA_IN_DEV === "true");

export function GoogleAnalytics() {
  if (!isGoogleAnalyticsEnabled) {
    return null;
  }

  const measurementId = JSON.stringify(GOOGLE_ANALYTICS_MEASUREMENT_ID);

  return (
    <>
      <Script
        id="google-analytics-loader"
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = window.gtag || function(){window.dataLayer.push(arguments);}
          window.gtag('js', new Date());
          window.gtag('config', ${measurementId}, { send_page_view: false });
        `}
      </Script>
      <Suspense fallback={null}>
        <GoogleAnalyticsPageViews />
      </Suspense>
    </>
  );
}

export function trackGoogleAnalyticsEvent(
  eventName: string,
  params?: GoogleAnalyticsParams,
) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", eventName, params);
}

function GoogleAnalyticsPageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() ?? "";

  useEffect(() => {
    let isCancelled = false;

    const sendPageView = () => {
      if (isCancelled) {
        return;
      }

      if (typeof window.gtag !== "function") {
        window.setTimeout(sendPageView, 100);
        return;
      }

      const pagePath = searchParamsString
        ? `${pathname}?${searchParamsString}`
        : pathname;

      window.gtag("event", "page_view", {
        page_path: pagePath,
        page_location: window.location.href,
        page_title: document.title,
      });
    };

    sendPageView();

    return () => {
      isCancelled = true;
    };
  }, [pathname, searchParamsString]);

  return null;
}
