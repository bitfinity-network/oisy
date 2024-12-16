import { ProgressStepsAddToken } from '$lib/enums/progress-steps';
import { i18n } from '$lib/stores/i18n.store';
import { toastsError } from '$lib/stores/toasts.store';
import type { RequiredTokenWithLinkedData } from '$lib/types/token';
import type { TokenToggleable } from '$lib/types/token-toggleable';
import type { Identity } from '@dfinity/agent';
import { get } from 'svelte/store';

export type SaveBitfinityToken = TokenToggleable<RequiredTokenWithLinkedData>;

export interface SaveBitfinityTokensParams {
	progress: (step: ProgressStepsAddToken) => void;
	identity: Identity;
	tokens: SaveBitfinityToken[];
	modalNext: () => void;
	onSuccess: () => void;
	onError: () => void;
}

export const saveBitfinityTokens = async ({
	progress,
	identity,
	tokens,
	modalNext,
	onSuccess,
	onError
}: SaveBitfinityTokensParams): Promise<void> => {
	try {
		progress(ProgressStepsAddToken.SAVE);

		// TODO: Implement actual saving to backend
		// For now, we'll just simulate saving
		await new Promise((resolve) => setTimeout(resolve, 1000));

		progress(ProgressStepsAddToken.UPDATE_UI);

		// TODO: Implement UI update logic
		// For now, we'll just simulate updating
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
