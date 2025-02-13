<script lang="ts">
	import { debounce, nonNullish } from '@dfinity/utils';
	import { BigNumber } from '@ethersproject/bignumber';
	import { fade, slide } from 'svelte/transition';
	import { EIGHT_DECIMALS, ZERO } from '$lib/constants/app.constants';
	import { SLIDE_DURATION } from '$lib/constants/transition.constants';
	import { balancesStore } from '$lib/stores/balances.store';
	import { i18n } from '$lib/stores/i18n.store';
	import type { OptionBalance } from '$lib/types/balance';
	import type { TokenId } from '$lib/types/token';
	import { formatToken } from '$lib/utils/format.utils';
	import { replacePlaceholders } from '$lib/utils/i18n.utils';

	export let fee: BigNumber;
	export let feeSymbol: string;
	export let feeTokenId: TokenId;
	export let feeDecimals: number;

	let balance: Exclude<OptionBalance, null>;
	$: {
		const storeData = $balancesStore?.[feeTokenId]?.data;
		balance = nonNullish(storeData) ? storeData : ZERO;
	}

	let insufficientFeeFunds = false;
	let adjustedFee = fee;

	$: {
		// If it's a Bitfinity token (o-token), adjust the fee from 18 to 8 decimals
		if (feeSymbol.startsWith('o')) {
			adjustedFee = fee.div(BigNumber.from(10).pow(10)); // Convert from 18 to 8 decimals
		} else {
			adjustedFee = fee;
		}
	}

	const debounceCheckFeeFunds = debounce(
		() => (insufficientFeeFunds = nonNullish(balance) && balance.lt(adjustedFee))
	);

	$: balance, adjustedFee, debounceCheckFeeFunds();
</script>

<div transition:fade>
	{formatToken({
		value: adjustedFee,
		unitName: feeDecimals,
		displayDecimals: feeDecimals
	})}
	{feeSymbol.startsWith('o') ? 'BTF' : feeSymbol}
</div>
{#if insufficientFeeFunds && nonNullish(balance)}
	<p in:slide={SLIDE_DURATION} class="text-cyclamen">
		{replacePlaceholders($i18n.send.assertion.not_enough_tokens_for_gas, {
			$balance: formatToken({
				value: balance,
				unitName: feeDecimals,
				displayDecimals: feeDecimals
			}),
			$symbol: feeSymbol.startsWith('o') ? 'BTF' : feeSymbol
		})}
	</p>
{/if}
