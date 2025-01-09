<script lang="ts">
	import { nonNullish } from '@dfinity/utils';
	import ButtonHero from '$lib/components/hero/ButtonHero.svelte';
	import IconCkConvert from '$lib/components/icons/IconCkConvert.svelte';
	import { tokenWithFallback } from '$lib/derived/token.derived';
	import { i18n } from '$lib/stores/i18n.store';
	import { modalStore } from '$lib/stores/modal.store';
	import { isRequiredTokenWithLinkedData } from '$lib/utils/token.utils';
	import type { RequiredTokenWithLinkedData } from '$lib/types/token';

	const handleClick = () => {
		modalStore.openConvertToTwinTokenOckEth();
	};

	$: token = isRequiredTokenWithLinkedData($tokenWithFallback)
		? ($tokenWithFallback as RequiredTokenWithLinkedData)
		: undefined;
	$: isBitfinityToken = nonNullish(token) && token.symbol.startsWith('o');
	$: targetSymbol = nonNullish(token)
		? isBitfinityToken
			? token.symbol.slice(1)
			: `o${token.symbol}`
		: '';
</script>

<ButtonHero
	on:click={handleClick}
	ariaLabel={isBitfinityToken ? `Bridge to ${targetSymbol}` : `Bridge to ${targetSymbol}`}
>
	<IconCkConvert size="28" slot="icon" />
	<span>{targetSymbol}</span>
</ButtonHero>
