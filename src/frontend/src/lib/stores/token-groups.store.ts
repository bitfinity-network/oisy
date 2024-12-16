import { combinedDerivedSortedNetworkTokensUi } from '$lib/derived/network-tokens.derived';
import { groupTokens, type TokenGroups } from '$lib/types/token-groups';
import { derived } from 'svelte/store';

export const tokenGroups = derived<typeof combinedDerivedSortedNetworkTokensUi, TokenGroups>(
	combinedDerivedSortedNetworkTokensUi,
	($tokens) => groupTokens($tokens ?? [])
);
