import type { Metadata } from "next";

import {
  buildNewsArticleMetadata,
  NewsArticleView,
} from "@/app/news/[ticker]/[slug]/page";

type PageProps = {
  params: Promise<{
    ticker: string;
    slug: string;
  }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  return buildNewsArticleMetadata({ ...props, accessMode: "free" });
}

export default async function FreeNewsArticlePage(props: PageProps) {
  return <NewsArticleView {...props} accessMode="free" />;
}
