import { PROD, DISABLED_ANALYTICS } from '$lib/constants/app.constants';
import { isNullish } from '@dfinity/utils';
import { initOrbiter, trackEvent as trackEventOrbiter } from '@junobuild/analytics';

export const initAnalytics = async () => {
	if (!PROD || DISABLED_ANALYTICS) {
		return;
	}

	const SATELLITE_ID = import.meta.env.VITE_JUNO_SATELLITE_ID;
	const ORBITER_ID = import.meta.env.VITE_JUNO_ORBITER_ID;

	if (isNullish(SATELLITE_ID) || isNullish(ORBITER_ID)) {
		return;
	}

	try {
		await initOrbiter({
			satelliteId: SATELLITE_ID,
			orbiterId: ORBITER_ID,
			options: {
				performance: false
			},
			worker: {
				path: '/workers/analytics.worker.js'
			}
		});
	} catch (err) {
		console.warn('Analytics initialization failed:', err);
	}
};

export const trackEvent = async ({
	name,
	metadata
}: {
	name: string;
	metadata?: Record<string, string>;
}) => {
	if (!PROD) {
		return;
	}

	await trackEventOrbiter({
		name,
		metadata
	});
};
