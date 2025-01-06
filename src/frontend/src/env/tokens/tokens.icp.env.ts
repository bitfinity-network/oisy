import { ICP_EXPLORER_URL } from '$env/explorers.env';
import { ICP_NETWORK } from '$env/networks.env';
import { ICP_INDEX_CANISTER_ID, ICP_LEDGER_CANISTER_ID } from '$env/networks.icp.env';
import icpLight from '$icp/assets/icp_light.svg';
import { ICP_TRANSACTION_FEE_E8S } from '$icp/constants/icp.constants';
import type { IcToken } from '$icp/types/ic-token';
import type { RequiredToken, TokenId, TokenWithLinkedData } from '$lib/types/token';
import { parseTokenId } from '$lib/validation/token.validation';

/**
 * ICP
 */
export const ICP_SYMBOL = 'ICP';

export const ICP_TOKEN_ID: TokenId = parseTokenId(ICP_SYMBOL);

export const ICP_TOKEN: RequiredToken<IcToken & TokenWithLinkedData> = {
	id: ICP_TOKEN_ID,
	network: ICP_NETWORK,
	standard: 'icp',
	category: 'default',
	exchangeCoinId: 'internet-computer',
	position: 0,
	name: 'Internet Computer',
	symbol: ICP_SYMBOL,
	decimals: 8,
	icon: icpLight,
	fee: ICP_TRANSACTION_FEE_E8S,
	ledgerCanisterId: ICP_LEDGER_CANISTER_ID,
	indexCanisterId: ICP_INDEX_CANISTER_ID,
	explorerUrl: ICP_EXPLORER_URL,
	twinTokenSymbol: 'oICP',
	buy: {
		onramperId: 'icp_icp'
	},
	enabled: true
};
