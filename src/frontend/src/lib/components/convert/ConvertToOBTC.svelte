<script lang="ts">
	import { isNullish } from '@dfinity/utils';
	import { getContext } from 'svelte';
	import { modalConvertToTwinToken } from '$lib/derived/modal.derived';
	import ButtonHero from '$lib/components/hero/ButtonHero.svelte';
	import IconCkConvert from '$lib/components/icons/IconCkConvert.svelte';
	import { isBusy } from '$lib/derived/busy.derived';
	import { HERO_CONTEXT_KEY, type HeroContext } from '$lib/stores/hero.store';
	import { i18n } from '$lib/stores/i18n.store';
	import { modalStore } from '$lib/stores/modal.store';
	import { tokenWithFallback } from '$lib/derived/token.derived';
	import BTFSendTokenModal from '../../../btf/send/BTFSendTokenModal.svelte';
	import { setContext } from 'svelte';
	import { initSendContext, SEND_CONTEXT_KEY } from '$lib/stores/send.store';

	const { outflowActionsDisabled } = getContext<HeroContext>(HERO_CONTEXT_KEY);

	const openConvert = async () => {
		modalStore.openConvertToTwinToken();
	};

	/**
	 * Send modal context store
	 */
	const context = initSendContext({
		sendPurpose: 'convert-to-twin-token',
		token: $tokenWithFallback
	});
	setContext(SEND_CONTEXT_KEY, context);
</script>

<ButtonHero
	disabled={$isBusy || $outflowActionsDisabled}
	on:click={async () => await openConvert()}
	ariaLabel="Convert to oBTC"
>
	<IconCkConvert size="28" slot="icon" />
	<span>oBTC</span>
</ButtonHero>

{#if $modalConvertToTwinToken}
	<BTFSendTokenModal targetNetwork={$tokenWithFallback?.network} />
{/if}
