<script lang="ts">
	import { nonNullish } from '@dfinity/utils';
	import { getContext, setContext } from 'svelte';
	import ButtonHero from '$lib/components/hero/ButtonHero.svelte';
	import { ethAddressNotLoaded } from '$lib/derived/address.derived';
	import { isBusy } from '$lib/derived/busy.derived';
	import { tokenWithFallback } from '$lib/derived/token.derived';
	import { modalConvertToTwinToken } from '$lib/derived/modal.derived';
	import { waitWalletReady } from '$lib/services/actions.services';
	import { HERO_CONTEXT_KEY, type HeroContext } from '$lib/stores/hero.store';
	import { modalStore } from '$lib/stores/modal.store';
	import type { TokenUi } from '$lib/types/token';
	import BTFSendTokenModal from './BTFSendTokenModal.svelte';
	import { BITFINITY_NETWORK, BITFINITY_NETWORK_ID } from '$env/networks.env';
	import { initSendContext, SEND_CONTEXT_KEY, type SendContext } from '$lib/stores/send.store';

	export let ariaLabel: string;

	const { outflowActionsDisabled } = getContext<HeroContext>(HERO_CONTEXT_KEY);

	$: token = $tokenWithFallback as TokenUi;
	$: isBitfinityTwinToken = nonNullish(token) && token.twinTokenSymbol?.startsWith('o');

	/**
	 * Send context store
	 */
	$: if (token) {
		const context = initSendContext({
			sendPurpose: 'convert-to-twin-token',
			token
		});
		setContext<SendContext>(SEND_CONTEXT_KEY, context);
	}

	const isDisabled = (): boolean => {
		return $ethAddressNotLoaded;
	};

	const openSend = async () => {
		if (isDisabled()) {
			const status = await waitWalletReady(isDisabled);

			if (status === 'timeout') {
				return;
			}
		}

		modalStore.openConvertToTwinToken();
	};
	/*isDisabled() || $isBusy || $outflowActionsDisabled*/
</script>

<ButtonHero on:click={async () => openSend()} disabled={false} {ariaLabel}>
	<slot name="icon" slot="icon" />
	<slot />
</ButtonHero>

{#if $modalConvertToTwinToken}
	<BTFSendTokenModal
		{isBitfinityTwinToken}
		destination={isBitfinityTwinToken
			? token.network.id.toString()
			: BITFINITY_NETWORK.id.toString()}
		targetNetwork={isBitfinityTwinToken ? BITFINITY_NETWORK : token.network}
	/>
{/if}
