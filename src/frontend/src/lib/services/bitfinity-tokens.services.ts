import { BITFINITY_TOKENS, type BitfinityToken } from '$env/omnity-tokens.erc20.env';
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

const STORAGE_KEY = 'bitfinity-tokens';

const initBitfinityTokensStore = () => {
	const storedValue =
		typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
	const storedTokenMap = new Map<string, boolean>();

	if (storedValue) {
		try {
			const storedTokens = JSON.parse(storedValue);
			storedTokens.forEach((t: { symbol: string; enabled: boolean }) => {
				storedTokenMap.set(t.symbol.toLowerCase(), !!t.enabled);
			});
		} catch (err) {
			console.error('Error loading Bitfinity tokens from storage:', err);
		}
	}

	const { subscribe, set, update } = writable(
		BITFINITY_TOKENS.map((token) => ({
			...token,
			enabled: storedTokenMap.get(token.symbol.toLowerCase()) ?? token.enabled ?? false
		}))
	);

	return {
		subscribe,
		set: (tokens: BitfinityToken[]) => {
			set(tokens);
			try {
				localStorage.setItem(
					STORAGE_KEY,
					JSON.stringify(tokens.map(({ symbol, enabled }) => ({ symbol, enabled })))
				);
			} catch (err) {
				console.error('Error saving Bitfinity tokens to storage:', err);
			}
		},
		update
	};
};

export const bitfinityTokensStore = initBitfinityTokensStore();

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

		const currentTokens = get(bitfinityTokensStore);
		const newTokens = currentTokens.map((token) => {
			const updatedToken = updatedTokens.find((t) => t.symbol === token.symbol);
			return updatedToken ? { ...token, enabled: updatedToken.enabled } : token;
		});

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
