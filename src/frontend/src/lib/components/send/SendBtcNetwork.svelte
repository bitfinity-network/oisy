<script lang="ts">
	import { BTC_MAINNET_NETWORK_ID, BTC_TESTNET_NETWORK_ID } from '$env/networks.env';
	import {
		BTC_MAINNET_TOKEN,
		BTC_REGTEST_TOKEN,
		BTC_TESTNET_TOKEN
	} from '$env/tokens/tokens.btc.env';
	import type { NetworkId } from '$lib/types/network';

	export let networkId: NetworkId;
</script>

{#if BTC_MAINNET_NETWORK_ID === networkId}
	{BTC_MAINNET_TOKEN.name}
{:else if BTC_TESTNET_NETWORK_ID === networkId}
	{BTC_TESTNET_TOKEN.name}
{:else}
	{BTC_REGTEST_TOKEN.name}
{/if}
