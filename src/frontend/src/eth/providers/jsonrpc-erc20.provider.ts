import { BITFINITY_NETWORK_ID } from '$env/networks.env';
import { BITFINITY_JSON_RPC_URL_MAINNET } from '$env/networks.eth.env';
import { ERC20_ABI } from '$eth/constants/erc20.constants';
import type { Erc20Provider } from '$eth/types/contracts-providers';
import type { Erc20ContractAddress, Erc20Metadata } from '$eth/types/erc20';
import { i18n } from '$lib/stores/i18n.store';
import type { EthAddress } from '$lib/types/address';
import type { NetworkId } from '$lib/types/network';
import { replacePlaceholders } from '$lib/utils/i18n.utils';
import { assertNonNullish } from '@dfinity/utils';
import type { BigNumber } from '@ethersproject/bignumber';
import type { PopulatedTransaction } from '@ethersproject/contracts';
import { JsonRpcProvider } from '@ethersproject/providers';
import { ethers } from 'ethers';
import { get } from 'svelte/store';

export class JsonRpcErc20Provider implements Erc20Provider {
	private readonly provider: JsonRpcProvider;

	constructor(private readonly rpcUrl: string) {
		this.provider = new JsonRpcProvider(this.rpcUrl);
	}

	metadata = async ({ address }: Pick<Erc20ContractAddress, 'address'>): Promise<Erc20Metadata> => {
		const erc20Contract = new ethers.Contract(address, ERC20_ABI, this.provider);

		const [name, symbol, decimals] = await Promise.all([
			erc20Contract.name(),
			erc20Contract.symbol(),
			erc20Contract.decimals()
		]);

		return {
			name,
			symbol,
			decimals
		};
	};

	balance = ({
		contract: { address: contractAddress },
		address
	}: {
		contract: Erc20ContractAddress;
		address: EthAddress;
	}): Promise<BigNumber> => {
		const erc20Contract = new ethers.Contract(contractAddress, ERC20_ABI, this.provider);
		return erc20Contract.balanceOf(address);
	};

	getFeeData = ({
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

	populateTransaction = ({
		contract: { address: contractAddress },
		to,
		amount
	}: {
		contract: Erc20ContractAddress;
		to: EthAddress;
		amount: BigNumber;
	}): Promise<PopulatedTransaction> => {
		const erc20Contract = new ethers.Contract(contractAddress, ERC20_ABI, this.provider);
		return erc20Contract.populateTransaction.transfer(to, amount);
	};

	populateApprove = ({
		contract: { address: contractAddress },
		spender,
		amount
	}: {
		contract: Erc20ContractAddress;
		spender: EthAddress;
		amount: BigNumber;
	}): Promise<PopulatedTransaction> => {
		const erc20Contract = new ethers.Contract(contractAddress, ERC20_ABI, this.provider);
		return erc20Contract.populateTransaction.approve(spender, amount);
	};

	allowance = ({
		contract: { address: contractAddress },
		owner,
		spender
	}: {
		contract: Erc20ContractAddress;
		owner: EthAddress;
		spender: EthAddress;
	}): Promise<BigNumber> => {
		const erc20Contract = new ethers.Contract(contractAddress, ERC20_ABI, this.provider);
		return erc20Contract.allowance(owner, spender);
	};
}

/** Define providers for different networks */
const providers: Record<NetworkId, JsonRpcErc20Provider> = {
	[BITFINITY_NETWORK_ID]: new JsonRpcErc20Provider(BITFINITY_JSON_RPC_URL_MAINNET)
};

/** Factory function to get the provider */
export const jsonRpcErc20Providers = (networkId: NetworkId): JsonRpcErc20Provider => {
	const provider = providers[networkId];

	assertNonNullish(
		provider,
		replacePlaceholders(get(i18n).init.error.no_jsonrpc_erc20_provider, {
			$network: networkId.toString()
		})
	);

	return provider;
};
