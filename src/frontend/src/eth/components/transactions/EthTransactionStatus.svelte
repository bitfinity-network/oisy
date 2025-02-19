<script lang="ts">
	import { debounce, isNullish, nonNullish } from '@dfinity/utils';
	import { onDestroy, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { infuraProviders } from '$eth/providers/infura.providers';
	import { jsonRpcProviders } from '$eth/providers/jsonrpc.provider';
	import { BITFINITY_NETWORK_ID } from '$env/networks.env';
	import { initMinedTransactionsListener } from '$eth/services/eth-listener.services';
	import type { WebSocketListener } from '$eth/types/listener';
	import { tokenWithFallback } from '$lib/derived/token.derived';
	import { i18n } from '$lib/stores/i18n.store';
	import { toastsError } from '$lib/stores/toasts.store';

	export let blockNumber: number;

	let listener: WebSocketListener | undefined = undefined;

	let currentBlockNumber: number | undefined;

	const loadCurrentBlockNumber = async () => {
		try {
			const networkId = $tokenWithFallback.network.id;
			const provider = networkId === BITFINITY_NETWORK_ID 
				? jsonRpcProviders(networkId) 
				: infuraProviders(networkId);
			currentBlockNumber = await provider.getBlockNumber();
		} catch (err: unknown) {
			disconnect();
			currentBlockNumber = undefined;

			toastsError({
				msg: { text: $i18n.transaction.error.get_block_number },
				err
			});
		}
	};

	const disconnect = () => {
		listener?.disconnect();
		listener = undefined;
	};

	const debounceLoadCurrentBlockNumber = debounce(loadCurrentBlockNumber);

	onMount(async () => {
		await loadCurrentBlockNumber();

		const networkId = $tokenWithFallback.network.id;
		if (networkId !== BITFINITY_NETWORK_ID) {
			listener = initMinedTransactionsListener({
				// eslint-disable-next-line require-await
				callback: async () => debounceLoadCurrentBlockNumber(),
				networkId
			});
		} else {
			// For Bitfinity, we'll poll for block number updates
			const interval = setInterval(debounceLoadCurrentBlockNumber, 5000); // Poll every 5 seconds
			listener = {
				disconnect: async () => {
					clearInterval(interval);
					return Promise.resolve();
				}
			};
		}
	});

	onDestroy(disconnect);

	let status: 'included' | 'safe' | 'finalised' | undefined;

	$: (() => {
		if (isNullish(currentBlockNumber)) {
			status = undefined;
			return;
		}

		const diff = currentBlockNumber - blockNumber;

		if (diff < 32) {
			status = 'included';
			return;
		}

		if (diff < 64) {
			status = 'safe';
			return;
		}

		status = 'finalised';

		disconnect();
	})();
</script>

<label for="to" class="px-4.5 font-bold">{$i18n.transaction.text.status}:</label>

<p id="to" class="px-4.5 mb-4 break-all font-normal first-letter:capitalize">
	{#if nonNullish(status)}
		<span in:fade>{$i18n.transaction.status[status]}</span>
	{:else}
		<span style="visibility: hidden; opacity: 0">&nbsp;</span>
	{/if}
</p>
