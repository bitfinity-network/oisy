<script lang="ts">
	import { nonNullish } from '@dfinity/utils';
	import ConvertBTF from '../../../btf/send/ConvertBTF.svelte';
	import IconCkConvert from '../icons/IconCkConvert.svelte';
	import { tokenWithFallback } from '$lib/derived/token.derived';
	import { hasTwinToken, isRequiredTokenWithLinkedData } from '$lib/utils/token.utils';
	import type { RequiredTokenWithLinkedData } from '$lib/types/token';
	import { modalConvertToTwinToken } from '$lib/derived/modal.derived';
	import { ckEthHelperContractAddress } from '$icp-eth/derived/cketh.derived';
	import BTFSendTokenModal from '../../../btf/send/BTFSendTokenModal.svelte';
	import { setContext } from 'svelte';
	import { initSendContext, SEND_CONTEXT_KEY } from '$lib/stores/send.store';

	$: token = isRequiredTokenWithLinkedData($tokenWithFallback)
		? ($tokenWithFallback as RequiredTokenWithLinkedData)
		: undefined;
	$: isIcrcToken = token?.standard === 'icrc';
	$: isBitfinityToken = nonNullish(token) && token.symbol.startsWith('o');
	$: shouldShowConvertButton =
		nonNullish(token) && (isIcrcToken || hasTwinToken(token) || isBitfinityToken);
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

{#if shouldShowConvertButton}
	<ConvertBTF ariaLabel={`Bridge to ${targetSymbol}`}>
		<IconCkConvert size="28" slot="icon" />
		<span>{targetSymbol}</span>
	</ConvertBTF>
{/if}

{#if $modalConvertToTwinToken}
	<BTFSendTokenModal
		destination={$ckEthHelperContractAddress ?? ''}
		targetNetwork={token?.network}
	/>
{/if}
