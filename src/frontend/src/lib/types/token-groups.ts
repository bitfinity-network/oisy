import type { Token } from './token';

export interface BridgeTokens {
	ckERC20: Token[];
}

export interface NonBridgeTokens {
	sns: Token[];
	native: Token[];
}

export interface TokenGroups {
	bridgeTokens: BridgeTokens;
	nonBridgeTokens: NonBridgeTokens;
}

export const isBridgeToken = ({ standard, symbol }: Token): boolean =>
	standard === 'erc20' && symbol.toLowerCase().startsWith('ck');

export const isNativeToken = ({ standard }: Token): boolean =>
	standard === 'icp' || standard === 'icrc';

export const isSnsToken = ({ standard, category }: Token): boolean =>
	standard === 'icrc' && category === 'custom';

export const groupTokens = (tokens: Token[]): TokenGroups =>
	tokens.reduce<TokenGroups>(
		(groups, token) => {
			if (isBridgeToken(token)) {
				groups.bridgeTokens.ckERC20.push(token);
			} else if (isSnsToken(token)) {
				groups.nonBridgeTokens.sns.push(token);
			} else if (isNativeToken(token)) {
				groups.nonBridgeTokens.native.push(token);
			}
			return groups;
		},
		{
			bridgeTokens: { ckERC20: [] },
			nonBridgeTokens: { sns: [], native: [] }
		}
	);
