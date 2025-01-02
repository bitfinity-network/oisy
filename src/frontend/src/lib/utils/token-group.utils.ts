import type { IcCkToken } from '$icp/types/ic-token';
import { isIcCkToken } from '$icp/validation/ic-token.validation';
import { ZERO } from '$lib/constants/app.constants';
import type { TokenId, TokenUi } from '$lib/types/token';
import type { TokenUiGroup, TokenUiOrGroupUi } from '$lib/types/token-group';
import { isRequiredTokenWithLinkedData, sumBalances, sumUsdBalances } from '$lib/utils/token.utils';
import { nonNullish } from '@dfinity/utils';

/**
 * Type guard to check if an object is of type TokenUiGroup.
 *
 * @param tokenUiOrGroupUi - The object to check.
 * @returns A boolean indicating whether the object is a TokenUiGroup.
 */
export const isTokenUiGroup = (
	tokenUiOrGroupUi: TokenUiOrGroupUi
): tokenUiOrGroupUi is TokenUiGroup =>
	typeof tokenUiOrGroupUi === 'object' &&
	'nativeToken' in tokenUiOrGroupUi &&
	'tokens' in tokenUiOrGroupUi;

/**
 * Factory function to create a TokenUiGroup based on the provided tokens and network details.
 * This function creates a group header and adds both the native token and the twin token to the group's tokens array.
 *
 * @param nativeToken - The native token used for the group, typically the original token or the one from the selected network.
 * @param tokens - The tokens to be grouped with the native token
 *
 * @returns A TokenUiGroup object that includes a header with network and symbol information and contains both the native and twin tokens.
 */
const createTokenGroup = ({
	nativeToken,
	tokens
}: {
	nativeToken: TokenUi;
	tokens: TokenUi[];
}): TokenUiGroup => ({
	id: nativeToken.id,
	nativeToken,
	tokens: [nativeToken, ...tokens] as [TokenUi, ...TokenUi[]],
	balance: tokens.reduce((acc, token) => sumBalances([acc, token.balance]), nativeToken.balance),
	usdBalance: tokens.reduce(
		(acc, token) => acc + (token.usdBalance ?? 0),
		nativeToken.usdBalance ?? 0
	)
});

/**
 * Function to create a list of TokenUiOrGroupUi by grouping tokens with matching twinTokenSymbol.
 * The group is placed in the position where the first token of the group was found.
 * Tokens with no twin remain as individual tokens in their original position.
 *
 * @param tokens - The list of TokenUi objects to group. Each token may or may not have a twinTokenSymbol.
 *                 Tokens with a twinTokenSymbol are grouped together.
 *
 * @returns A new list where tokens with twinTokenSymbols are grouped into a TokenUiGroup,
 *          and tokens without twins remain in their original place.
 *          The group replaces the first token of the group in the list.
 */
export const groupTokensByTwin = (tokens: TokenUi[]): TokenUiOrGroupUi[] => {
	const groupedTokenTwins = new Set<string>();
	const mappedTokensWithGroups: TokenUiOrGroupUi[] = tokens.map((token) => {
		if (!isRequiredTokenWithLinkedData(token)) {
			return token;
		}

		if (groupedTokenTwins.has(token.symbol)) {
			return token;
		}

		// Check if this is a Bitfinity token and its base token exists
		if (token.symbol.startsWith('o') && isRequiredTokenWithLinkedData(token)) {
			const baseToken = tokens.find(
				(t) => t.symbol === token.twinTokenSymbol && t.decimals === token.decimals
			);
			if (baseToken && !groupedTokenTwins.has(baseToken.symbol)) {
				groupedTokenTwins.add(token.symbol);
				groupedTokenTwins.add(baseToken.symbol);
				return createTokenGroup({
					nativeToken: baseToken,
					tokens: [{ ...token, enabled: true }]
				});
			}
			return token;
		}

		const relatedTokens: TokenUi[] = [];

		// Find ckToken twin
		const ckTwinToken = tokens.find(
			(t) => t.symbol === token.twinTokenSymbol && isIcCkToken(t) && t.decimals === token.decimals
		) as IcCkToken | undefined;

		if (ckTwinToken && !groupedTokenTwins.has(ckTwinToken.symbol)) {
			relatedTokens.push({ ...ckTwinToken, enabled: true });
			groupedTokenTwins.add(ckTwinToken.symbol);
		}

		// Find Bitfinity token twin (starts with 'o')
		const bitfinityTwinToken = tokens.find(
			(t) =>
				(t.symbol === `o${token.symbol}` && t.decimals === token.decimals) ||
				(t.symbol.startsWith('o') &&
					isRequiredTokenWithLinkedData(t) &&
					t.twinTokenSymbol === token.symbol &&
					t.decimals === token.decimals)
		);

		if (bitfinityTwinToken && !groupedTokenTwins.has(bitfinityTwinToken.symbol)) {
			relatedTokens.push({ ...bitfinityTwinToken, enabled: true });
			groupedTokenTwins.add(bitfinityTwinToken.symbol);
		}

		if (relatedTokens.length > 0) {
			groupedTokenTwins.add(token.symbol);
			return createTokenGroup({
				nativeToken: token,
				tokens: relatedTokens
			});
		}

		return token;
	});

	return mappedTokensWithGroups
		.filter((t) => isTokenUiGroup(t) || !groupedTokenTwins.has(t.symbol))
		.sort(
			(a, b) =>
				(b.usdBalance ?? 0) - (a.usdBalance ?? 0) ||
				+(b.balance ?? ZERO).gt(a.balance ?? ZERO) - +(b.balance ?? ZERO).lt(a.balance ?? ZERO)
		);
};

