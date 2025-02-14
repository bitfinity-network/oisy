<script lang="ts">
	import ReceiveAddress from '$lib/components/receive/ReceiveAddress.svelte';
	import ReceiveQRCode from '$lib/components/receive/ReceiveQRCode.svelte';
	import { i18n } from '$lib/stores/i18n.store';
	import type { Address, OptionAddress } from '$lib/types/address';
	import type { Network } from '$lib/types/network';
	import type { ReceiveQRCodeAction } from '$lib/types/receive';
	import type { Token } from '$lib/types/token';

	export let address: OptionAddress<Address>;
	export let addressLabel: string | undefined = undefined;
	export let addressToken: Token | undefined;
	export let description: string | undefined = undefined;

	export let testId: string | undefined = undefined;
	export let copyButtonTestId: string | undefined = undefined;

	export let network: Network;
	export let qrCodeAction: ReceiveQRCodeAction;
	export let copyAriaLabel: string;

	export let title: string = $i18n.wallet.text.address;

	// TODO: replace properties (address, labels etc.) with a mandatory property of type ReceiveQRCode
</script>

{#if addressToken?.symbol !== "oBTC"}
	<ReceiveQRCode address={address ?? ''} {addressToken} />
{/if}

<ReceiveAddress
	labelRef="address"
	description={description}
	address={address ?? ''}
	{testId}
	{network}
	{qrCodeAction}
	{copyAriaLabel}
	{copyButtonTestId}
>
	<svelte:fragment slot="title">
		{addressLabel || title}
	</svelte:fragment>
</ReceiveAddress>
