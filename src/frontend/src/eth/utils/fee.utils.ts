import { ZERO } from '$lib/constants/app.constants';
import type { TransactionFeeData } from '$lib/types/transaction';
import { isNullish } from '@dfinity/utils';
import { BigNumber } from '@ethersproject/bignumber';

export const maxGasFee = ({
	maxFeePerGas,
	gas: estimatedGasFee,
	standard
}: TransactionFeeData & { standard?: string }): BigNumber | undefined => {
	if (isNullish(maxFeePerGas)) {
		return undefined;
	}
	
	// For ICRC tokens, use maxFeePerGas directly without multiplication
	if (standard === 'icrc') {
		return maxFeePerGas;
	}
	
	// For other tokens, multiply maxFeePerGas by gas
	return maxFeePerGas.mul(estimatedGasFee);
};

export const minGasFee = ({
	maxPriorityFeePerGas,
	gas: estimatedGasFee
}: TransactionFeeData): BigNumber => (maxPriorityFeePerGas ?? ZERO).mul(estimatedGasFee);
