<script lang="ts">
	import { debounce } from '@dfinity/utils';
	import { combinedDerivedSortedNetworkTokensUi } from '$lib/derived/network-tokens.derived';
	import { showZeroBalances } from '$lib/derived/settings.derived';
	import type { TokenUi } from '$lib/types/token';
	import type { TokenUiOrGroupUi } from '$lib/types/token-group';
	import { groupTokensByTwin } from '$lib/utils/token-group.utils';
	import { isRequiredTokenWithLinkedData } from '$lib/utils/token.utils';

	// We start it as undefined to avoid showing an empty list before the first update.
	export let tokens: TokenUiOrGroupUi[] | undefined = undefined;

	let sortedTokens: TokenUi[];
	$: sortedTokens = $combinedDerivedSortedNetworkTokensUi.filter(
		({ balance, usdBalance, enabled, symbol }) =>
			(Number(balance ?? 0n) || (usdBalance ?? 0) || $showZeroBalances) &&
			(!symbol.startsWith('o') || enabled === true)
	);

	let groupedTokens: TokenUiOrGroupUi[];
	$: groupedTokens = groupTokensByTwin(sortedTokens);

	const updateTokensToDisplay = () => (tokens = [...groupedTokens]);

	const debounceUpdateTokensToDisplay = debounce(updateTokensToDisplay, 500);

	$: sortedTokens, debounceUpdateTokensToDisplay();
</script>

<slot />
