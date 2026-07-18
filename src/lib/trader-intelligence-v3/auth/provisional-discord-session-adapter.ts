import {
  ACADEMY_SESSION_COOKIE,
  AcademyProgressStore,
} from "@/src/lib/academy/academy-progress-store";

import type { TraderIntelligenceOwnerSessionResolver } from "./owner-authorization";

export const TRADER_INTELLIGENCE_PROVISIONAL_DISCORD_COOKIE =
  ACADEMY_SESSION_COOKIE;

export function provisionalDiscordSessionResolver(
  token: string | undefined,
): TraderIntelligenceOwnerSessionResolver {
  return {
    async resolveOwnerSubject() {
      const session = await new AcademyProgressStore().getSessionByToken(token);
      return session ? { subject: session.discordUserId } : null;
    },
  };
}
