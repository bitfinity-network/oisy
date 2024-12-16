import { BITFINITY_TOKENS } from '$env/tokens.bitfinity.env';
import { ProgressStepsAddToken } from '$lib/enums/progress-steps';
import { i18n } from '$lib/stores/i18n.store';
import { toastsError } from '$lib/stores/toasts.store';
import type { RequiredTokenWithLinkedData } from '$lib/types/token';
import type { TokenToggleable } from '$lib/types/token-toggleable';
import { get } from 'svelte/store';

export type SaveBitfinityToken = TokenToggleable<RequiredTokenWithLinkedData>;

export interface SaveBitfinityTokensParams {
	progress: (step: ProgressStepsAddToken) => void;
	tokens: SaveBitfinityToken[];
	modalNext: () => void;
	onSuccess: () => void;
	onError: () => void;
}

// Create a temporary array to hold original tokens
const originalTokens = [...BITFINITY_TOKENS];

// Local storage key for persisting token states
const STORAGE_KEY = 'bitfinity-token-states';

// Load persisted states on initialization
const loadPersistedStates = () => {
	const savedStates = localStorage.getItem(STORAGE_KEY);
	if (savedStates) {
		const states = JSON.parse(savedStates);
		BITFINITY_TOKENS.forEach((token) => {
			if (states[token.symbol] !== undefined) {
				token.enabled = states[token.symbol];
			}
		});
	}
};

// Initialize with persisted states
loadPersistedStates();

export const saveBitfinityTokens = async ({
	progress,
	tokens: updatedTokens,
	modalNext,
	onSuccess,
	onError
}: SaveBitfinityTokensParams): Promise<void> => {
	try {
		progress(ProgressStepsAddToken.INITIALIZATION);
		progress(ProgressStepsAddToken.SAVE);

		// Clear and update BITFINITY_TOKENS to force reactivity
		BITFINITY_TOKENS.length = 0;
		await new Promise((resolve) => setTimeout(resolve, 0));

		// Update tokens with new enabled states
		const newTokens = originalTokens.map((token) => {
			const updatedToken = updatedTokens.find((t) => t.symbol === token.symbol);
			return updatedToken ? { ...token, enabled: updatedToken.enabled } : token;
		});

		BITFINITY_TOKENS.push(...newTokens);

		// Persist token states
		const states = newTokens.reduce(
			(acc, token) => ({
				...acc,
				[token.symbol]: token.enabled
			}),
			{}
		);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(states));

		await new Promise((resolve) => setTimeout(resolve, 500));
		progress(ProgressStepsAddToken.UPDATE_UI);
		await new Promise((resolve) => setTimeout(resolve, 500));
		progress(ProgressStepsAddToken.DONE);

		modalNext();
		onSuccess();
	} catch (err: unknown) {
		toastsError({
			msg: { text: get(i18n).tokens.error.unexpected },
			err
		});
		onError();
		throw err;
	}
};
