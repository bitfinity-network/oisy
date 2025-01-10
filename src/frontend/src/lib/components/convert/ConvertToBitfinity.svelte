<script lang="ts">
	import { isNullish, nonNullish } from '@dfinity/utils';
	import { selectedEthereumNetwork } from '$eth/derived/network.derived';
	import { ethereumToken, ethereumTokenId } from '$eth/derived/token.derived';
	import ConvertBTF from '../../../btf/send/ConvertBTF.svelte';
	import IconCkConvert from '../icons/IconCkConvert.svelte';
	import { tokenWithFallback } from '$lib/derived/token.derived';
	import { i18n } from '$lib/stores/i18n.store';
	import { isRequiredTokenWithLinkedData } from '$lib/utils/token.utils';
	import type { RequiredTokenWithLinkedData } from '$lib/types/token';
	import { modalConvertToTwinToken } from '$lib/derived/modal.derived';
	import { ICP_NETWORK } from '$env/networks.env';
	import { ckEthHelperContractAddress } from '$icp-eth/derived/cketh.derived';
	import BTFSendTokenModal from '../../../btf/send/BTFSendTokenModal.svelte';
	import { ethAddressNotLoaded } from '$lib/derived/address.derived';
	import { ckEthMinterInfoStore } from '$icp-eth/stores/cketh.store';
	import { networkICP } from '$lib/derived/network.derived';
	import { setContext } from 'svelte';
	import { initSendContext, SEND_CONTEXT_KEY } from '$lib/stores/send.store';

	$: token = isRequiredTokenWithLinkedData($tokenWithFallback)
		? ($tokenWithFallback as RequiredTokenWithLinkedData)
		: undefined;
	$: isBitfinityToken = nonNullish(token) && token.symbol.startsWith('o');
	$: isTwinTokenBitfinity = nonNullish(token) && token.twinTokenSymbol?.startsWith('o');
	$: targetSymbol = nonNullish(token)
		? isBitfinityToken
			? token.symbol.slice(1)
			: `o${token.symbol}`
		: '';

	/**
	 * Send modal context store
	 */
	const context = initSendContext({
		sendPurpose: 'convert-to-twin-token',
		token: $tokenWithFallback
	});
	setContext(SEND_CONTEXT_KEY, context);
</script>

<ConvertBTF ariaLabel={`Bridge to ${targetSymbol}`}>
	<IconCkConvert size="28" slot="icon" />
	<span>{targetSymbol}</span>
</ConvertBTF>

{#if $modalConvertToTwinToken}
	<BTFSendTokenModal
		destination={$ckEthHelperContractAddress ?? ''}
		targetNetwork={token?.network}
	/>
{/if}
