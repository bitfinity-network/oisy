<script lang="ts">
	import { nonNullish } from '@dfinity/utils';
	import { getContext } from 'svelte';
	import TokenExchangeBalance from '$lib/components/tokens/TokenExchangeBalance.svelte';
	import Amount from '$lib/components/ui/Amount.svelte';
	import { HERO_CONTEXT_KEY, type HeroContext } from '$lib/stores/hero.store';
	import { i18n } from '$lib/stores/i18n.store';
	import type { OptionTokenUi } from '$lib/types/token';

	export let token: OptionTokenUi;

	const { loading } = getContext<HeroContext>(HERO_CONTEXT_KEY);
</script>

<span class="flex flex-col gap-2">
	<output
		class="inline-flex w-full flex-row justify-center gap-3 break-words text-4xl font-bold lg:text-5xl"
	>
		{#if nonNullish(token?.balance) && nonNullish(token?.symbol) && !token.balance.isZero()}
			<span><Amount amount={token.balance} decimals={token.decimals} /> {token.symbol}</span>
		{:else}
			<span class:animate-pulse={$loading}>0.00</span>
		{/if}
	</output>

	<span class="text-xl font-bold opacity-50">
		<TokenExchangeBalance
			balance={token?.balance}
			usdBalance={token?.usdBalance}
			nullishBalanceMessage={$i18n.hero.text.unavailable_balance}
		/>
	</span>
</span>
