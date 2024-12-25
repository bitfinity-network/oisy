import { BITFINITY_NETWORK, ETHEREUM_NETWORK_SYMBOL } from '$env/networks.env';
import bitfinityTokens from '$env/tokens.bitfinity.json';
import { BTC_MAINNET_SYMBOL } from '$env/tokens/tokens.btc.env';
import { ICP_SYMBOL } from '$env/tokens/tokens.icp.env';
import type { RequiredTokenWithLinkedData } from '$lib/types/token';
import type { TokenToggleable } from '$lib/types/token-toggleable';
import { parseTokenId } from '$lib/validation/token.validation';
import { USDC_SYMBOL } from './tokens-erc20/tokens.usdc.env';
import { USDT_SYMBOL } from './tokens-erc20/tokens.usdt.env';

export interface BitfinityTokenConfig {
	symbol: string;
	oSymbol: string;
	decimals: number;
	name: string;
	oName: string;
	address: string;
}

export interface BitfinityTokensConfig {
	[key: string]: BitfinityTokenConfig;
}

export type BitfinityToken = RequiredTokenWithLinkedData &
	TokenToggleable<RequiredTokenWithLinkedData> & {
		address: string;
		exchange: string;
		standard: string;
	};

// List of native tokens that are enabled by default
const DEFAULT_ENABLED_TOKENS = [
	BTC_MAINNET_SYMBOL,
	ETHEREUM_NETWORK_SYMBOL,
	ICP_SYMBOL,
	USDT_SYMBOL,
	USDC_SYMBOL
];

// Create tokens for Bitfinity variants
export const createBitfinityToken = (config: BitfinityTokenConfig): BitfinityToken => ({
	id: parseTokenId(config.oSymbol),
	network: BITFINITY_NETWORK,
	standard: 'erc20',
	exchange: 'erc20',
	category: 'custom',
	name: config.oName,
	symbol: config.oSymbol,
	decimals: config.decimals,
	address: config.address,
	icon: BITFINITY_NETWORK.icon!,
	twinTokenSymbol: config.symbol,
	enabled: DEFAULT_ENABLED_TOKENS.includes(config.symbol),
	version: undefined
});

// Create all Bitfinity tokens
export const BITFINITY_TOKENS: BitfinityToken[] = Object.values(
	bitfinityTokens as BitfinityTokensConfig
).map(createBitfinityToken);

// Export individual tokens for direct use
export const BITFINITY_BTC_TOKEN = BITFINITY_TOKENS.find((token) => token.symbol === 'oBTC')!;
export const BITFINITY_ETH_TOKEN = BITFINITY_TOKENS.find((token) => token.symbol === 'oETH')!;
export const BITFINITY_USDT_TOKEN = BITFINITY_TOKENS.find((token) => token.symbol === 'oUSDT')!;
export const BITFINITY_USDC_TOKEN = BITFINITY_TOKENS.find((token) => token.symbol === 'oUSDC')!;
