<script lang="ts">
	import { fade } from 'svelte/transition';
	import { i18n } from '$lib/stores/i18n.store';
	import type { TransactionStatus } from '$lib/types/transaction';

	export let status: TransactionStatus;

	let pending: boolean;
	$: pending = status === 'pending';

	let unconfirmed: boolean;
	$: unconfirmed = status === 'unconfirmed';
</script>

{#if pending || unconfirmed}
	<span class="ml-2 text-goldenrod" in:fade>
		{pending ? $i18n.transaction.text.pending : $i18n.transaction.text.unconfirmed}
	</span>
{/if}
