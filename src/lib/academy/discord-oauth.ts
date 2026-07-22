export interface DiscordOAuthConfig {
  clientId: string;
  clientSecret: string;
  guildId: string;
  redirectUri: string;
  inviteUrl: string;
}

export interface DiscordUser {
  id: string;
  username: string;
  global_name?: string | null;
  avatar?: string | null;
}

export interface DiscordGuildMember {
  joined_at?: string | null;
  roles?: string[];
  guild_owner?: boolean;
  user?: DiscordUser;
}

export interface DiscordUserGuild {
  id: string;
  name?: string | null;
  owner?: boolean;
}

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export type DiscordOAuthPrompt = "consent" | "none";

const DISCORD_API_BASE = "https://discord.com/api/v10";
const TRADERSLINK_DISCORD_GUILD_ID = "1433570740430573642";
const DISCORD_OAUTH_SCOPES = "identify guilds guilds.members.read";
const SILENT_OAUTH_RETRY_ERRORS = new Set([
  "account_selection_required",
  "consent_required",
  "interaction_required",
  "login_required",
]);

export function getDiscordOAuthConfig(origin: string): DiscordOAuthConfig {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const guildId = process.env.DISCORD_GUILD_ID ?? TRADERSLINK_DISCORD_GUILD_ID;
  const redirectUri =
    process.env.DISCORD_REDIRECT_URI ??
    new URL("/api/auth/discord/callback", origin).toString();

  if (!clientId || !clientSecret || !guildId) {
    throw new Error(
      "Discord OAuth is not configured. Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET.",
    );
  }

  return {
    clientId,
    clientSecret,
    guildId,
    redirectUri,
    inviteUrl: process.env.DISCORD_INVITE_URL ?? "/academy/",
  };
}

export function buildDiscordAuthorizeUrl(args: {
  config: DiscordOAuthConfig;
  prompt: DiscordOAuthPrompt;
  state: string;
}): string {
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", args.config.clientId);
  url.searchParams.set("redirect_uri", args.config.redirectUri);
  url.searchParams.set("scope", DISCORD_OAUTH_SCOPES);
  url.searchParams.set("prompt", args.prompt);
  url.searchParams.set("state", args.state);

  return url.toString();
}

export function shouldRetryDiscordOAuthWithConsent(args: {
  error: string | null;
  prompt: string | undefined;
}): boolean {
  return (
    args.prompt === "none" &&
    typeof args.error === "string" &&
    SILENT_OAUTH_RETRY_ERRORS.has(args.error)
  );
}

export async function exchangeDiscordCode(args: {
  config: DiscordOAuthConfig;
  code: string;
}): Promise<DiscordTokenResponse> {
  const body = new URLSearchParams({
    client_id: args.config.clientId,
    client_secret: args.config.clientSecret,
    grant_type: "authorization_code",
    code: args.code,
    redirect_uri: args.config.redirectUri,
  });

  const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Discord token exchange failed with ${response.status}.`);
  }

  return (await response.json()) as DiscordTokenResponse;
}

export async function fetchDiscordCurrentUser(
  accessToken: string,
): Promise<DiscordUser> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Discord user lookup failed with ${response.status}.`);
  }

  return (await response.json()) as DiscordUser;
}

export async function fetchDiscordCurrentGuildMember(args: {
  accessToken: string;
  guildId: string;
}): Promise<DiscordGuildMember | null> {
  const response = await fetch(
    `${DISCORD_API_BASE}/users/@me/guilds/${args.guildId}/member`,
    {
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
      },
    },
  );

  if (
    response.status === 401 ||
    response.status === 403 ||
    response.status === 404
  ) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Discord guild membership check failed with ${response.status}.`,
    );
  }

  return (await response.json()) as DiscordGuildMember;
}

export async function fetchDiscordCurrentUserGuilds(
  accessToken: string,
): Promise<DiscordUserGuild[]> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Discord guild list lookup failed with ${response.status}.`);
  }

  return (await response.json()) as DiscordUserGuild[];
}

export async function resolveDiscordCurrentGuildMembership(args: {
  accessToken: string;
  guildId: string;
}): Promise<DiscordGuildMember | null> {
  let memberLookupError: unknown = null;

  try {
    const guildMember = await fetchDiscordCurrentGuildMember(args);

    if (guildMember) {
      return guildMember;
    }
  } catch (error) {
    memberLookupError = error;
  }

  try {
    const guilds = await fetchDiscordCurrentUserGuilds(args.accessToken);

    if (guilds.some((guild) => guild.id === args.guildId)) {
      return { joined_at: null };
    }

    return null;
  } catch (error) {
    throw memberLookupError ?? error;
  }
}

export function getSafeDiscordAuthErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown Discord auth error.";
}
