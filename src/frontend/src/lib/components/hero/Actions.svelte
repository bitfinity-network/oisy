<script lang="ts">
	import { page } from '$app/stores';
	import ConvertToCkBTC from '$btc/components/convert/ConvertToCkBTC.svelte';
	import BtcReceive from '$btc/components/receive/BtcReceive.svelte';
	import { BTC_TO_CKBTC_EXCHANGE_ENABLED } from '$env/networks.btc.env';
	import EthReceive from '$eth/components/receive/EthReceive.svelte';
	import ConvertToCkERC20 from '$eth/components/send/ConvertToCkERC20.svelte';
	import ConvertToCkETH from '$eth/components/send/ConvertToCkETH.svelte';
	import { erc20UserTokensInitialized } from '$eth/derived/erc20.derived';
	import ConvertToBTC from '$icp/components/convert/ConvertToBTC.svelte';
	import ConvertToEthereum from '$icp/components/convert/ConvertToEthereum.svelte';
	import IcReceive from '$icp/components/receive/IcReceive.svelte';
	import { tokenCkBtcLedger } from '$icp/derived/ic-token.derived';
	import { erc20ToCkErc20Enabled, ethToCkETHEnabled } from '$icp-eth/derived/cketh.derived';
	import Buy from '$lib/components/buy/Buy.svelte';
	import Receive from '$lib/components/receive/Receive.svelte';
	import Send from '$lib/components/send/Send.svelte';
	import HeroButtonGroup from '$lib/components/ui/HeroButtonGroup.svelte';
	import { allBalancesZero } from '$lib/derived/balances.derived';
	import {
		networkEthereum,
		networkICP,
		networkBitcoin,
		pseudoNetworkChainFusion,
		networkId
	} from '$lib/derived/network.derived';
	import { tokenWithFallback } from '$lib/derived/token.derived';
	import { isRouteTransactions } from '$lib/utils/nav.utils';
	import { isNetworkIdBTCMainnet } from '$lib/utils/network.utils';
	import { ethereumTokenId } from '$eth/derived/token.derived';
	import { selectedEthereumNetwork } from '$eth/derived/network.derived';
	import ConvertETH from '$icp-eth/components/send/ConvertETH.svelte';
	import IconCkConvert from '$lib/components/icons/IconCkConvert.svelte';
	import { i18n } from '$lib/stores/i18n.store';
	import ConvertToBitfinity from '$lib/components/convert/ConvertToBitfinity.svelte';
	import { isRequiredTokenWithLinkedData } from '$lib/utils/token.utils';
	import { nonNullish } from '@dfinity/utils';
	import { tokens } from '$lib/derived/tokens.derived';


	function containsOToken(tokens, symbol) {
		return tokens.filter((t) => t.symbol === `o${symbol}`);
	}
	let hasOToken = containsOToken($tokens, $tokenWithFallback.symbol);
	console.log("containsOToken($tokens, $tokenWithFallback.symbol)", containsOToken($tokens, $tokenWithFallback.symbol));
	let convertEth = false;
	$: convertEth = $ethToCkETHEnabled && $erc20UserTokensInitialized;

	let convertErc20 = false;
	$: convertErc20 = $erc20ToCkErc20Enabled && $erc20UserTokensInitialized;

	let convertCkBtc = false;
	$: convertCkBtc = $tokenCkBtcLedger && $erc20UserTokensInitialized;

	let convertBtc = false;
	$: convertBtc = BTC_TO_CKBTC_EXCHANGE_ENABLED && isNetworkIdBTCMainnet($networkId);

	let isTransactionsPage = false;
	$: isTransactionsPage = isRouteTransactions($page);

	let sendAction = true;
	$: sendAction = !$allBalancesZero || isTransactionsPage;

	$: showBitfinityBridge =
		isTransactionsPage &&
		isRequiredTokenWithLinkedData($tokenWithFallback) &&
		nonNullish($tokenWithFallback.twinTokenSymbol);


	let showIcrcBrige = false;
	$: showIcrcBrige = hasOToken && !$allBalancesZero 
	
</script>

<div role="toolbar" class="flex w-full justify-center pt-10">
	<HeroButtonGroup>
		{#if $networkICP}
			<IcReceive token={$tokenWithFallback} />
		{:else if $networkEthereum}
			<EthReceive token={$tokenWithFallback} />
		{:else if $networkBitcoin}
			<BtcReceive />
		{:else if $pseudoNetworkChainFusion}
			<Receive />
		{/if}

		{#if sendAction}
			<Send {isTransactionsPage} /> 
		{/if}

		{#if isTransactionsPage}
			{#if convertEth}
				{#if $networkICP}
					<ConvertToEthereum />
				{:else}
					<ConvertToCkETH />
				{/if}
			{/if}

			{#if convertErc20}
				{#if $networkICP}
					<ConvertToEthereum />
				{:else}
					<ConvertToCkERC20 />
				{/if}
			{/if}

			{#if convertCkBtc}
				<ConvertToBTC />
			{/if}

			{#if convertBtc}
				<ConvertToCkBTC />
			{/if}
			

			{#if showBitfinityBridge}
				<ConvertToBitfinity />
			{/if}

			{#if showIcrcBrige}
				<!-- TODO: Implement ICRC bridge -->
				<ConvertToBitfinity />
			{/if}

		{/if}

		<Buy />
	</HeroButtonGroup>
</div>
