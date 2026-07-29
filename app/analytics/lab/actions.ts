"use server";

import { buildAnalyticsLabPreview } from "./lab-query";
import {
  persistAnalyticsLabSavedView,
  removeAnalyticsLabSavedView,
} from "./lab-saved-views";
import { resolveAnalyticsLabRuntime } from "./lab-runtime";
import type {
  AnalyticsLabDeleteSavedViewResult,
  AnalyticsLabQuery,
  AnalyticsLabQueryResult,
  AnalyticsLabSavedViewResult,
} from "./lab-types";

export async function runAnalyticsLabQuery(
  query: AnalyticsLabQuery,
): Promise<AnalyticsLabQueryResult> {
  try {
    const runtime = await resolveAnalyticsLabRuntime();
    return {
      ok: true,
      preview: buildAnalyticsLabPreview(query, runtime),
    };
  } catch {
    return {
      ok: false,
      message: "That combination could not be calculated from the current V3 data.",
    };
  }
}

export async function saveAnalyticsLabView(
  nameInput: string,
  query: AnalyticsLabQuery,
): Promise<AnalyticsLabSavedViewResult> {
  const name = nameInput.trim().replace(/\s+/g, " ");
  if (name.length === 0 || name.length > 80) {
    return { ok: false, message: "Enter a view name up to 80 characters." };
  }
  try {
    const runtime = await resolveAnalyticsLabRuntime();
    buildAnalyticsLabPreview(query, runtime);
    const view = await persistAnalyticsLabSavedView(runtime, name, query);
    return { ok: true, view };
  } catch {
    return { ok: false, message: "The view could not be saved." };
  }
}

export async function deleteAnalyticsLabView(
  id: string,
): Promise<AnalyticsLabDeleteSavedViewResult> {
  if (!/^[a-f0-9-]{36}$/.test(id)) {
    return { ok: false, message: "The saved view could not be deleted." };
  }
  try {
    const runtime = await resolveAnalyticsLabRuntime();
    const deleted = await removeAnalyticsLabSavedView(runtime, id);
    return deleted
      ? { ok: true, id }
      : { ok: false, message: "The saved view no longer exists." };
  } catch {
    return { ok: false, message: "The saved view could not be deleted." };
  }
}
