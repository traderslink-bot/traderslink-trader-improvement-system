import { revalidatePath } from "next/cache";

import {
  type NewsArticleInput,
  upsertNewsArticle,
} from "@/src/lib/news/news-article-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(status: number, code: string, message: string): Response {
  return Response.json({ ok: false, code, message }, { status });
}

function requestOrigin(request: Request): string {
  const configured = process.env.NEWS_PUBLIC_BASE_URL;

  if (configured) {
    return configured.replace(/\/+$/g, "");
  }

  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function isAuthorized(request: Request): boolean {
  const expectedToken = process.env.NEWS_PUBLISH_TOKEN;

  if (!expectedToken) {
    return process.env.VERCEL_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization") || "";
  const bearerToken = authHeader.replace(/^Bearer\s+/i, "").trim();
  const headerToken = request.headers.get("x-news-publish-token") || "";

  return bearerToken === expectedToken || headerToken === expectedToken;
}

export async function POST(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    return jsonError(401, "unauthorized", "Invalid news publish token.");
  }

  let input: NewsArticleInput;

  try {
    input = (await request.json()) as NewsArticleInput;
  } catch {
    return jsonError(400, "invalid_json", "Request body must be valid JSON.");
  }

  try {
    const article = await upsertNewsArticle(input);
    const articlePath = `/news/${encodeURIComponent(
      article.ticker,
    )}/${encodeURIComponent(article.slug)}`;
    const freeArticlePath = `/news/free/${encodeURIComponent(
      article.ticker,
    )}/${encodeURIComponent(article.slug)}`;

    revalidatePath(articlePath);
    revalidatePath(freeArticlePath);
    revalidatePath(`/news/${article.ticker}`);
    revalidatePath("/news");

    return Response.json({
      ok: true,
      contractVersion: "traderslink_news_article_publish_v1",
      article,
      articlePath,
      articleUrl: `${requestOrigin(request)}${articlePath}`,
      freeArticlePath,
      freeArticleUrl: `${requestOrigin(request)}${freeArticlePath}`,
    });
  } catch (error) {
    return jsonError(
      400,
      "invalid_news_article",
      error instanceof Error ? error.message : String(error),
    );
  }
}