const mapNewTokenGroup = (token: TokenUi): TokenUiGroup => ({
	id: token.id,
	nativeToken: token,
	tokens: [token],
	balance: token.balance,
	usdBalance: token.usdBalance
});

interface GroupTokenParams {
	token: TokenUi;
	tokenGroup: TokenUiGroup | undefined;
}

interface UpdateTokenGroupParams extends GroupTokenParams {
	tokenGroup: TokenUiGroup;
}

/**
 * Function to update a token group with a new token.
 *
 * This function purely adds the token to the group, updating the group's balance and USD balance.
 * It does not concern itself with whether the token is a "main token" or a "secondary token".
 *
 * @param {UpdateTokenGroupParams} params - The parameters for the function.
 * @param {TokenUi} params.token - The token to add to the group.
 * @param {TokenUiGroup} params.tokenGroup - The group where the token should be added.
 * @returns {TokenUiGroup} The updated group with the new token.
 */
export const updateTokenGroup = ({ token, tokenGroup }: UpdateTokenGroupParams): TokenUiGroup => ({
	...tokenGroup,
	tokens: [...tokenGroup.tokens, token],
	balance: sumBalances([tokenGroup.balance, token.balance]),
	usdBalance: sumUsdBalances([tokenGroup.usdBalance, token.usdBalance])
});

/**
 * Function to group a "main token" with an existing group or create a new group with the token as the "main token".
 *
 * If the token has no "main token", it is either a "main token" for an existing group,
 * or a "main token" for a group that still does not exist, or a single-element group (but still its "main token").
 *
 * @param {GroupTokenParams} params - The parameters for the function.
 * @param {TokenUi} params.token - The "main token" to group.
 * @param {TokenUiGroup} params.tokenGroup - The group where the "main token" should be added, if it exists.
 * @returns {TokenUiGroup} The updated group with the "main token", or a new group with the "main token".
 */
export const groupMainToken = ({ token, tokenGroup }: GroupTokenParams): TokenUiGroup =>
	nonNullish(tokenGroup)
		? {
				...updateTokenGroup({ token, tokenGroup }),
				// It overrides any possible "main token" placeholder.
				id: token.id,
				nativeToken: token
			}
		: mapNewTokenGroup(token);

/**
 * Function to group a "secondary token" with an existing group or create a new group with the token as a "secondary token".
 *
 * If a group already exists for the "main token" of the current token, add it to the existing group.
 * Otherwise, create a new group with the current token as a placeholder "main token".
 * This is to avoid that the group is created with an empty "main token", if the current token's "main token" is not in the list.
 * Instead, it should be considered a single-element group, until the "main token" may or may not be found.
 *
 * @param {GroupTokenParams} params - The parameters for the function.
 * @param {TokenUi} params.token - The "secondary token" to group.
 * @param {TokenUiGroup} params.tokenGroup - The group where the "secondary token" should be added, if it exists.
 * @returns {TokenUiGroup} The updated group with the "secondary token", or a new group with the "secondary token".
 */
export const groupSecondaryToken = ({ token, tokenGroup }: GroupTokenParams): TokenUiGroup =>
	nonNullish(tokenGroup) ? updateTokenGroup({ token, tokenGroup }) : mapNewTokenGroup(token);

/**
 * Function to create a list of TokenUiGroup by grouping tokens with matching twinTokenSymbol.
 * The group is placed in the position where the first token of the group was found.
 * Tokens with no twin remain as individual tokens in their original position.
 *
 * @param tokens - The list of TokenUi objects to group. Each token may or may not have a twinTokenSymbol.
 *                 Tokens with a twinTokenSymbol are grouped together.
 *
 * @returns A new list where tokens with twinTokenSymbols are grouped into a TokenUiGroup,
 *          and tokens without twins remain in their original place.
 *          The group replaces the first token of the group in the list.
 */
export const groupTokens = (tokens: TokenUi[]): TokenUiGroup[] => {
	const tokenGroupsMap = tokens.reduce<{
		[id: TokenId]: TokenUiGroup | undefined;
	}>(
		(acc, token) => ({
			...acc,
			...(isIcCkToken(token) &&
			nonNullish(token.twinToken) &&
			// TODO: separate the check for decimals from the rest, since it seems important to the logic.
			token.decimals === token.twinToken.decimals
				? // If the token has a twinToken, and both have the same decimals, group them together.
					{
						[token.twinToken.id]: groupSecondaryToken({
							token,
							tokenGroup: acc[token.twinToken.id]
						})
					}
				: {
						[token.id]: groupMainToken({
							token,
							tokenGroup: acc[token.id]
						})
					})
		}),
		{}
	);

	return Object.getOwnPropertySymbols(tokenGroupsMap).map(
		(id) => tokenGroupsMap[id as TokenId] as TokenUiGroup
	);
};
