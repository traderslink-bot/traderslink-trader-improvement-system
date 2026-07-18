export interface TraderIntelligenceOwnerIdentity {
  ownerId: string;
}

export interface TraderIntelligenceOwnerContext {
  identity: TraderIntelligenceOwnerIdentity;
  authorizationMode:
    | "local_owner_adapter"
    | "provisional_discord_session_adapter";
}
