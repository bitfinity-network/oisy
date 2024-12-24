import { BITFINITY_EXPLORER_URL } from '$env/explorers.env';
import { BITFINITY_NETWORK, BITFINITY_NETWORK_ID } from '$env/networks.env';
import { i18n } from '$lib/stores/i18n.store';
import type { EthAddress } from '$lib/types/address';
import type { NetworkId } from '$lib/types/network';
import type { Transaction } from '$lib/types/transaction';
import { replacePlaceholders } from '$lib/utils/i18n.utils';
import { assertNonNullish } from '@dfinity/utils';
import type { BlockTag } from '@ethersproject/abstract-provider';
import { BigNumber } from 'alchemy-sdk';
import { get } from 'svelte/store';

interface TransactionAddressBlockscout {
	ens_domain_name: string | null;
	hash: string;
	implementation_name: string | null;
	is_contract: boolean;
	is_verified: boolean;
	metadata: string;
	name: string | null;
}

interface TransactionParameter {
	name: string;
	type: string;
	value: string;
}

interface DecodedInput {
	method_call: string;
	method_id: string;
	parameters: TransactionParameter[];
}

interface TokenBlockscout {
	address: string;
	circulating_market_cap: string | null;
	decimals: string | null;
	exchange_rate: string | null;
	holders: string;
	icon_url: string;
	name: string;
	symbol: string;
	total_supply: string | null;
	type: string;
	volume_24h: string | null;
}

interface TokenTransferBlockscout {
	block_hash: string;
	from: TransactionAddressBlockscout;
	to: TransactionAddressBlockscout;
	log_index: string;
	method: null;
	timestamp: null;
	token: TokenBlockscout;
	total: { token_id: string; decimals?: string | null; value?: string };
	tx_hash: string;
	type: string;
}

interface Fee {
	type: string;
	value: string;
}

interface TransactionBlockscout {
	base_fee_per_gas: string;
	block: number | null;
	confirmations: number;
	confirmation_duration: number[];
	decoded_input: DecodedInput;
	exchange_rate: string;
	fee: Fee;
	hash: string;
	timestamp: string;
	from: TransactionAddressBlockscout;
	to: TransactionAddressBlockscout | null;
	value: string;
	gas_limit: string;
	gas_price: string;
	gas_used: string;
	method: string;
	token_transfers: null | TokenTransferBlockscout[];
	tx_types: string[];
	status: 'ok' | 'error';
	result: string;
	nonce: number;
	position: number;
	raw_input: string;
}

interface AddressTransactionsBlockscout {
	items: TransactionBlockscout[];
	next_page_params: {
		block_number: number;
		fee: string;
		hash: string;
		index: number;
		inserted_at: string;
		items_count: number;
		value: string;
	};
}

export interface BlockscoutRestTransaction {
	blockHash: string;
	blockNumber: string;
	confirmations: string;
	contractAddress: string;
	cumulativeGasUsed: string;
	from: string;
	gas: string;
	gasPrice: string;
	gasUsed: string;
	hash: string;
	input: string;
	nonce: string;
	timeStamp: string;
	to: string;
	tokenDecimal: string;
	tokenName: string;
	tokenSymbol: string;
	transactionIndex: string;
	value: string;
}

export class BlockscoutProvider {
	constructor(
		private chainId: number,
		private explorerUrl: string
	) {
		this.chainId = chainId;
		this.explorerUrl = explorerUrl;
	}

	transactions = async ({
		address,
		startBlock
	}: {
		address: EthAddress;
		startBlock?: BlockTag;
	}): Promise<Transaction[]> => {
		const query = `${this.explorerUrl}/api/v2/addresses/${address}/transactions`;

		// TODO: remove { mode: 'cors' }
		const response: Response = await fetch(query, { mode: 'cors' });
		const body = (await response.json()) as AddressTransactionsBlockscout;

		if (body && body.items) {
			return body.items.map((blockscoutTransaction) => ({
				hash: blockscoutTransaction.hash,

				to: blockscoutTransaction.to?.hash,
				from: blockscoutTransaction.from.hash,
				nonce: blockscoutTransaction.nonce,

				gasLimit: BigNumber.from(blockscoutTransaction.gas_limit),
				gasPrice: BigNumber.from(blockscoutTransaction.gas_price),

				value: BigNumber.from(blockscoutTransaction.value),
				chainId: this.chainId,

				confirmations: blockscoutTransaction.confirmations,
				blockNumber: blockscoutTransaction.block ?? undefined,

				timestamp: new Date(blockscoutTransaction.timestamp).getTime() / 1000
			}));
		}

		return [];
	};

	tokenTransactions = async ({
		address,
		contract: { address: contractAddress }
	}: {
		address: string;
		contract: { address: string };
	}): Promise<Transaction[]> => {
		const url = new URL(`${this.explorerUrl}/api`);
		url.searchParams.set('module', 'account');
		url.searchParams.set('action', 'tokentx');
		url.searchParams.set('contractaddress', contractAddress);
		url.searchParams.set('address', address);
		url.searchParams.set('startblock', '0');
		url.searchParams.set('endblock', '99999999');
		url.searchParams.set('sort', 'desc');

		// TODO: remove { mode: 'cors' }
		const response = await fetch(url, { mode: 'cors' });

		if (!response.ok) {
			throw new Error(`Fetching transactions with Blockscout API failed.`);
		}

		const { result }: { result: BlockscoutRestTransaction[] | string } = await response.json();

		if (typeof result === 'string') {
			throw new Error(result);
		}

		return result.map(
			({
				nonce,
				gas,
				gasPrice,
				hash,
				blockNumber,
				blockHash,
				timeStamp,
				confirmations,
				from,
				to,
				value
			}) => ({
				hash,
				blockNumber: parseInt(blockNumber),
				blockHash,
				timestamp: parseInt(timeStamp),
				confirmations,
				from,
				to,
				nonce: parseInt(nonce),
				gasLimit: BigNumber.from(gas),
				gasPrice: BigNumber.from(gasPrice),
				value: BigNumber.from(value),
				chainId: this.chainId
			})
		);
	};
}

const providers: Record<NetworkId, BlockscoutProvider> = {
	[BITFINITY_NETWORK_ID]: new BlockscoutProvider(
		Number(BITFINITY_NETWORK.chainId),
		BITFINITY_EXPLORER_URL
	)
};

export const blockscoutProviders = (networkId: NetworkId): BlockscoutProvider => {
	const provider = providers[networkId];

	assertNonNullish(
		provider,
		replacePlaceholders(get(i18n).init.error.no_json_rpc_provider, {
			$network: networkId.toString()
		})
	);

	return provider;
};
