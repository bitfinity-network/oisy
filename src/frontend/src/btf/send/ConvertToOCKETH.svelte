<script lang="ts">
	import { setContext } from 'svelte';
	import { ICP_NETWORK } from '$env/networks.env';
	import { selectedEthereumNetwork } from '$eth/derived/network.derived';
	import { ethereumToken, ethereumTokenId } from '$eth/derived/token.derived';
	import ConvertETH from '$icp-eth/components/send/ConvertETH.svelte';
	import { ckEthHelperContractAddress } from '$icp-eth/derived/cketh.derived';
	import IconCkConvert from '$lib/components/icons/IconCkConvert.svelte';
	import { modalConvertToTwinTokenOckEth } from '$lib/derived/modal.derived';
	import { i18n } from '$lib/stores/i18n.store';
	import { initSendContext, SEND_CONTEXT_KEY, type SendContext } from '$lib/stores/send.store';
	import BtfSendTokenModal from './BTFSendTokenModal.svelte';
	import ConvertBtf from './ConvertBTF.svelte';

	/**
	 * Send modal context store
	 */

	const context = initSendContext({
		sendPurpose: 'convert-btf-to-ocketh',
		token: $ethereumToken
	});
	setContext<SendContext>(SEND_CONTEXT_KEY, context);
</script>

<ConvertBtf
	nativeTokenId={$ethereumTokenId}
	nativeNetworkId={$selectedEthereumNetwork.id}
	ariaLabel={$i18n.convert.text.convert_to_ocketh}
>
	<IconCkConvert size="28" slot="icon" />
	<span>{$ethereumToken.twinTokenSymbol ?? ''}</span>
</ConvertBtf>

{#if $modalConvertToTwinTokenOckEth}
	<BtfSendTokenModal destination={$ckEthHelperContractAddress ?? ''} targetNetwork={ICP_NETWORK} />
{/if}
