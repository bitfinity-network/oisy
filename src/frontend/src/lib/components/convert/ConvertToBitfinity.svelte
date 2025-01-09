<script lang="ts">
	import { nonNullish } from '@dfinity/utils';
	import { selectedEthereumNetwork } from '$eth/derived/network.derived';
	import { ethereumToken, ethereumTokenId } from '$eth/derived/token.derived';
	import ConvertBTF from '../../../btf/send/ConvertBTF.svelte';
	import IconCkConvert from '../icons/IconCkConvert.svelte';
	import { tokenWithFallback } from '$lib/derived/token.derived';
	import { i18n } from '$lib/stores/i18n.store';
	import { isRequiredTokenWithLinkedData } from '$lib/utils/token.utils';
	import type { RequiredTokenWithLinkedData } from '$lib/types/token';
	import { modalConvertToTwinTokenOckEth } from '$lib/derived/modal.derived';
	import { ICP_NETWORK } from '$env/networks.env';
	import { ckEthHelperContractAddress } from '$icp-eth/derived/cketh.derived';
	import BTFSendTokenModal from '../../../btf/send/BTFSendTokenModal.svelte';
	import { ethAddressNotLoaded } from '$lib/derived/address.derived';
	import { ckEthMinterInfoStore } from '$icp-eth/stores/cketh.store';
	import { networkICP } from '$lib/derived/network.derived';

	$: token = isRequiredTokenWithLinkedData($tokenWithFallback)
		? ($tokenWithFallback as RequiredTokenWithLinkedData)
		: undefined;
	$: isBitfinityToken = nonNullish(token) && token.symbol.startsWith('o');
	$: targetSymbol = nonNullish(token)
		? isBitfinityToken
			? token.symbol.slice(1)
			: `o${token.symbol}`
		: '';
</script>

<ConvertBTF
	nativeTokenId={$ethereumTokenId}
	nativeNetworkId={$selectedEthereumNetwork.id}
	ariaLabel={isBitfinityToken ? `Bridge to ${targetSymbol}` : `Bridge to ${targetSymbol}`}
>
	<IconCkConvert size="28" slot="icon" />
	<span>{targetSymbol}</span>
</ConvertBTF>

{#if $modalConvertToTwinTokenOckEth}
	<BTFSendTokenModal destination={$ckEthHelperContractAddress ?? ''} targetNetwork={ICP_NETWORK} />
{/if}
