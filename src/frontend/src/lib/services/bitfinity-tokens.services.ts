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

// Initialize store with default tokens
bitfinityTokensStore.set(BITFINITY_TOKENS);

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
