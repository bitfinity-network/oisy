<script lang="ts">
	import { nonNullish } from '@dfinity/utils';
	import ConvertAmountDisplay from '$lib/components/convert/ConvertAmountDisplay.svelte';
	import { formatTokenBigintToNumber } from '$lib/utils/format.utils';

	export let feeAmount: bigint | undefined = undefined;
	export let symbol: string;
	export let decimals: number;
	export let exchangeRate: number | undefined = undefined;
	export let zeroAmountLabel: string | undefined = undefined;

	let formattedFeeAmount: number | undefined;
	$: formattedFeeAmount = nonNullish(feeAmount)
		? formatTokenBigintToNumber({
				value: feeAmount,
				unitName: decimals,
				displayDecimals: decimals
			})
		: undefined;
</script>

<ConvertAmountDisplay amount={formattedFeeAmount} {exchangeRate} {symbol} {zeroAmountLabel}
	><slot slot="label" name="label" />
</ConvertAmountDisplay>
