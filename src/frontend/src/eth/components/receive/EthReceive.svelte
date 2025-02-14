<script lang="ts">
	import EthReceiveMetamask from '$eth/components/receive/EthReceiveMetamask.svelte';
	import { metamaskNotInitialized } from '$eth/derived/metamask.derived';
	import ReceiveButtonWithModal from '$lib/components/receive/ReceiveButtonWithModal.svelte';
	import ReceiveModal from '$lib/components/receive/ReceiveModal.svelte';
	import { ethAddressNotCertified } from '$lib/derived/address.derived';
	import { modalEthReceive } from '$lib/derived/modal.derived';
	import { networkAddress, networkEthereum } from '$lib/derived/network.derived';
	import { waitWalletReady } from '$lib/services/actions.services';
	import { i18n } from '$lib/stores/i18n.store';
	import { modalStore } from '$lib/stores/modal.store';
	import type { Token } from '$lib/types/token';
	import { authIdentity } from '$lib/derived/auth.derived';
	import { BitfinityBtcBridge } from '../../../btf/bridge/BitfinityBtcBridge';

	export let token: Token;
	let btcAddress = '';

	const isDisabled = (): boolean => $ethAddressNotCertified || $metamaskNotInitialized;

	const getBtcAddress = async () => {
		if (token.symbol === "oBTC" && $authIdentity) {
			const bridge = new BitfinityBtcBridge($authIdentity);
			btcAddress = await bridge.getBtcAddress();
			return btcAddress;
		}
		return $networkAddress;
	};

	const openReceive = async (modalId: symbol) => {
		if (isDisabled()) {
			const status = await waitWalletReady(isDisabled);

			if (status === 'timeout') {
				return;
			}
		}

		await getBtcAddress();
		modalStore.openEthReceive(modalId);
	};
</script>

<ReceiveButtonWithModal open={openReceive} isOpen={$modalEthReceive}>
	<ReceiveModal
		slot="modal"
		address={token.symbol === "oBTC" ? btcAddress : $networkAddress}
		addressToken={token}
		network={token.network}
		copyAriaLabel={token.symbol === "oBTC" 
			? $i18n.receive.bitcoin.text.bitcoin_address_copied 
			: $i18n.receive.ethereum.text.ethereum_address_copied}
	>
		<svelte:fragment slot="content">
			{#if $networkEthereum}
				<EthReceiveMetamask />
			{/if}
		</svelte:fragment>
	</ReceiveModal>
</ReceiveButtonWithModal>
