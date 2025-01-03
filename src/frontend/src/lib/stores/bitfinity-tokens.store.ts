import { BITFINITY_TOKENS } from '$env/omnity-tokens.erc20.env';
import type { RequiredTokenWithLinkedData } from '$lib/types/token';
import { writable, type Readable } from 'svelte/store';

export type BitfinityTokensData = RequiredTokenWithLinkedData[] | undefined;

export interface BitfinityTokensStore extends Readable<BitfinityTokensData> {
	set: (tokens: BitfinityTokensData) => void;
	add: (token: RequiredTokenWithLinkedData) => void;
	remove: (symbol: string) => void;
	reset: () => void;
}

const STORAGE_KEY = 'bitfinity-tokens';

const loadFromStorage = (): BitfinityTokensData => {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const storedTokens = JSON.parse(stored);
			// Create a map of stored token states for faster lookup
			const storedTokenMap = new Map(
				storedTokens.map((t: { symbol: string; enabled: boolean }) => [
					t.symbol.toLowerCase(),
					!!t.enabled
				])
			);

			// Merge stored enabled states with default tokens
			return BITFINITY_TOKENS.map((token) => {
				const storedEnabled = storedTokenMap.get(token.symbol.toLowerCase());
				return {
					...token,
					enabled: typeof storedEnabled === 'boolean' ? storedEnabled : false
				};
			});
		}
	} catch (err) {
		console.error('Error loading Bitfinity tokens from storage:', err);
	}
	return BITFINITY_TOKENS.map((token) => ({ ...token, enabled: false }));
};

const saveToStorage = (tokens: BitfinityTokensData) => {
	try {
		if (tokens) {
			// Store both symbol and enabled state
			const tokenStates = tokens.map(({ symbol, enabled }) => ({
				symbol,
				enabled: !!enabled
			}));
			localStorage.setItem(STORAGE_KEY, JSON.stringify(tokenStates));
		}
	} catch (err) {
		console.error('Error saving Bitfinity tokens to storage:', err);
	}
};

const initBitfinityTokensStore = (): BitfinityTokensStore => {
	const { subscribe, set, update } = writable<BitfinityTokensData>(loadFromStorage());

	return {
		set: (tokens: BitfinityTokensData) => {
			if (tokens) {
				const processedTokens = tokens.map((token) => ({
					...token,
					enabled: !!token.enabled
				}));
				set(processedTokens);
				saveToStorage(processedTokens);
			}
		},
		add: (token: RequiredTokenWithLinkedData) =>
			update((state) => {
				const newState = [
					...(state ?? []).filter((t) => t.symbol.toLowerCase() !== token.symbol.toLowerCase()),
					{ ...token, enabled: true }
				];
				saveToStorage(newState);
				return newState;
			}),
		remove: (symbol: string) =>
			update((state) => {
				const newState = [
					...(state ?? []).filter((t) => t.symbol.toLowerCase() !== symbol.toLowerCase())
				];
				saveToStorage(newState);
				return newState;
			}),
		reset: () => {
			const initial = BITFINITY_TOKENS.map((token) => ({ ...token, enabled: false }));
			set(initial);
			saveToStorage(initial);
		},
		subscribe
	};
};

export const bitfinityTokensStore = initBitfinityTokensStore();
