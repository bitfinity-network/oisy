import { WALLET_TIMER_INTERVAL_MILLIS } from '$lib/constants/app.constants';
import { SchedulerTimer, type Scheduler } from '$lib/schedulers/scheduler';
import { i18n } from '$lib/stores/i18n.store';
import { toastsError } from '$lib/stores/toasts.store';
import type { Identity } from '@dfinity/agent';
import { isNullish } from '@dfinity/utils';
import { get } from 'svelte/store';
import { BitfinityBtcBridge } from './BitfinityBtcBridge';

interface BtfBridgeData {
	targetAddress: string;
}

export class BtfBridgeScheduler implements Scheduler<BtfBridgeData> {
	private timer = new SchedulerTimer('syncCkBTCUpdateBalanceStatus');
	private attempts = 0;
	private readonly MAX_ATTEMPTS = 10; // Stop after 10 attempts

	stop() {
		this.timer.stop();
	}

	async start(data: BtfBridgeData | undefined) {
		await this.timer.start<BtfBridgeData>({
			interval: WALLET_TIMER_INTERVAL_MILLIS,
			job: this.syncBridge,
			data
		});
	}

	async trigger(data: BtfBridgeData | undefined) {
		await this.timer.trigger<BtfBridgeData>({
			job: this.syncBridge,
			data
		});
	}

	private syncBridge = async ({ identity, data }: { identity: Identity; data?: BtfBridgeData }) => {
		if (isNullish(data?.targetAddress)) {
			toastsError({
				msg: { text: 'No target address provided for bridging' }
			});
			this.stop();
			return;
		}

		if (this.attempts >= this.MAX_ATTEMPTS) {
			toastsError({
				msg: { text: get(i18n).send.error.unexpected }
			});
			this.stop();
			return;
		}

		try {
			const btcBridge = new BitfinityBtcBridge(identity);

			await btcBridge.bridgeToOBtc({
				targetAddress: data.targetAddress
			});

			// If not finalized, increment attempts counter
			this.attempts++;
		} catch (error) {
			console.error('Bridge error:', error);
			// Don't stop on error, let it try again until MAX_ATTEMPTS is reached
			this.attempts++;
		}
	};
}
