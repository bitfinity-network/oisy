<script lang="ts">
	import { nonNullish } from '@dfinity/utils';
	import CardAmount from '$lib/components/ui/CardAmount.svelte';
	import CardAmountDescription from '$lib/components/ui/CardAmountDescription.svelte';

	export let noMargin = false;
	export let testId: string | undefined = undefined;

	let description = false;
	$: description = nonNullish($$slots.description);

	let amount = true;
	$: amount = nonNullish($$slots.amount);

	let amountDescription = true;
	$: amountDescription = nonNullish($$slots.amountDescription);

	let action = true;
	$: action = nonNullish($$slots.action);
</script>

<div class="flex items-center gap-4" class:mb-6={!noMargin} data-tid={testId}>
	<slot name="icon" />

	<div class="flex flex-1 flex-col justify-center">
		<div class="flex gap-1 font-bold leading-5" class:items-center={!description}>
			<span
				class="clamp-4 inline-flex items-center text-left"
				style={amount ? 'max-width: 60%' : undefined}><slot /></span
			>

			{#if amount}
				<CardAmount><slot name="amount" /></CardAmount>
			{/if}
		</div>
		<div class="flex gap-1 text-misty-rose" class:items-center={!description}>
			<span class="inline-flex items-center text-left">
				<slot name="description" />
			</span>

			{#if amountDescription}
				<CardAmountDescription><slot name="amountDescription" /></CardAmountDescription>
			{/if}
		</div>
	</div>
	{#if action}
		<div class="flex min-w-14 flex-shrink">
			<slot name="action" />
		</div>
	{/if}
</div>
