<script lang="ts">
	import { fade } from 'svelte/transition';
	import { BtcPendingSentTransactionsStatus } from '$btc/derived/btc-pending-sent-transactions-status.derived';
	import type { UtxosFee } from '$btc/types/btc-send';
	import WarningBanner from '$lib/components/ui/WarningBanner.svelte';
	import { i18n } from '$lib/stores/i18n.store';

	export let pendingTransactionsStatus: BtcPendingSentTransactionsStatus;
	export let utxosFee: UtxosFee | undefined = undefined;
</script>

{#if pendingTransactionsStatus === BtcPendingSentTransactionsStatus.SOME}
	<div in:fade>
		<WarningBanner>{$i18n.send.info.pending_bitcoin_transaction}</WarningBanner>
	</div>
{:else if pendingTransactionsStatus === BtcPendingSentTransactionsStatus.ERROR}
	<div in:fade>
		<WarningBanner>{$i18n.send.error.no_pending_bitcoin_transaction}</WarningBanner>
	</div>
{/if}

{#if utxosFee?.utxos.length === 0}
	<div in:fade>
		<WarningBanner>{$i18n.send.info.no_available_utxos}</WarningBanner>
	</div>
{/if}
