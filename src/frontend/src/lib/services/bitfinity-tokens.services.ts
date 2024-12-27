import { BITFINITY_TOKENS } from '$env/omnity-tokens.erc20.env';
import { bitfinityTokensStore } from '$lib/derived/tokens.derived';
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

// Local storage key for persisting token states
const STORAGE_KEY = 'bitfinity-token-states';

// Load persisted states on initialization
const loadPersistedStates = () => {
	const savedStates = localStorage.getItem(STORAGE_KEY);
	if (savedStates) {
		const states = JSON.parse(savedStates);
		const updatedTokens = BITFINITY_TOKENS.map((token) => ({
			...token,
			enabled: states[token.symbol] ?? false
		}));
		bitfinityTokensStore.set(updatedTokens);
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

		// Get existing states
		const savedStates = localStorage.getItem(STORAGE_KEY);
		const existingStates = savedStates ? JSON.parse(savedStates) : {};

		// Update only the modified tokens while preserving others
		const newStates = {
			...existingStates,
			...updatedTokens.reduce(
				(acc, token) => ({
					...acc,
					[token.symbol]: token.enabled
				}),
				{}
			)
		};

		// Save updated states
		localStorage.setItem(STORAGE_KEY, JSON.stringify(newStates));

		// Update store with new states
		const currentTokens = get(bitfinityTokensStore);
		const updatedBitfinityTokens = currentTokens.map((token) => ({
			...token,
			enabled: newStates[token.symbol] ?? false
		}));
		bitfinityTokensStore.set(updatedBitfinityTokens);

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
