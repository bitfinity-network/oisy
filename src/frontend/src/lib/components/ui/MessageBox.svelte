<script lang="ts">
	import { isNullish, nonNullish } from '@dfinity/utils';
	import { slide } from 'svelte/transition';
	import IconClose from '$lib/components/icons/lucide/IconClose.svelte';
	import IconInfo from '$lib/components/icons/lucide/IconInfo.svelte';
	import { SLIDE_EASING } from '$lib/constants/transition.constants';
	import { i18n } from '$lib/stores/i18n.store';
	import { type HideInfoKey, saveHideInfo, shouldHideInfo } from '$lib/utils/info.utils';

	export let level: 'plain' | 'info' | 'light-warning' | 'error' = 'info';
	export let closableKey: HideInfoKey | undefined = undefined;

	let closable = false;
	$: closable = nonNullish(closableKey);

	let visible = true;
	$: visible = isNullish(closableKey) || !shouldHideInfo(closableKey);

	const close = () => {
		visible = false;

		if (isNullish(closableKey)) {
			return;
		}

		saveHideInfo(closableKey);
	};
</script>

{#if visible}
	<div
		class="mb-4 flex items-start gap-4 rounded-xl px-4 py-3 text-sm font-medium sm:text-base"
		class:bg-primary={level === 'plain'}
		class:bg-brand-subtle-alt={level === 'info'}
		class:bg-warning-subtle={level === 'light-warning'}
		class:bg-error-subtle-alt={level === 'error'}
		transition:slide={SLIDE_EASING}
	>
		<div
			class="min-w-5 py-0 sm:py-0.5"
			class:text-brand-primary={level === 'plain' || level === 'info'}
			class:text-warning={level === 'light-warning'}
			class:text-error={level === 'error'}
		>
			<IconInfo />
		</div>
		<div>
			<slot />
		</div>
		{#if closable}
			<button class="p-0.5 text-tertiary" on:click={close} aria-label={$i18n.core.text.close}>
				<IconClose />
			</button>
		{/if}
	</div>
{/if}
