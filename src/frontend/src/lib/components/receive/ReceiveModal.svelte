<script lang="ts">
	import { Modal } from '@dfinity/gix-components';
	import ReceiveAddressQRCodeContent from '$lib/components/receive/ReceiveAddressQRCodeContent.svelte';
	import ReceiveTitle from '$lib/components/receive/ReceiveTitle.svelte';
	import ButtonDone from '$lib/components/ui/ButtonDone.svelte';
	import ContentWithToolbar from '$lib/components/ui/ContentWithToolbar.svelte';
	import { RECEIVE_TOKENS_MODAL_COPY_ADDRESS_BUTTON } from '$lib/constants/test-ids.constants';
	import { modalStore } from '$lib/stores/modal.store';
	import type { OptionAddress, Address } from '$lib/types/address';
	import type { Network } from '$lib/types/network';
	import type { Token } from '$lib/types/token';
	import { networkAddress } from '$lib/derived/network.derived';
	import { BITFINITY_NETWORK, BTC_MAINNET_NETWORK } from '$env/networks.env';
	import { i18n } from '$lib/stores/i18n.store';
	import Hr from '../ui/Hr.svelte';

	export let address: OptionAddress<Address> = undefined;
	export let addressToken: Token | undefined = undefined;

	export let network: Network;
	export let copyAriaLabel: string;
</script>

<Modal on:nnsClose={modalStore.close}>
	<ReceiveTitle slot="title" {addressToken} />

	<ContentWithToolbar>
		{#if addressToken?.symbol === "oBTC"}
			<ReceiveAddressQRCodeContent
				copyButtonTestId={RECEIVE_TOKENS_MODAL_COPY_ADDRESS_BUTTON}
				address={$networkAddress}
				{addressToken}
				network={BITFINITY_NETWORK}
				description={"Use this address to transfer oBTC to and from your wallet."}
				addressLabel={"Wallet address"}
				qrCodeAction={{ enabled: false }}
				copyAriaLabel={"EVM Address copied to clipboard."}
			/>
			<Hr spacing="lg" />

			<slot name="content" />
			
		{/if}
		<ReceiveAddressQRCodeContent
			copyButtonTestId={RECEIVE_TOKENS_MODAL_COPY_ADDRESS_BUTTON}
			{address}
			{addressToken}
			description={addressToken?.symbol === "oBTC" ? $i18n.receive.bitcoin.text.from_network_oBTC : undefined}
			network={addressToken?.symbol === "oBTC" ? BTC_MAINNET_NETWORK : network}
			{copyAriaLabel}
			qrCodeAction={{ enabled: false }}
		/>

		<slot name="content" />

		<ButtonDone on:click={modalStore.close} slot="toolbar" />
	</ContentWithToolbar>
</Modal>
