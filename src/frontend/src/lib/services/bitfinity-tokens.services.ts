import { BITFINITY_TOKENS } from '$env/omnity-tokens.erc20.env';
import { ProgressStepsAddToken } from '$lib/enums/progress-steps';
import { i18n } from '$lib/stores/i18n.store';
import { toastsError } from '$lib/stores/toasts.store';
import type { RequiredTokenWithLinkedData } from '$lib/types/token';
import type { TokenToggleable } from '$lib/types/token-toggleable';
import { get, writable } from 'svelte/store';

export type SaveBitfinityToken = TokenToggleable<RequiredTokenWithLinkedData>;

export interface SaveBitfinityTokensParams {
	progress: (step: ProgressStepsAddToken) => void;
	tokens: SaveBitfinityToken[];
	modalNext: () => void;
	onSuccess: () => void;
	onError: () => void;
}

// Create a writable store for Bitfinity tokens with localStorage persistence
const STORAGE_KEY = 'bitfinity-tokens';

const loadFromStorage = () => {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		// Create a map of stored enabled states
		const storedTokenMap = new Map<string, boolean>();
		let hasStoredState = false;

		if (stored) {
			const storedTokens = JSON.parse(stored);
			storedTokens.forEach((t: { symbol: string; enabled: boolean }) => {
				storedTokenMap.set(t.symbol.toLowerCase(), !!t.enabled);
				hasStoredState = true;
			});
		}

		// If we have stored state, use it. Otherwise, use the default enabled state from BITFINITY_TOKENS
		return BITFINITY_TOKENS.map((token) => ({
			...token,
			enabled: hasStoredState
				? (storedTokenMap.get(token.symbol.toLowerCase()) ?? false)
				: (token.enabled ?? false)
		}));
	} catch (err) {
		console.error('Error loading Bitfinity tokens from storage:', err);
		// On error, use the default enabled state from BITFINITY_TOKENS
		return BITFINITY_TOKENS.map((token) => ({ ...token, enabled: token.enabled ?? false }));
	}
};

const saveToStorage = (tokens: typeof BITFINITY_TOKENS) => {
	try {
		const tokenStates = tokens.map(({ symbol, enabled }) => ({
			symbol,
			enabled: !!enabled
		}));
		localStorage.setItem(STORAGE_KEY, JSON.stringify(tokenStates));
	} catch (err) {
		console.error('Error saving Bitfinity tokens to storage:', err);
	}
};

const createBitfinityStore = () => {
	const { subscribe, set, update } = writable(loadFromStorage());

	return {
		subscribe,
		set: (tokens: typeof BITFINITY_TOKENS) => {
			set(tokens);
			saveToStorage(tokens);
		},
		update: (updater: (tokens: typeof BITFINITY_TOKENS) => typeof BITFINITY_TOKENS) => {
			update((tokens) => {
				const newTokens = updater(tokens);
				saveToStorage(newTokens);
				return newTokens;
			});
		}
	};
};

export const bitfinityTokensStore = createBitfinityStore();

// Initialize store with default tokens while preserving any existing enabled states
const currentTokens = get(bitfinityTokensStore);
const initialTokens = BITFINITY_TOKENS.map((token) => {
	const existingToken = currentTokens.find((t) => t.symbol === token.symbol);
	return {
		...token,
		enabled: existingToken?.enabled ?? false
	};
});
bitfinityTokensStore.set(initialTokens);

export const saveBitfinityTokens = async ({
	progress,
	tokens: updatedTokens,
	modalNext,
	onSuccess,
	onError
}: SaveBitfinityTokensParams): Promise<void> => {
	try {
		await progress(ProgressStepsAddToken.INITIALIZATION);
		await progress(ProgressStepsAddToken.SAVE);

		// Get current tokens from store
		const currentTokens = get(bitfinityTokensStore);

		// Update tokens with new enabled states
		const newTokens = currentTokens.map((token) => {
			const updatedToken = updatedTokens.find((t) => t.symbol === token.symbol);
			return updatedToken ? { ...token, enabled: updatedToken.enabled } : token;
		});

		// Update store
		bitfinityTokensStore.set(newTokens);

		progress(ProgressStepsAddToken.DONE);

		onSuccess();
	} catch (err: unknown) {
		toastsError({
			msg: { text: get(i18n).tokens.error.unexpected },
			err
		});

		onError();
	}
};
