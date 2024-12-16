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

		// Update BITFINITY_TOKENS with the new enabled states
		BITFINITY_TOKENS.forEach((token) => {
			const matchingToken = updatedTokens.find((t) => t.symbol === token.symbol);
			if (matchingToken) {
				token.enabled = matchingToken.enabled === true;
			}
		});

		// Add a small delay to ensure UI updates are visible
		await new Promise((resolve) => setTimeout(resolve, 500));

		progress(ProgressStepsAddToken.UPDATE_UI);

		// Add a small delay to ensure UI updates are visible
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
