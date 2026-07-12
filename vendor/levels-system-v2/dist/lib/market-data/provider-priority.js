export const DEFAULT_PROVIDER_PRIORITY = [
    "ibkr",
    "stub",
];
export function resolveProviderPriority(preferredProvider) {
    if (!preferredProvider) {
        return [...DEFAULT_PROVIDER_PRIORITY];
    }
    return [
        preferredProvider,
        ...DEFAULT_PROVIDER_PRIORITY.filter((provider) => provider !== preferredProvider),
    ];
}
