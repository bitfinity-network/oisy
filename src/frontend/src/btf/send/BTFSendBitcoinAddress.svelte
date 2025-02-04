<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { onMount } from 'svelte';
	import ReceiveAddress from '$lib/components/receive/ReceiveAddress.svelte';
	import { BTC_MAINNET_NETWORK } from '$env/networks.env';
	import { i18n } from '$lib/stores/i18n.store';
	import ButtonDone from '$lib/components/ui/ButtonDone.svelte';
	import { BitfinityBtcBridge } from '../bridge/BitfinityBtcBridge';
	import { authIdentity } from '$lib/derived/auth.derived';
	import { writable } from 'svelte/store';
	import { toastsError } from '$lib/stores/toasts.store';
	import SkeletonText from '$lib/components/ui/SkeletonText.svelte';
	import { ethAddress } from '$lib/derived/address.derived';
	import { emit } from '$lib/utils/events.utils';

	const dispatch = createEventDispatcher();
	const close = () => {
		if (!$ethAddress) {
			toastsError({
				msg: { text: 'No ETH address available for bridging' }
			});
			return;
		}

		// Emit event to start the bridge worker
		emit({
			message: 'btfBridgeStart',
			detail: { targetAddress: $ethAddress }
		});

		dispatch('icClose');
	};

	const btcAddress = writable<string>('');
	const isLoading = writable(true);

	const getBtcAddress = async () => {
		if (!$authIdentity) {
			toastsError({
				msg: { text: 'No identity available' }
			});
			return;
		}

		isLoading.set(true);
		try {
			const btcBridge = new BitfinityBtcBridge($authIdentity);
			const address = await btcBridge.getBtcAddress();
			btcAddress.set(address);
		} catch (error) {
			toastsError({
				msg: { text: 'Failed to get BTC address' },
				err: error
			});
		} finally {
			isLoading.set(false);
		}
	};

	onMount(() => {
		getBtcAddress();
	});
</script>

<div class="flex flex-col gap-4 p-4">
	<h2 class="text-lg font-bold">{$i18n.receive.bitcoin.text.bitcoin_address}</h2>
	<p class="text-sm text-misty-rose">
		Transfer Bitcoin on the BTC network to this address to receive oBTC.
	</p>

	{#if $isLoading}
		<div class="rounded-lg bg-brand-subtle p-4">
			<div class="flex items-center gap-4">
				<div class="h-8 w-8 animate-pulse rounded-full bg-grey"></div>
				<div class="flex-1">
					<SkeletonText />
				</div>
			</div>
		</div>
	{:else}
		<ReceiveAddress
			labelRef="btcAddressMainnet"
			address={$btcAddress}
			network={BTC_MAINNET_NETWORK}
			qrCodeAction={{
				enabled: true,
				ariaLabel: $i18n.receive.bitcoin.text.display_bitcoin_address_qr
			}}
			copyAriaLabel={$i18n.receive.bitcoin.text.bitcoin_address_copied}
		>
			<svelte:fragment slot="title">{$i18n.receive.bitcoin.text.bitcoin_address}</svelte:fragment>
		</ReceiveAddress>
	{/if}

	<div class="mt-4 flex justify-end">
		<ButtonDone on:click={close} />
	</div>
</div>
