import { BITFINITY_TOKENS, type BitfinityToken } from '$env/omnity-tokens.erc20.env';
import { writable, type Readable } from 'svelte/store';

export interface BitfinityStore extends Readable<BitfinityToken[]> {
	set: (tokens: BitfinityToken[]) => void;
	add: (token: BitfinityToken) => void;
	remove: (symbol: string) => void;
	reset: () => void;
	updateEnabled: (symbol: string, enabled: boolean) => void;
}

const initBitfinityStore = (): BitfinityStore => {
	const { subscribe, set, update } = writable<BitfinityToken[]>(BITFINITY_TOKENS);

	return {
		subscribe,
		set: (tokens: BitfinityToken[]) => set(tokens),
		add: (token: BitfinityToken) =>
			update((tokens) => [...tokens.filter((t) => t.symbol !== token.symbol), token]),
		remove: (symbol: string) => update((tokens) => tokens.filter((t) => t.symbol !== symbol)),
		reset: () => set(BITFINITY_TOKENS),
		updateEnabled: (symbol: string, enabled: boolean) =>
			update((tokens) =>
				tokens.map((token) => (token.symbol === symbol ? { ...token, enabled } : token))
			)
	};
};

// Store for enabled Bitfinity tokens
export const enabledBitfinityTokens = initBitfinityStore();
