import oneInch from '$eth/assets/1inch.svg';
import bitfinity from '$eth/assets/bitfinity.svg';
import chapx from '$eth/assets/chapx.svg';
import ckbtc from '$eth/assets/ckbtc.svg';
import ckusdc from '$eth/assets/ckusdc.svg';
import dai from '$eth/assets/dai.svg';
import dmail from '$eth/assets/dmail.svg';
import floki from '$eth/assets/floki.svg';
import icpDark from '$eth/assets/icp_dark.svg';
import jasmy from '$eth/assets/jasmy.svg';
import lendfinity from '$eth/assets/lendfinity.png';
import matic from '$eth/assets/matic.svg';
import rndr from '$eth/assets/rndr.svg';
import sonic from '$eth/assets/sonic.svg';
import weeth from '$eth/assets/weeth.svg';
import weth from '$eth/assets/weth.svg';
import type { Erc20Contract, Erc20Metadata, Erc20Token } from '$eth/types/erc20';
import type { Erc20UserToken, EthereumUserToken } from '$eth/types/erc20-user-token';
import type { EthereumNetwork } from '$eth/types/network';
import type { Token } from '$lib/types/token';
import type { UserTokenState } from '$lib/types/token-toggleable';

import { parseTokenId } from '$lib/validation/token.validation';

type MapErc20TokenParams = Erc20Contract &
	Erc20Metadata & { network: EthereumNetwork } & Pick<Token, 'category'> &
	Partial<Pick<Token, 'id'>>;

export const mapErc20Token = ({ id, symbol, name, ...rest }: MapErc20TokenParams): Erc20Token => ({
	id: id ?? parseTokenId(symbol),
	standard: 'erc20',
	name,
	symbol,
	icon: mapErc20Icon(symbol),
	...rest
});

export const mapErc20UserToken = ({
	id,
	symbol,
	name,
	network,
	...rest
}: MapErc20TokenParams & UserTokenState): Erc20UserToken => ({
	id: id ?? parseTokenId(`user-token#${symbol}#${network.chainId}`),
	standard: 'erc20',
	name,
	symbol,
	icon: mapErc20Icon(symbol),
	network,
	...rest
});

const mapErc20Icon = (symbol: string): string | undefined => {
	switch (symbol.toLowerCase()) {
		case 'dai':
			return dai;
		case 'dmail':
			return dmail;
		case 'floki':
			return floki;
		case 'jasmy':
			return jasmy;
		case 'matic':
			return matic;
		case 'rndr':
			return rndr;
		case 'weeth':
			return weeth;
		case 'weth':
			return weth;
		case '1inch':
			return oneInch;
		// ICP in production. ckICP was used on staging because the definitive name and symbol had not been decided.
		case 'icp':
		case 'ckicp':
		case 'lbfticp':
		case 'xicptest':
			return icpDark;
		// bitfinity
		case 'ckbtc':
		case 'lbftckbtc':
			return ckbtc;
		case 'lbftnicp':
		case 'variabledebtbftckbtc':
		case 'variabledebtbftckusdc':
		case 'variabledebtbftckusdt':
			return lendfinity;
		case 'wbft':
		case 'lbftwbft':
			return bitfinity;
		case 'chapx':
		case 'lbftchapx':
			return chapx;
		case 'sonic':
		case 'sonictest1':
			return sonic;
		case 'ckusdc':
			return ckusdc;
		default:
			return undefined;
	}
};

export const icTokenEthereumUserToken = (token: Token): token is EthereumUserToken =>
	(token.standard === 'ethereum' || token.standard === 'erc20') && 'enabled' in token;

export const icTokenErc20UserToken = (token: Token): token is Erc20UserToken =>
	token.standard === 'erc20' && 'enabled' in token && 'address' in token && 'exchange' in token;
