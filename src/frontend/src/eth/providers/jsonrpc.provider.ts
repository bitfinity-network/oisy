import { BITFINITY_NETWORK_ID } from '$env/networks.env';
import { BITFINITY_JSON_RPC_URL_MAINNET } from '$env/networks.eth.env';
import { ERC20_ABI } from '$eth/constants/erc20.constants';
import type { Erc20ContractAddress } from '$eth/types/erc20';
import { i18n } from '$lib/stores/i18n.store';
import type { EthAddress } from '$lib/types/address';
import type { NetworkId } from '$lib/types/network';
import { replacePlaceholders } from '$lib/utils/i18n.utils';
import { assertNonNullish } from '@dfinity/utils';
import type { BigNumber } from '@ethersproject/bignumber';
import type { Networkish } from '@ethersproject/networks';
import {
	JsonRpcProvider as JsonRpcProviderLib,
	type FeeData,
	type TransactionResponse
} from '@ethersproject/providers';
import { ethers } from 'ethers';
import { get } from 'svelte/store';

export class JsonRpcProvider {
	private readonly provider: JsonRpcProviderLib;

	constructor(
		private readonly rpcUrl: string,
		private readonly network?: Networkish
	) {
		this.provider = new JsonRpcProviderLib(this.rpcUrl, this.network);
	}

	balance = (address: EthAddress): Promise<BigNumber> => this.provider.getBalance(address);

	getFeeData = (): Promise<FeeData> => this.provider.getFeeData();

	getFeeContractData = ({
		contract: { address: contractAddress },
		to,
		from,
		amount
	}: {
		contract: Erc20ContractAddress;
		from: EthAddress;
		to: EthAddress;
		amount: BigNumber;
	}): Promise<BigNumber> => {
		const erc20Contract = new ethers.Contract(contractAddress, ERC20_ABI, this.provider);
		return erc20Contract.estimateGas.approve(to, amount, { from });
	};

	sendTransaction = (signedTransaction: string): Promise<TransactionResponse> =>
		this.provider.sendTransaction(signedTransaction);

	getTransactionCount = (address: EthAddress): Promise<number> =>
		this.provider.getTransactionCount(address, 'pending');

	getBlockNumber = (): Promise<number> => this.provider.getBlockNumber();
}

const providers: Record<NetworkId, JsonRpcProvider> = {
	[BITFINITY_NETWORK_ID]: new JsonRpcProvider(BITFINITY_JSON_RPC_URL_MAINNET)
};

export const jsonRpcProviders = (networkId: NetworkId): JsonRpcProvider => {
	const provider = providers[networkId];

	assertNonNullish(
		provider,
		replacePlaceholders(get(i18n).init.error.no_json_rpc_provider, {
			$network: networkId.toString()
		})
	);

	return provider;
};
