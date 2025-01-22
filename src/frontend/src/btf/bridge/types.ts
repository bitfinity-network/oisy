import type { OptionIdentity } from '$lib/types/identity';
export interface BitfinityChain {
	chainId: string;
	canisterId: string;
	portContractAddress: string;
	evmChain: {
		id: number;
		name: string;
		network: string;
		nativeCurrency: {
			name: string;
			symbol: string;
			decimals: number;
		};
		rpcUrls: {
			default: {
				http: string[];
				webSocket?: string[];
			};
		};
	};
}
export enum ChainName {
	ICP = 'ICP',
	Bitcoin = 'Bitcoin',
	BEVM = 'BEVM',
	BitLayer = 'Bitlayer',
	BSquared = 'B² Network',
	XLayer = 'X Layer',
	Merlin = 'Merlin',
	Bob = 'Bob',
	Rootstock = 'Rootstock',
	Bitfinity = 'Bitfinity',
	AILayer = 'AILayer',
	Solana = 'Solana',
	Ethereum = 'Ethereum'
}
export enum ChainID {
	eICP = 'eICP',
	Bitcoin = 'Bitcoin',
	BEVM = 'bevm',
	BitLayer = 'Bitlayer',
	BSquared = 'B² Network',
	XLayer = 'X Layer',
	Merlin = 'Merlin',
	Bob = 'Bob',
	RootStock = 'RootStock',
	Bitfinity = 'Bitfinity',
	AILayer = 'AILayer',
	sICP = 'sICP',
	Solana = 'eSolana',
	Ethereum = 'Ethereum'
}
export enum ChainType {
	Settlement = 'SettlementChain',
	ExecutionChain = 'ExecutionChain'
}

export enum ChainState {
	Active = 'Active',
	Deactive = 'Deactive'
}
export enum ServiceType {
	Route = 'Route',
	Customs = 'Customs'
}
export interface Chain {
	chainId: ChainID;
	chainName: ChainName;
	canisterId: string;
	feeToken: string[];
	chainType: ChainType;
	counterparties: ChainID[];
	chainState: ChainState;
	contractAddress?: string;
	evmChain?: {
		id: number;
		name: string;
		network: string;
		nativeCurrency: {
			name: string;
			symbol: string;
			decimals: number;
		};
		rpcUrls: {
			default: {
				http: string[];
				webSocket?: string[];
			};
		};
	};
	serviceType: ServiceType;
	tokenList?: Token[];
}

export interface Token {
	id: string; // ICP: canisterId, BTC: rune_id, EVM: contract address
	name: string;
	symbol: string;
	decimals: number;
	icon?: string;
	balance: bigint;
	token_id: string;
	fee: bigint;
	chain_id: ChainID;
	composed_balance?: {
		available: bigint;
	};
}

export interface BridgeToEvmParams {
	tokenId: string;
	targetEvmAddress: string;
	amount: bigint;
	identity: OptionIdentity;
}

export interface BridgeFee {
	fee: bigint;
	symbol: string;
	decimals: number;
}

export interface BridgeTicket {
	ticketId: string;
	tokenId: string;
}

export type BridgeStatus = 'Pending' | 'Processing' | 'Finalized' | 'Failed';

export interface BridgeStatusResult {
	status: BridgeStatus;
	evmTxHash?: string;
}

export interface OnBridgeParams {
	token: Token;
	amount: bigint;
	sourceAddr: string;
	targetAddr: string;
	targetChainId: ChainID;
	setStep?: (step: number) => void;
	feeRate?: number;
}
