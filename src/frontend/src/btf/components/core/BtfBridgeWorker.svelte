<script lang="ts" context="module">
	declare global {
		interface WindowEventMap {
			btfBridgeStart: CustomEvent<{ targetAddress: string }>;
		}
	}
</script>

<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { initBtfBridgeWorker } from '../../bridge/btf-bridge.worker';
	import type { WalletWorker } from '$lib/types/listener';
	import { toastsError } from '$lib/stores/toasts.store';

	let worker: WalletWorker | undefined;

	// Get the target address from local storage if it exists
	const storedTargetAddress = localStorage.getItem('btf_bridge_target_address');

	// Listen for bridge start events
	const startBridge = async (event: Event) => {
		const customEvent = event as CustomEvent<{ targetAddress: string }>;
		// Stop existing worker if any
		worker?.stop();

		try {
			// Store target address for persistence
			localStorage.setItem('btf_bridge_target_address', customEvent.detail.targetAddress);

			// Initialize and start new worker
			worker = await initBtfBridgeWorker({
				targetAddress: customEvent.detail.targetAddress
			});
			worker.start();
		} catch (error) {
			console.error('Failed to start BTF bridge:', error);
			toastsError({
				msg: { text: 'Failed to start BTF bridge' },
				err: error
			});
		}
	};

	onMount(async () => {
		console.log('BTF bridge worker mounted', storedTargetAddress); // You should see the address here when the application loads.
		if (storedTargetAddress) {
			try {
				worker = await initBtfBridgeWorker({
					targetAddress: storedTargetAddress
				});
				worker.start();
			} catch (error) {
				console.error('Failed to initialize BTF bridge worker:', error);
				toastsError({
					msg: { text: 'Failed to initialize BTF bridge worker' },
					err: error
				});
			}
		}

		// Add event listener
		window.addEventListener('btfBridgeStart', startBridge);
	});

	onDestroy(() => {
		worker?.stop();
		worker = undefined;

		// Remove event listener
		window.removeEventListener('btfBridgeStart', startBridge);
	});
</script>

<slot />
