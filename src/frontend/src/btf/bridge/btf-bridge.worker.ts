import { BtfBridgeScheduler } from './btf-bridge.scheduler';
import type { WalletWorker } from '$lib/types/listener';
import { authIdentity } from '$lib/derived/auth.derived';
import { get } from 'svelte/store';

export const initBtfBridgeWorker = async ({
	targetAddress
}: {
	targetAddress: string;
}): Promise<WalletWorker> => {
	const identity = await Promise.resolve(get(authIdentity));
	if (!identity) {
		throw new Error('No identity available for BTF bridge worker');
	}

	const scheduler = new BtfBridgeScheduler();

	return {
		start: async () => await scheduler.start({ targetAddress }),
		stop: () => scheduler.stop(),
		trigger: async () => await scheduler.trigger({ targetAddress })
	};
}; 